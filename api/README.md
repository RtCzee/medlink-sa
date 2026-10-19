# MedLink SA API

This folder holds the **API contract and documentation**. The executable handlers
live in the Next.js app, not here:

| What | Where |
| --- | --- |
| Route handlers | [`web/src/app/api/`](../web/src/app/api) (`profile`, `settings`, `facilities`, `practitioners`, `appointments`, `medical-records`, `queues`, `queue-tickets`) |
| Shared API code (envelope, auth, validation, DTOs) | [`web/src/lib/api/`](../web/src/lib/api) |
| Tests (Vitest, mocked) | [`web/tests/`](../web/tests) |
| OpenAPI 3.1 contract | [`openapi/openapi.yaml`](openapi/openapi.yaml) |
| Conventions (envelope, errors, auth, caching, RLS note) | [`docs/conventions.md`](docs/conventions.md) |
| Endpoint reference | [`docs/endpoints.md`](docs/endpoints.md) |

The OpenAPI file is the language-neutral contract (e.g. for the Android app). The
TypeScript schemas and types stay in `web/src/lib/api/`, so there is no separate
`contracts/` folder to keep in sync.

## Run

```bash
cd web
npm install
npm run dev          # http://localhost:3000/api/...
```

`web/.env` needs `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `web/.env.example`).

## Auth model (short)

- **Private** (`/api/profile`, `/api/settings`, `/api/appointments*`,
  `/api/medical-records*`, `/api/queues*`, `/api/queue-tickets*`): the Supabase session cookie from the
  web app, or `Authorization: Bearer <Supabase access token>`. A missing or invalid one
  gets a JSON 401.
- **Public** (`/api/facilities*`, `/api/practitioners*`): no sign-in. A session, if
  sent, is ignored and never read. This matches the database grants for the anon role.

Details: [docs/conventions.md](docs/conventions.md).

## Test

```bash
cd web
npm test             # Vitest: mocked unit tests + OpenAPI contract test
```

The opt-in integration tests for the appointment booking lock and the queue locks
(real database, read-only: advisory locks only) run only with `MEDLINK_DB_INTEGRATION=1`; see
[docs/conventions.md](docs/conventions.md#tests).

`web/tests/openapi-contract.test.ts` checks that every path in `openapi.yaml` has a
matching `route.ts` that exports exactly the documented methods, and that every
implemented route is documented, that private operations document a 401, that path
parameters are declared, that 2xx responses document their `Cache-Control` and that
the documented error codes match `errors.ts`. It lives in `web/tests` so it uses the web app's
dependencies, TypeScript and lint setup.

Optional one-off lint of the spec (not configured in the project):

```bash
npx --yes @redocly/cli@latest lint api/openapi/openapi.yaml
```
