# Endpoints

The machine-readable contract is [`../openapi/openapi.yaml`](../openapi/openapi.yaml).
Conventions are in [`conventions.md`](conventions.md).

| Method | Path | Auth |
| --- | --- | --- |
| GET | `/api/profile` | Private |
| PATCH | `/api/profile` | Private |
| GET | `/api/settings` | Private |
| PATCH | `/api/settings` | Private |
| GET | `/api/facilities` | Public |
| GET | `/api/facilities/{id}` | Public |
| GET | `/api/practitioners` | Public |
| GET | `/api/practitioners/{id}` | Public |
| GET | `/api/appointments` | Private |
| POST | `/api/appointments` | Private |
| GET | `/api/appointments/{id}` | Private |
| PATCH | `/api/appointments/{id}` | Private |
| POST | `/api/appointments/{id}/cancel` | Private |
| GET | `/api/medical-records` | Private |
| POST | `/api/medical-records` | Private (patients) |
| GET | `/api/medical-records/{id}` | Private |

## `GET /api/profile`

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

## `PATCH /api/profile`

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

## `GET /api/settings`

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

## `PATCH /api/settings`

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

## `GET /api/facilities` (public)

| Query | Type | Rules |
| --- | --- | --- |
| `page` | integer | default 1, 1-1000 |
| `pageSize` | integer | default 20, 1-100 |
| `type` | `hospital` \| `clinic` \| `community_health_centre` \| `pharmacy` | exact |
| `province` | string, 1-50 | **exact, case-sensitive** (uses `facilities_province_idx`), e.g. `Gauteng` |
| `city` | string, 1-100 | case-insensitive exact match (no index) |
| `q` | string, 2-100 | case-insensitive "contains" on `name` |

Unknown or repeated parameters are a 400. Ordered by `name`, then `id`.

