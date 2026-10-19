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
| 404 | `APPOINTMENT_NOT_FOUND` | No appointment with that id **for you** (another patient's looks the same) |
| 404 | `MEDICAL_RECORD_NOT_FOUND` | No medical record with that id **for you** (another patient's looks the same) |
| 404 | `NOT_FOUND` | Generic missing record |
| 409 | `CONFLICT` | Unique-constraint conflict |
| 409 | `APPOINTMENT_CONFLICT` | The practitioner, or you, already has an active appointment at that time |
| 409 | `APPOINTMENT_NOT_EDITABLE` | The appointment can't be changed in its current state (or changed concurrently) |
| 409 | `APPOINTMENT_NOT_CANCELLABLE` | The appointment is completed or its time has passed |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Write without `Content-Type: application/json` |
| 429 | `RATE_LIMITED` | Too many writes; see `Retry-After` |
| 500 | `INTERNAL_ERROR` | Unexpected error (generic message; details only in server logs) |
| 503 | `SERVICE_UNAVAILABLE` | Database or Supabase Auth unreachable |

A missing profile or settings row means the signup trigger didn't run. The API does
**not** create rows on read or upsert on write: the database trigger owns creation, and
silently creating rows would hide that fault. Contact support or re-run the trigger
backfill.

## Authentication

**Private endpoints** (`/api/profile`, `/api/settings`, `/api/appointments*`, `/api/medical-records*`) make exactly one Supabase Auth
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
  (`profiles.id`, `user_settings.user_id`, `appointments.patient_id`,
  `medical_records.patient_id`), never a value
  from the request. Strict schemas reject any field that isn't explicitly editable.
  Appointment and medical-record lookups filter on id AND patient, so another
  patient's row is a 404, not a 403 (ids can't be probed). Medical records are
  returned through an explicit `select` without `patientId`.
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
paging is stable (appointments: by `scheduledAt`, then id; medical records: by `recordedOn` desc,
`createdAt` desc, then id). The offset is at most 99,900 rows. The page and the count run in one
batched transaction (`prisma.$transaction([findMany, count])`).

## Rate limiting

Write endpoints (PATCH, the appointment POSTs and `POST /api/medical-records`) allow 20 writes per user per minute
per endpoint group. The limiter is **in-memory and
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
test. `tests/appointments-locking.integration.test.ts` is an opt-in INTEGRATION test
against a real database (read-only: advisory locks only); it is skipped unless
`MEDLINK_DB_INTEGRATION=1`. Live checks need a running server, real data and, for private endpoints, a real
signed-in session (see `endpoints.md`).

## Dates and time zones

- All timestamps are PostgreSQL `timestamptz` and are compared as UTC instants.
- Requests must send ISO 8601 date-times **with an offset**: `2026-10-20T09:30:00+02:00`
  (SAST) or `2026-10-20T07:30:00Z`. A time without an offset (`2026-10-20T09:30:00`)
  is ambiguous and is rejected (400).
- Responses always use UTC with `Z` (`2026-10-20T07:30:00.000Z`). Clients convert for
  display.
- South Africa (`Africa/Johannesburg`) is UTC+2 all year, with no daylight saving.

## Appointments: status rules and double booking

Statuses (Prisma enum `AppointmentStatus`): `requested`, `confirmed`, `completed`,
`cancelled`. New appointments get the database default, `requested`.

| From | Patient action | Result |
| --- | --- | --- |
| `requested` (upcoming) | change reason or time; cancel | stays `requested` / `cancelled` |
| `confirmed` (upcoming) | change reason; cancel | stays `confirmed` / `cancelled`. Rescheduling is 409: cancel and request again |
| `cancelled` | cancel again | 200, unchanged (idempotent). Other changes: 409 |
| `completed` | anything | 409 |
| any, time already passed | anything | 409 |

Patients can never set a status directly. `status` is rejected in every request body.
Confirming and completing are staff actions; the role model has `doctor`, `hospital`
and `admin` roles but no staff-to-practitioner/facility assignment yet, so these
actions are **not implemented**.

**Double booking.** A booking (or reschedule) is refused with 409
`APPOINTMENT_CONFLICT` if the practitioner, or the patient, already has a `requested`
or `confirmed` appointment starting at **exactly** the same instant. Times must be on a
whole minute. The check runs inside a database transaction that first takes
PostgreSQL advisory locks (`pg_advisory_xact_lock`) per practitioner and per patient,
so concurrent requests are checked one at a time. Limits:

- There is no appointment duration in the schema, so overlapping appointments with
  different start times (09:30 and 09:45) are not detected.
- The lock protects writes made through this API. The Supabase Data API can't write
  appointments (SELECT-only grant), but direct database writes (SQL editor, scripts)
  bypass it. Only a database constraint would cover those; none is in place.

## Medical records: permission model

- Records are **patient-authored**. The `supabase_auth_rls` migration states that
  patients add their own records (the Android Records screen) and grants authenticated
  users INSERT on the content columns of their own rows. `POST /api/medical-records`
  is stricter: the caller's `profiles.role` must be `patient`.
- The schema has **no clinician-authored records**, no author column and no link to a
  practitioner, facility or appointment. `provider` is free text typed by the patient;
  it is never used for authorisation, so no clinician or facility gains access through
  it. Clinician access to records is not supported.
- **No files:** `medical_records` has no file path or storage reference, so there are no
  attachments or downloads. Adding them would need new schema, a private storage bucket
  and storage policies.
- **No edit or delete** through this API (out of scope), although RLS would allow a
  patient to change their own rows via the Data API.
- `recordedOn` is a calendar date (`DATE`), sent and returned as `YYYY-MM-DD`; "today"
  for the not-in-the-future rule is the date in Africa/Johannesburg.
