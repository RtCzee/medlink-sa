# API conventions

Applies to every endpoint under `/api/*` (handlers in `web/src/app/api/`, shared
code in `web/src/lib/api/`).

## Envelope

Success:

```json
{ "data": { "...": "..." } }
```

Paginated lists add a top-level `meta`:

```json
{ "data": [ { "...": "..." } ], "meta": { "page": 1, "pageSize": 20, "total": 57, "totalPages": 3 } }
```

Error (never with a 2xx status):

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "The request body is invalid.",
    "details": [{ "path": "", "code": "unrecognized_keys", "message": "Unrecognized key: \"role\"", "keys": ["role"] }]
  },
  "requestId": "6f0c1c9e-..."
}
```

- `details` appears only for validation errors. It has the field path, a code and a
  message. Submitted values are never echoed back.
- No stack traces, SQL, database messages or secrets appear in responses.
- Every response has an `x-request-id` header. Send your own (8-128 chars, `A-Z a-z 0-9 . _ : -`)
  to correlate logs; otherwise one is generated. Quote it when reporting problems.

## Error codes

| Status | Code | When |
| --- | --- | --- |
| 400 | `INVALID_JSON` | Body empty or not valid JSON |
| 400 | `INVALID_BODY` | Body is not a JSON object, or is larger than 16 KB |
| 400 | `VALIDATION_FAILED` | Body or query failed the schema: unknown/protected field, bad value, no fields, invalid id, unknown or repeated query parameter |
| 401 | `UNAUTHENTICATED` | No session, invalid/expired token, or malformed `Authorization` header |
| 403 | `FORBIDDEN` | Cookie-authenticated write from another origin; wrong role (`requireRole`) |
| 404 | `PROFILE_NOT_FOUND` | Your `profiles` row doesn't exist |
| 404 | `SETTINGS_NOT_FOUND` | Your `user_settings` row doesn't exist |
| 404 | `FACILITY_NOT_FOUND` | No facility with that id |
| 404 | `PRACTITIONER_NOT_FOUND` | No practitioner with that id |
| 404 | `NOT_FOUND` | Generic missing record |
| 409 | `CONFLICT` | Unique-constraint conflict |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Write without `Content-Type: application/json` |
| 429 | `RATE_LIMITED` | Too many writes; see `Retry-After` |
| 500 | `INTERNAL_ERROR` | Unexpected error (generic message; details only in server logs) |
| 503 | `SERVICE_UNAVAILABLE` | Database or Supabase Auth unreachable |

A missing profile or settings row means the signup trigger didn't run. The API does
**not** create rows on read or upsert on write: the database trigger owns creation, and
silently creating rows would hide that fault. Contact support or re-run the trigger
backfill.

## Authentication

**Private endpoints** (`/api/profile`, `/api/settings`) make exactly one Supabase Auth
`getUser` call per request, which verifies the user with the Auth server (so revoked
or deleted sessions are rejected).

- **Web app:** the Supabase session cookie, sent automatically on same-site requests.
  Writes with a cookie session must be same-origin. If an `Origin` header is sent, it
  must match the host, otherwise 403.
- **Mobile / other clients:** `Authorization: Bearer <Supabase access token>`. It takes
  precedence over cookies. An invalid or malformed header is a 401 and never falls back
  to cookies.

The API never trusts user ids, emails or roles from the client. Identity comes only
from the verified token, and roles come from `profiles.role` in the database.
Unauthenticated calls get a JSON 401. `proxy.ts` only redirects `/dashboard*` pages
to `/sign-in`; it never redirects `/api/*`.

**Public endpoints** (`/api/facilities*`, `/api/practitioners*`) need no sign-in. This
matches the database grants: `anon` can read all `facilities` columns and the
practitioner directory columns. These routes never call `getUser` or read cookies. A
session, if sent, is ignored.

## Ownership, data exposure and RLS: important

Prisma connects with `DATABASE_URL` as a **privileged role that bypasses Row Level
Security**. RLS still protects direct Supabase (PostgREST) access, but in these routes
the rules are enforced **in code**:

- **Private data:** every query's `where` uses the verified session user id
  (`profiles.id`, `user_settings.user_id`), never a value from the request. Strict
  schemas reject any field that isn't explicitly editable.
- **Public data:** the explicit Prisma `select` constants and DTO mappers in
  `web/src/lib/api/directory.ts` are the exposure boundary. Practitioners never return
  `profileId` (login link) or `licenseNumber`. A compile-time guard and tests enforce
  this, and the DTO mapper drops any extra field even if it were selected by mistake.

## Caching

- **Private endpoints and all error responses:** `Cache-Control: no-store`.
- **Successful public directory responses:** `Cache-Control: public, max-age=60, s-maxage=300`.
  This is safe because those routes:
  1. never read cookies or auth headers, so the response doesn't vary per user; and
  2. are excluded from the session-refresh proxy (`web/src/proxy.ts` matcher), so they
     can never carry a `Set-Cookie` from a token refresh.

  Directory edits may take up to 5 minutes to show through shared caches.

## Pagination

List endpoints take `page` (default 1, 1-1000) and `pageSize` (default 20, 1-100) and
return `meta.total` and `meta.totalPages`. Lists are ordered by name, then id, so
paging is stable. The offset is at most 99,900 rows. The page and the count run in one
batched transaction (`prisma.$transaction([findMany, count])`).

## Rate limiting

PATCH endpoints allow 20 writes per user per minute. The limiter is **in-memory and
per server instance**: it is not shared between instances and resets on restart. It
is a guard against loops and casual abuse, not a security boundary. Public GETs are not
rate-limited (a per-instance limiter adds little there); rely on the platform or a CDN
if needed.

## Logging

Each request logs one JSON line: `requestId`, `route`, `method`, `status`,
`durationMs`, plus `errorName`/`errorCode` on failures. Bodies, tokens, cookies,
emails and error messages are never logged. Prisma logs warnings and errors only;
query logging is off.

## Tests

`npm test` (in `web/`) runs MOCKED unit tests (Vitest). Supabase Auth and Prisma are
mocked, so there's no network or database access. It also runs the OpenAPI contract
test. Live checks need a running server, real data and, for private endpoints, a real
signed-in session (see `endpoints.md`).
