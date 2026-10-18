// Tiny in-memory, fixed-window rate limiter for write endpoints.
// PER SERVER INSTANCE ONLY: counts are not shared between instances and reset on
// restart. It's a guard against accidental loops and casual abuse, not a security
// boundary. Use a shared store (e.g. Redis) once there's more than one instance.
import { ApiError } from "./errors";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export const WRITE_LIMIT = { limit: 20, windowMs: 60_000 } as const;

export function enforceRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number } = WRITE_LIMIT,
  now: number = Date.now()
): void {
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) sweep(now);
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait and try again.", {
      headers: { "Retry-After": String(retryAfter) },
    });
  }
}

function sweep(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
  if (buckets.size >= MAX_KEYS) buckets.clear();
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}