```json
200
{
  "data": [
    {
      "id": "3f2b8c1e-7d4a-4e5b-9c6d-1a2b3c4d5e6f",
      "name": "Chris Hani Baragwanath Hospital",
      "type": "hospital",
      "province": "Gauteng",
      "city": "Soweto",
      "address": "26 Chris Hani Rd",
      "phone": "+27 11 933 8000",
      "latitude": -26.2605,
      "longitude": 27.9433
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

`latitude`/`longitude` are `decimal(9,6)` in the database and are returned as JSON
numbers rounded to 6 decimal places (or `null`).

The `q` search uses `ILIKE '%…%'`. There's no trigram index, so it scans the rows left
after the other filters. That's fine at directory scale; add a `pg_trgm` GIN index on
`name` if the table grows large.

## `GET /api/facilities/{id}` (public)

`id` must be a UUID (otherwise 400 `VALIDATION_FAILED`, `details[0].path = "id"`). Returns
`{ "data": <facility> }` with the same fields as above. Errors: 404 `FACILITY_NOT_FOUND`.

## `GET /api/practitioners` (public)

| Query | Type | Rules |
| --- | --- | --- |
| `page`, `pageSize` | integer | as above |
| `facilityId` | UUID | exact (uses `practitioners_facility_id_idx`) |
| `specialty` | string, 1-100 | case-insensitive exact match (so the specialty index isn't used) |
| `q` | string, 2-100 | case-insensitive "contains" on `fullName` |

Ordered by `fullName`, then `id`.

```json
200
{
  "data": [
    {
      "id": "8a7b6c5d-4e3f-4a1b-8c9d-0e1f2a3b4c5d",
      "fullName": "Dr Sipho Dlamini",
      "specialty": "Cardiology",
      "facilityId": "3f2b8c1e-7d4a-4e5b-9c6d-1a2b3c4d5e6f",
      "facility": { "id": "3f2b8c1e-7d4a-4e5b-9c6d-1a2b3c4d5e6f", "name": "Chris Hani Baragwanath Hospital" }
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 1, "totalPages": 1 }
}
```

`facility` is `null` when the practitioner has no facility. Prisma loads it with one
batched primary-key lookup per page (`WHERE id IN (...)`), not one query per row. **`profileId` and `licenseNumber` are
never returned.**

## `GET /api/practitioners/{id}` (public)

Same fields as above. Errors: 400 for a bad id, 404 `PRACTITIONER_NOT_FOUND`.

## Appointments (private, patient scope)

All appointment endpoints act on **the signed-in user's own appointments** (the patient
comes from the session, never the request). Responses are `Cache-Control: no-store`.
Time rules and status transitions: [conventions.md](conventions.md#appointments-status-rules-and-double-booking).

Appointment object:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `practitionerId` | uuid \| null | null if the practitioner was later removed |
| `practitionerName` | string | copied from the directory when booked |
| `specialty` | string | copied from the directory |
| `facilityId` | uuid \| null | null if the facility was later removed |
| `facilityName` | string | copied from the directory |
| `scheduledAt` | date-time | UTC (`Z`) |
| `reason` | string \| null | |
| `status` | `requested` \| `confirmed` \| `completed` \| `cancelled` | |
| `createdAt`, `updatedAt` | date-time | UTC |

### `GET /api/appointments`

| Query | Type | Rules |
| --- | --- | --- |
| `page`, `pageSize` | integer | default 1 / 20; max 1000 / 100 |
| `status` | appointment status | exact |
| `from` | date-time with offset | `scheduledAt >= from` |
| `to` | date-time with offset | `scheduledAt < to`; must be after `from` |

Ordered by `scheduledAt`, then `id`. Unknown or repeated parameters are a 400. Uses the
`appointments(patient_id, scheduled_at)` index.

```http
GET /api/appointments?status=requested&from=2026-10-20T00:00:00%2B02:00&to=2026-10-27T00:00:00%2B02:00
```

Returns `{ "data": [<appointment>...], "meta": { "page", "pageSize", "total", "totalPages" } }`.

### `POST /api/appointments`

| Field | Required | Rules |
| --- | --- | --- |
| `practitionerId` | yes | uuid of a directory practitioner who is linked to a facility |
| `facilityId` | no | if sent, must be that practitioner's facility |
| `scheduledAt` | yes | offset required; seconds `00`; in the future; at most 365 days ahead |
| `reason` | no | trimmed, 1-500 chars, or null |

Anything else (`patientId`, `status`, `practitionerName`, `facilityName`, `specialty`,
`id`, timestamps) is a 400. The names and specialty are copied from the directory and
`status` starts as `requested`.

```http
POST /api/appointments
Content-Type: application/json

{ "practitionerId": "8a7b6c5d-4e3f-4a1b-8c9d-0e1f2a3b4c5d", "scheduledAt": "2026-10-20T09:30:00+02:00", "reason": "Check-up" }
```

`201 { "data": <appointment> }` with `scheduledAt: "2026-10-20T07:30:00.000Z"`.

Errors:
- 400: validation, practitioner not linked to a facility, `facilityId` not the
  practitioner's, booking yourself (practitioner accounts).
- 404: `PRACTITIONER_NOT_FOUND`, `FACILITY_NOT_FOUND`, `PROFILE_NOT_FOUND`.
- 409 `APPOINTMENT_CONFLICT`: the time is taken.
- Also 401, 403 (cross-site), 415, 429, 500, and 503 (busy; retry).

### `GET /api/appointments/{id}`

`200 { "data": <appointment> }`. A missing appointment, or another patient's, is the
same 404 `APPOINTMENT_NOT_FOUND`.

### `PATCH /api/appointments/{id}`

Editable: `reason` (string or null; while `requested` or `confirmed`) and `scheduledAt`
(only while `requested`; same rules as creation; conflict-checked). The appointment must
still be upcoming. `status`, `practitionerId`, `facilityId`, `patientId`, names and
timestamps are a 400. Sending the current time changes nothing.

```http
PATCH /api/appointments/a1a1a1a1-b2b2-4c3c-8d4d-e5e5e5e5e5e5
Content-Type: application/json

{ "scheduledAt": "2026-10-21T14:00:00+02:00" }
```

Errors: 400, 401, 403, 404, 409 `APPOINTMENT_NOT_EDITABLE` (wrong state, confirmed
reschedule, changed concurrently) or `APPOINTMENT_CONFLICT`, 415, 429, 500, 503.

### `POST /api/appointments/{id}/cancel`

No body (or `{}`). `requested`/`confirmed` and upcoming become `cancelled` (200).
Already cancelled: 200 with the appointment unchanged. `completed` or past: 409
`APPOINTMENT_NOT_CANCELLABLE`. A body with any field (e.g. `{"status":"completed"}`) is
a 400.

Cancellation is an action rather than `PATCH {status}` so that `status` is never an
editable field.

## Medical records (private, patient scope)

All medical-record endpoints act on **the signed-in user's own records** (the patient
comes from the session, never the request). Responses are `Cache-Control: no-store`.
Records are **patient-authored**: the patient types them in (as on the Android Records
screen). `provider` is free text, not verified and not linked to the directory, and it
grants nobody access. There are no attachments or files, and records can't be edited or
deleted through this API. Permission model: [conventions.md](conventions.md#medical-records-permission-model).

Medical record object:

| Field | Type | Notes |
| --- | --- | --- |
| `id` | uuid | |
| `title` | string, max 120 | |
| `category` | string, max 80 | free text (e.g. `Lab result`) |
| `provider` | string \| null, max 150 | free text entered by the patient (self-reported) |
| `recordedOn` | date (`YYYY-MM-DD`) | calendar date, no time or zone |
| `notes` | string \| null, max 2000 | |
| `createdAt`, `updatedAt` | date-time | UTC |

`patientId` is never returned.

### `GET /api/medical-records`

| Query | Type | Rules |
| --- | --- | --- |
| `page`, `pageSize` | integer | default 1 / 20; max 1000 / 100 |
| `category` | string, 1-80 | case-insensitive exact match |
| `from` | date `YYYY-MM-DD` | `recordedOn >= from`; not before 1900-01-01 |
| `to` | date `YYYY-MM-DD` | `recordedOn <= to`; not before `from` |

Ordered by `recordedOn` (newest first), then `createdAt` (newest first), then `id`.
Unknown or repeated parameters (including `patientId`) are a 400. Uses the
`medical_records(patient_id, recorded_on)` index.

```http
GET /api/medical-records?category=lab%20result&from=2026-01-01&to=2026-06-30
```

Returns `{ "data": [<record>...], "meta": { "page", "pageSize", "total", "totalPages" } }`.

### `POST /api/medical-records`

Only users whose `profiles.role` is `patient` may add records (403 otherwise; 404
`PROFILE_NOT_FOUND` if the profile row is missing).

| Field | Required | Rules |
| --- | --- | --- |
| `title` | yes | trimmed, 1-120 chars |
| `category` | yes | trimmed, 1-80 chars |
| `provider` | no | trimmed, 1-150 chars, or null |
| `recordedOn` | yes | `YYYY-MM-DD`, from 1900-01-01 up to today's date in South Africa (Africa/Johannesburg) |
| `notes` | no | trimmed, 1-2000 chars, or null |

Anything else (`patientId`, `id`, `createdAt`, `updatedAt`, author, practitioner,
facility, appointment or file fields) is a 400. Rate-limited like other writes.

```http
POST /api/medical-records
Content-Type: application/json

{ "title": "Blood test", "category": "Lab result", "provider": "Lancet Laboratories", "recordedOn": "2026-10-15" }
```

`201 { "data": <record> }`.

### `GET /api/medical-records/{id}`

`200 { "data": <record> }`. Another patient's record returns the same 404
`MEDICAL_RECORD_NOT_FOUND` as a missing one. An invalid id or any query parameter is a 400.

## Manual live checks

With a signed-in browser session on `http://localhost:3000`, run in the console:

```js
await (await fetch("/api/profile")).json();
await (await fetch("/api/settings", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ theme: "dark" }) })).json();
```

Public directory (no session needed):

```bash
curl -i "http://localhost:3000/api/facilities?type=clinic&pageSize=5"
curl -i "http://localhost:3000/api/practitioners?specialty=cardiology"
```
