// Route wrapper for /api/* handlers: request ids, a consistent JSON envelope,
// error mapping, no-store caching and structured logs (no bodies, tokens or PII).
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, type ApiIssue } from "./errors";

export type ApiContext = { requestId: string };
export type ApiHandler = (request: Request, ctx: ApiContext) => Promise<Response>;

/** Dynamic segments of a route, e.g. { id: string } for app/api/facilities/[id]. */
export type RouteParams = Record<string, string>;
export type ApiParamsContext<P extends RouteParams> = ApiContext & { params: P };
export type ApiParamsHandler<P extends RouteParams> = (
  request: Request,
  ctx: ApiParamsContext<P>
) => Promise<Response>;

export type ApiOptions = {
  /**
   * Cache-Control for SUCCESSFUL (2xx) responses only. Use solely for public,
   * non-personalised data whose route never reads cookies or auth headers and is
   * excluded from the session-refresh proxy (so no Set-Cookie). Errors and every
   * other route always get "no-store".
   */
  cacheControl?: string;
};

export type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };

export type ApiSuccessBody<T> = { data: T };
export type ApiErrorBody = {
  error: { code: string; message: string; details?: ApiIssue[] };
  requestId: string;
};

const REQUEST_ID_HEADER = "x-request-id";
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._:-]{8,128}$/;
const PRISMA_UNAVAILABLE_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024"]);

/** 200/201 JSON success response: { data }. */
export function json<T>(data: T, status: 200 | 201 = 200): Response {
  return NextResponse.json<ApiSuccessBody<T>>({ data }, { status });
}

/** 200 paginated list: { data: [...], meta: { page, pageSize, total, totalPages } }. */
export function jsonPage<T>(
  items: T[],
  { page, pageSize, total }: { page: number; pageSize: number; total: number }
): Response {
  const meta: PageMeta = { page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  return NextResponse.json<ApiSuccessBody<T[]> & { meta: PageMeta }>({ data: items, meta });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function zodIssues(error: ZodError): ApiIssue[] {
  // Only path, code and message: input values are never echoed back.
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join("."),
    code: issue.code,
    message: issue.message,
    ...(issue.code === "unrecognized_keys" ? { keys: issue.keys } : {}),
  }));
}

function toApiError(error: unknown): ApiError | null {
  if (error instanceof ApiError) return error;
  if (error instanceof ZodError) {
    return new ApiError(400, "VALIDATION_FAILED", "The request body is invalid.", {
      details: zodIssues(error),
    });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return new ApiError(404, "NOT_FOUND", "The requested resource was not found.");
    }
    if (error.code === "P2002") {
      return new ApiError(409, "CONFLICT", "That change conflicts with existing data.");
    }
    if (PRISMA_UNAVAILABLE_CODES.has(error.code)) {
      return serviceUnavailable();
    }
    return null;
  }
  if (
    error instanceof Prisma.PrismaClientInitializationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return serviceUnavailable();
  }
  return null;
}

function serviceUnavailable() {
  return new ApiError(
    503,
    "SERVICE_UNAVAILABLE",
    "The service is temporarily unavailable. Please try again shortly."
  );
}

function errorCodeOf(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === "string" && /^[A-Za-z0-9_]{1,40}$/.test(code)) return code;
  }
  return undefined;
}

function log(level: "info" | "warn" | "error", entry: Record<string, unknown>) {
  if (level === "info" && process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({ level, ts: new Date().toISOString(), ...entry });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
}

/** Wraps a handler for a route without dynamic segments. */
export function withApi(route: string, handler: ApiHandler, options: ApiOptions = {}) {
  return function apiRoute(request: Request): Promise<Response> {
    return runApi(route, request, options, (requestId) => handler(request, { requestId }));
  };
}

/**
 * Wraps a handler for a dynamic route (e.g. [id]). Next.js passes the segment
 * values as a Promise; they are awaited inside the error boundary, so the handler
 * receives plain values and must still validate them.
 */
export function withApiParams<P extends RouteParams>(
  route: string,
  handler: ApiParamsHandler<P>,
  options: ApiOptions = {}
) {
  return function apiRoute(
    request: Request,
    routeContext: { params: Promise<P> }
  ): Promise<Response> {
    return runApi(route, request, options, async (requestId) =>
      handler(request, { requestId, params: await routeContext.params })
    );
  };
}

async function runApi(
  route: string,
  request: Request,
  options: ApiOptions,
  invoke: (requestId: string) => Promise<Response>
): Promise<Response> {
  const started = Date.now();
  const incoming = request.headers.get(REQUEST_ID_HEADER);
  const requestId =
    incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID();

  let response: Response;
  let failure: unknown;
  try {
    response = await invoke(requestId);
  } catch (error) {
    failure = error;
    const apiError =
      toApiError(error) ??
      new ApiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
    const body: ApiErrorBody = {
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details ? { details: apiError.details } : {}),
      },
      requestId,
    };
    response = NextResponse.json(body, { status: apiError.status });
    Object.entries(apiError.headers ?? {}).forEach(([key, value]) =>
      response.headers.set(key, value)
    );
  }

  // Private by default. Only successful responses of routes that opt in (public
  // directory data) get a shared-cache policy.
  const cacheable = options.cacheControl && response.status >= 200 && response.status < 300;
  response.headers.set("Cache-Control", cacheable ? options.cacheControl! : "no-store");
  response.headers.set(REQUEST_ID_HEADER, requestId);

  const entry: Record<string, unknown> = {
    msg: "api_request",
    requestId,
    route,
    method: request.method,
    status: response.status,
    durationMs: Date.now() - started,
  };
  if (failure !== undefined) {
    // Name and code only: messages can contain SQL, ids or other internals.
    entry.errorName = failure instanceof Error ? failure.name : typeof failure;
    const code = failure instanceof ApiError ? failure.code : errorCodeOf(failure);
    if (code) entry.errorCode = code;
  }
  log(response.status >= 500 ? "error" : response.status >= 400 ? "warn" : "info", entry);
  return response;
}
