// Request parsing: JSON bodies (objects only), query strings and route params,
// each checked against a (strict) zod schema.
import type { z } from "zod";
import type { ApiIssue } from "./errors";
import { ApiError } from "./errors";
import { zodIssues } from "./handler";

const MAX_BODY_BYTES = 16 * 1024;
const JSON_CONTENT_TYPE = /^application\/(?:[\w.+-]+\+)?json(?:\s*;.*)?$/i;

/**
 * Parses and validates a JSON body. Throws ApiError (400/415) for a missing or
 * malformed body; schema failures throw ZodError, which withApi maps to 400.
 */
export async function parseJson<S extends z.ZodType>(
  request: Request,
  schema: S
): Promise<z.infer<S>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!JSON_CONTENT_TYPE.test(contentType.trim())) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Send the request body as application/json.");
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new ApiError(400, "INVALID_BODY", "The request body is too large.");
  }
  if (!text.trim()) {
    throw new ApiError(400, "INVALID_JSON", "The request body is empty.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new ApiError(400, "INVALID_JSON", "The request body is not valid JSON.");
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new ApiError(400, "INVALID_BODY", "The request body must be a JSON object.");
  }

  return schema.parse(parsed);
}

/**
 * Validates the URL query string against a (strict) zod schema. Repeated keys
 * (?page=1&page=2) are rejected; unknown keys fail the strict schema (400).
 */
export function parseQuery<S extends z.ZodType>(request: Request, schema: S): z.infer<S> {
  const params = new URL(request.url).searchParams;
  const query: Record<string, string> = {};
  const duplicates: ApiIssue[] = [];
  for (const [key, value] of params) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      duplicates.push({ path: key, code: "duplicate_param", message: "Query parameter given more than once." });
    }
    query[key] = value;
  }
  if (duplicates.length) {
    throw new ApiError(400, "VALIDATION_FAILED", "The query string is invalid.", { details: duplicates });
  }
  const result = schema.safeParse(query);
  if (!result.success) {
    throw new ApiError(400, "VALIDATION_FAILED", "The query string is invalid.", {
      details: zodIssues(result.error),
    });
  }
  return result.data;
}

/** Validates dynamic route segments (e.g. [id]) against a zod schema (400 on failure). */
export function parseParams<S extends z.ZodType>(params: unknown, schema: S): z.infer<S> {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw new ApiError(400, "VALIDATION_FAILED", "The URL path is invalid.", {
      details: zodIssues(result.error),
    });
  }
  return result.data;
}
