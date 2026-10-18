# MedLink SA web API (Milestone 1)

JSON endpoints under `/api/*` in the Next.js app. All responses are private:
`Cache-Control: no-store`. OpenAPI is planned, not written yet.

## Envelope

Success:

```json
{ "data": { "...": "..." } }
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

### Error codes

| Status | Code | When |
| --- | --- | --- |
| 400 | `INVALID_JSON` | Body empty or not valid JSON |
| 400 | `INVALID_BODY` | Body is not a JSON object, or is larger than 16 KB |
| 400 | `VALIDATION_FAILED` | Schema failed: unknown/protected field, bad value, or no fields |
| 401 | `UNAUTHENTICATED` | No session, invalid/expired token, or malformed `Authorization` header |
| 403 | `FORBIDDEN` | Cookie-authenticated write from another origin; wrong role (`requireRole`) |
| 404 | `PROFILE_NOT_FOUND` | Your `profiles` row doesn't exist |
| 404 | `SETTINGS_NOT_FOUND` | Your `user_settings` row doesn't exist |
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

Exactly one Supabase Auth `getUser` call per request verifies the user with the
Auth server, so revoked or deleted sessions are rejected.

- **Web app:** the Supabase session cookie, sent automatically on same-site requests.
  Writes with a cookie session must be same-origin. If an `Origin` header is sent, it
  must match the host, otherwise 403.
- **Mobile / other clients:** `Authorization: Bearer <Supabase access token>`. It takes
  precedence over cookies. An invalid or malformed header is a 401 and never falls back
  to cookies.

The API never trusts user ids, emails or roles from the client. Identity comes only
from the verified token, and roles come from `profiles.role` in the database.

Unauthenticated API calls get a JSON 401. `proxy.ts` only redirects `/dashboard*` pages
to `/sign-in`; it never redirects `/api/*`.

## Ownership and RLS: important

Prisma connects with `DATABASE_URL` as a **privileged role that bypasses Row Level
Security**. RLS still protects direct Supabase (PostgREST) access, but in these routes
ownership is enforced **in code**:

- every query's `where` uses the verified session user id (`profiles.id`,
  `user_settings.user_id`), never a value from the request;
- `select` returns only the documented fields;
- strict schemas reject any field that isn't explicitly editable.

Both lookups are primary-key lookups (index-backed), so there are no unbounded queries.

## Rate limiting

PATCH endpoints allow 20 writes per user per minute. The limiter is **in-memory and
per server instance**: it is not shared between instances and resets on restart. It
is a guard against loops and casual abuse, not a security boundary.

## Endpoints

### `GET /api/profile`

```http
GET /api/profile
Cookie: sb-<ref>-auth-token=...        (or Authorization: Bearer <access token>)
```

```json
200
{
  "data": {
    "id": "8b1f...-uuid",
    "fullName": "Thandiwe Mokoena",
    "email": "thandi@example.com",
    "phone": "+27 82 123 4567",
    "role": "patient",
    "createdAt": "2026-10-19T08:00:00.000Z",
    "updatedAt": "2026-10-19T08:30:00.000Z"
  }
}
```

Errors: 401, 404 `PROFILE_NOT_FOUND`, 500/503.

### `PATCH /api/profile`

Editable fields: **`fullName`** (string, trimmed, 1-100 chars) and **`phone`** (string
or `null` to clear; at most 32 chars; digits, spaces, `+`, `-`, parentheses; 7-15 digits).
At least one field is required.

Not editable here:

- `email`: change it through Supabase Auth (`supabase.auth.updateUser({ email })`), which
  verifies the new address. A database trigger then copies it to `profiles`.
- `role`: assigned by administrators in the database only.
- `id`, `createdAt`, `updatedAt`: owned by the database.

Sending any of these, or any unknown field, is a 400 `VALIDATION_FAILED`.

```http
PATCH /api/profile
Content-Type: application/json

{ "fullName": "Thandiwe Mokoena", "phone": "+27 82 123 4567" }
```

Returns `200` with the same shape as `GET /api/profile`.
Errors: 400, 401, 403 (cross-site), 404 `PROFILE_NOT_FOUND`, 415, 429, 500/503.

### `GET /api/settings`

```json
200
{
  "data": {
    "language": "en",
    "theme": "system",
    "notificationsEnabled": true,
    "showEmergencyQr": true,
    "updatedAt": "2026-10-19T08:30:00.000Z"
  }
}
```

Errors: 401, 404 `SETTINGS_NOT_FOUND`, 500/503.

### `PATCH /api/settings`

Editable fields (at least one): `language` (`en` | `zu` | `af` | `st`), `theme`
(`system` | `light` | `dark`), `notificationsEnabled` (boolean), `showEmergencyQr`
(boolean). The values come from the Prisma enums `AppLanguage` and `AppTheme`.
`userId`, `createdAt` and `updatedAt` are rejected.

```http
PATCH /api/settings
Content-Type: application/json

{ "language": "zu", "theme": "dark" }
```

Returns `200` with the same shape as `GET /api/settings`. A missing row is a 404
`SETTINGS_NOT_FOUND` (no upsert).

## Logging

Each request logs one JSON line: `requestId`, `route`, `method`, `status`,
`durationMs`, plus `errorName`/`errorCode` on failures. Bodies, tokens, cookies,
emails and error messages are never logged. Prisma logs warnings and errors only;
query logging is off.

## Tests

`npm test` runs MOCKED unit tests (Vitest). Supabase Auth and Prisma are mocked, so
there's no network or database access. Live checks need a real signed-in session; see
the manual steps in the Milestone 1 report.
