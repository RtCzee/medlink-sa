// Request-body parsing: JSON only, objects only, then a (strict) zod schema.
import type { z } from "zod";
import { ApiError } from "./errors";

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
