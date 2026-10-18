// Route wrapper for /api/* handlers: request ids, a consistent JSON envelope,
// error mapping, no-store caching and structured logs (no bodies, tokens or PII).
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError, type ApiIssue } from "./errors";

export type ApiContext = { requestId: string };
export type ApiHandler = (request: Request, ctx: ApiContext) => Promise<Response>;

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

export function withApi(route: string, handler: ApiHandler) {
  return async function apiRoute(request: Request): Promise<Response> {
    const started = Date.now();
    const incoming = request.headers.get(REQUEST_ID_HEADER);
    const requestId =
      incoming && REQUEST_ID_PATTERN.test(incoming) ? incoming : crypto.randomUUID();

    let response: Response;
    let failure: unknown;
    try {
      response = await handler(request, { requestId });
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

    // Every API response is private and per-user.
    response.headers.set("Cache-Control", "no-store");
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
  };
}
