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
