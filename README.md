# MedLink SA

A digital health platform built for South Africa — connecting patients, doctors, pharmacies, hospitals, and administrators in one place.

[Click here for the demo video](./assets/demo-video.mp4)

## Tech Stack

| Layer | What we use |
|-------|-------------|
| Framework | Next.js 16 (App Router, webpack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Auth | Supabase Auth (email/password); cookie session on the web, Bearer token from the Android app |
| ORM | Prisma 6 |
| Database | PostgreSQL on Supabase via Prisma 6 (the Next.js API is the only writer); RLS on every table |
| Fonts | Inter + JetBrains Mono |

## Project Structure

```
medlink-sa/
├── api/                       # API contract + docs (handlers live in web/src/app/api), see api/README.md
│   ├── openapi/openapi.yaml   # OpenAPI 3.1 spec of the implemented endpoints
│   └── docs/                  # conventions.md, endpoints.md
├── mobile/                    # Android app (Kotlin + Jetpack Compose), see mobile/README.md
└── web/                       # Next.js website (everything below runs from here)
    ├── prisma/
    │   ├── schema.prisma      # Prisma schema (PostgreSQL, 8 core tables)
    │   └── migrations/        # init + hand-written Supabase auth/RLS migration
    ├── public/                # Static assets
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx     # Root layout (providers)
    │   │   ├── page.tsx       # Landing page
    │   │   ├── api/           # JSON API: profile, settings, facilities, practitioners, appointments, medical records, queues, prescriptions, medicines
    │   │   ├── sign-in/       # Auth pages
    │   │   ├── sign-up/
    │   │   ├── service/       # Service overview
    │   │   ├── explore/       # Medicine explorer
    │   │   ├── faq/           # FAQ page
    │   │   └── dashboard/     # patient, doctor, pharmacy, hospital, admin
    │   ├── components/        # ui/ (shadcn), layout/, landing/
    │   ├── hooks/
    │   ├── lib/               # api/ (server API code), client/api.ts (browser API client), data.ts (mock data for demo-only screens), db.ts (Prisma client), auth-context.tsx, lang-context.tsx, security.ts, utils.ts
    │   └── types/
    ├── tests/                 # Vitest unit tests (mocked) + OpenAPI contract test
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── tsconfig.json
    └── package.json
```
## User Roles

| Role | Dashboard | What they can do |
|------|-----------|------------------|
| **Patient** | `/dashboard/patient` | Book appointments, view medical records, order medicine, manage prescriptions, join virtual queues, video consults |
| **Doctor** | `/dashboard/doctor` | Manage appointments, write prescriptions, view patient records, run risk assessments |
| **Pharmacy** | `/dashboard/pharmacy` | Handle orders, track deliveries, manage inventory, set pricing, dispense medicine |
| **Hospital** | `/dashboard/hospital` | Manage beds, oversee wards, schedule staff, track equipment |
| **Admin** | `/dashboard/admin` | Manage users, view platform analytics, verify hospitals, review audit logs |

## Getting Started

### What you'll need

- **Node.js** 20+ and **npm**
- For the Android app: Android Studio (JDK 17+, Android SDK Platform 35)

### 1. Clone and install

```bash
git clone https://github.com/RtCzee/medlink-sa.git
cd medlink-sa/web
npm install
```

All web commands below are run from the `web/` folder.

> For a clean install that matches the committed `package-lock.json` exactly (CI, Docker), use `npm ci`.

### 2. Start the dev server

```bash
npm run dev
```

Head to [http://localhost:3000](http://localhost:3000). Create an account on `/sign-up` (Supabase sends a confirmation email), confirm it, then sign in. New accounts are patients. The patient dashboard's appointments, records, prescriptions, queue and medicines tabs use the real API; the other dashboards and some patient tabs are still demo screens (see "Integration status").

### 3. Database (PostgreSQL on Supabase)

The schema in `web/prisma/schema.prisma` targets PostgreSQL on Supabase. The Next.js API reads and writes it through Prisma. Seeded data: the demo medicine directory (migration 4) and, via `npm run db:seed:demo`, fictional demo facilities and practitioners (see "Demo seed").

**Tables** (all keyed by UUID; `profiles.id` is the Supabase Auth user id):

| Table | Purpose |
|-------|---------|
| `profiles` | One row per user: name, email, phone, role (`patient`, `doctor`, `pharmacy`, `hospital`, `admin`) |
| `emergency_profiles` | Blood type, allergies, conditions and emergency contact (1:1 with a profile) |
| `user_settings` | Language, theme, notification and emergency-QR preferences (1:1 with a profile) |
| `facilities` | Hospitals, clinics, community health centres and pharmacies |
| `practitioners` | Doctors and other practitioners, optionally linked to a profile and a facility |
| `appointments` | A patient's appointments (practitioner/facility names are copied so history survives deletes) |
| `medical_records` | A patient's medical records |
| `queue_tickets` | Virtual queue tickets per facility per day (ticket numbers are unique per facility and date) |
| `prescriptions` | A patient's prescriptions (status `active`, `completed`, `cancelled` or `expired`), optionally linked to a practitioner, appointment and facility |
| `medicines` | Public medicine directory (name, generic name, strength, form, category, prescription-only flag, `source`); currently demo data |
| `medicine_prices` | Listed prices per medicine and named pharmacy from an effective date (demo prices, not current) |
| `prescription_items` | The medicines on a prescription (name, dosage, quantity, instructions, refills) |

Deleting a profile deletes the patient's settings, emergency profile, appointments, records, queue tickets and prescriptions (with their items). Deleting a practitioner or facility keeps appointments and prescriptions (the link is set to null; deleting an appointment also just unlinks its prescriptions); a facility that still has queue tickets cannot be deleted.

**Environment.** Copy `web/.env.example` to `web/.env` (git-ignored) and fill in your own values. Never commit real keys.

- `DATABASE_URL`: pooled connection (Supabase pooler, port 6543, `?pgbouncer=true&connection_limit=1`), used by the app at runtime.
- `DIRECT_URL`: Supabase session pooler (port 5432), used by Prisma Migrate. The direct connection (`db.<project-ref>.supabase.co:5432`) also works.

**Migrations** (`web/prisma/migrations/`):

1. `20261018200000_init`: tables, enums, indexes and foreign keys, generated by Prisma.
2. `20261018200100_supabase_auth_rls`: hand-written, applied once by `prisma migrate deploy`.
   - Everywhere (plain PostgreSQL too): enables Row Level Security on every table, including Prisma's `_prisma_migrations`; adds CHECK constraints (ticket number > 0, estimated wait >= 0, latitude -90 to 90, longitude -180 to 180); and adds a trigger that sets `updated_at` on every update.
   - On Supabase only: triggers on `auth.users` create the profile, settings and emergency profile on signup (role always `patient`), copy email changes to `profiles.email`, and delete the profile when the auth user is deleted. Existing auth users get any missing rows backfilled. Column-level grants and RLS policies for the Supabase Data API let patients read their own data, change only their profile name and phone, edit (not delete) their emergency profile and settings, add, edit and delete their own medical records, and only *read* their own appointments and queue tickets. `id`, `created_at` and `updated_at` are always set by the database. Anyone can read facilities and the practitioner directory (`id`, `full_name`, `specialty`, `facility_id`; `profile_id` and `license_number` stay private). `_prisma_migrations` is closed to the Data API.
   - On plain PostgreSQL (CI, Prisma's shadow database) the Supabase-only part is skipped with a notice.
3. `20261019203000_prescriptions`: additive. Creates `prescriptions` and `prescription_items` (Prisma-generated DDL) plus, by hand: RLS on both tables, CHECKs (`expires_on >= issued_on`, quantity > 0, refills >= 0) and the `updated_at` triggers. On Supabase, `anon` gets nothing and `authenticated` gets SELECT only: patients read their own prescriptions and the items of their own prescriptions. There is no write grant or policy for anyone (no verified prescriber model yet), so prescriptions can only be written by the database owner for now.
4. `20261019211000_medicines`: additive. Creates `medicines` and `medicine_prices` (Prisma-generated DDL) plus, by hand: RLS on both, CHECKs (amount >= 0, 3-letter currency), the `updated_at` trigger on `medicines`, and on Supabase public read-only access (`anon` and `authenticated` SELECT active medicines and their prices; no writes). It seeds the 6 demo products and their 19 demo prices from `web/src/lib/data.ts` with `source = 'demo'` (idempotent). Pack size, schedule, stock, delivery and distance from the demo data are not stored. `prescription_items` is not linked to `medicines` yet (a possible later change).

```bash
npm run db:validate        # check the schema (needs DATABASE_URL/DIRECT_URL set, any value)
npm run db:generate        # generate the Prisma client
npm run db:migrate:deploy  # apply pending migrations (use this against Supabase)
npm run db:migrate:status  # show which migrations are applied
```

Notes:

- The Next.js API will connect through Prisma as the table owner, which **bypasses RLS**. Every API query must filter by the signed-in user. RLS protects the Supabase Data API, which is reachable with the publishable key that ships in the Android app.
- Booking appointments, changing their status and issuing queue tickets must go through the API, which must also enforce one active queue ticket per patient (not expressible in the Prisma schema).
- To change the schema: edit `schema.prisma`, run `npm run db:migrate:dev -- --create-only --name <change>` against a local or throwaway PostgreSQL database, review the generated SQL, then apply it to Supabase with `npm run db:migrate:deploy`. `npm run db:migrate:diff` prints the full schema as SQL (diff from an empty database).
- There is deliberately no foreign key from `profiles` to `auth.users`: a cross-schema foreign key breaks Prisma introspection (error P4002). The triggers above keep the two in sync instead.
- `profiles.email` is a copy of the auth email and is not unique; Supabase Auth enforces unique emails.

**Post-deploy check (Stage 3, Supabase).** After `npm run db:migrate:deploy`, run this in the Supabase SQL editor. Expect 4 rows for the `auth.users` triggers plus `set_updated_at` on all 8 tables, and RLS on for all 9 tables:

```sql
SELECT tgrelid::regclass AS table_name, tgname FROM pg_trigger
WHERE NOT tgisinternal AND tgname IN ('on_auth_user_created', 'on_auth_user_email_changed', 'on_auth_user_deleted', 'set_updated_at')
ORDER BY 1, 2;
SELECT tablename, policyname, cmd, roles FROM pg_policies WHERE schemaname = 'public' ORDER BY 1, 2;
SELECT relname, relrowsecurity FROM pg_class WHERE relnamespace = 'public'::regnamespace AND relkind = 'r' ORDER BY 1;
```

## Available Scripts

Run from `web/`:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build (`next build --webpack`, standalone output) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest unit tests (mocked; no database or network) and the OpenAPI contract test |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:format` | Format the Prisma schema |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate:dev` | Create/apply a dev migration (local or throwaway database only) |
| `npm run db:migrate:deploy` | Apply pending migrations (CI, Supabase) |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:migrate:diff` | Print the full schema as SQL (diff from an empty database) |

`npm test` runs the Vitest suite in `web/tests/`. Supabase and Prisma are mocked, so it needs no database.

## Continuous integration

GitHub Actions runs `.github/workflows/ci.yml` on every push and pull request to `main`:

| Job | Runner | What it does |
|-----|--------|--------------|
| `web` | ubuntu-latest, Node 24 | In `web/`: `npm ci`, `npx prisma validate` (placeholder connection strings), `npx prisma generate`, `npm test` (Vitest, mocked; the DB integration tests skip themselves), `npm run build`, then baseline-aware `tsc --noEmit` and ESLint (they print every error and fail only above the known baselines of 15 type errors and 6 lint errors, all pre-existing in UI pages), and Redocly lint of `api/openapi/openapi.yaml`. |
| `android` | ubuntu-latest, Temurin JDK 21 | `./gradlew assembleDebug test` in `mobile/` (JVM unit tests for the API client, auth and formatting), then uploads the debug APK as the `medlink-debug-apk` artifact |

## Mobile app

The Android app lives in `mobile/`. Open that folder in Android Studio and run the `app` configuration, or build from the command line:

```bash
cd mobile
./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
```

To turn on the online features, give the build the server addresses (see `mobile/README.md`). Without them the app builds and runs fully offline, with the Online tab showing the demo queue. See `mobile/README.md` for details.

## Deployment

> The build uses `next build --webpack` (not Turbopack). `web/next.config.mjs` includes a `framer-motion` CJS alias needed for webpack bundling.

### Vercel

Recommended free host: **Vercel Hobby** (free, no card, no sleep; non-commercial use only, which suits this academic prototype). The web pages and the `/api` route handlers deploy together as one Next.js project.

1. Sign in at [vercel.com](https://vercel.com) with GitHub and **Add New → Project → Import** `RtCzee/medlink-sa`. The repo owner may have to grant the Vercel GitHub app access to the repo first.
2. Framework preset **Next.js**, **Root Directory** `web`. Leave the build command as `npm run build`; `postinstall` runs `prisma generate` so the Prisma client is never stale on Vercel's dependency cache.
3. Add the environment variables (Production and Preview) with the values from `web/.env`, entered in the Vercel dashboard only: `DATABASE_URL` (Supabase transaction pooler, port 6543), `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY` (server-only, never `NEXT_PUBLIC_`).
4. Deploy, then in Supabase → Authentication → URL Configuration add `https://<your-app>.vercel.app/auth/confirm` (and `https://<your-app>.vercel.app/**`) to the Redirect URLs, keeping `http://localhost:3000/**`.
5. Point the Android release build at it with `medlink.apiBaseUrl=https://<your-app>.vercel.app` in `mobile/local.properties` or `-Pmedlink.apiBaseUrl=...`.

### Self-hosted (standalone build)

```bash
cd web
npm run build

# Copy static assets into the standalone folder
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Run
node .next/standalone/server.js
```

#### Dockerfile example (build context: `web/`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
```

Build it with `docker build -t medlink-sa-web web`.

### Railway / Render / Fly.io

1. Connect the repo and set the root/working directory to `web`
2. Build command: `npm run build`
3. Start command: `npm run start`
## Key Features

- **Multi-role dashboards** — Patient, Doctor, Pharmacy, Hospital, and Admin each get their own workspace
- **Medicine explorer** — Compare prices across pharmacies, filter by schedule, availability, and delivery options
- **Appointment booking** — Schedule, confirm, and manage consultations
- **Prescription management** — Doctors write them, patients view them, pharmacies dispense them
- **Queue system** — Virtual queue for walk-in clinics
- **Video consultations** — In-browser telehealth
- **Multi-language** — English, isiZulu, Afrikaans, Sesotho
- **Dark mode** — System-aware with manual toggle
- **Responsive** — Mobile-first, works on all screen sizes
- **Accessible** — ARIA labels, semantic HTML, keyboard navigation

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Only for the `db:*` scripts | Pooled PostgreSQL connection string (Supabase pooler, port 6543) |
| `DIRECT_URL` | Only for the `db:*` scripts | Supabase session pooler connection string (port 5432; the direct connection also works), used by migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (browser and server) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase publishable key; designed to be public (browser and Android app) |
| `SUPABASE_SECRET_KEY` | No | Not read by any code. **Server-only** if ever used; never put it in the browser or the Android app |
| `DATABASE_URL` / `DIRECT_URL` | Yes (server) | As above. Needed at runtime by the API, so a deployment must set them |

`web/.env.example` lists them with placeholder values. Keep real `.env*` files out of git; they are ignored (only `.env.example` is tracked). Android build properties are listed in `mobile/README.md`.

## Architecture and auth

```
Android app (Kotlin/Compose)            Website (Next.js pages)
  │ Supabase Auth REST (publishable key)   │ Supabase Auth (@supabase/ssr, cookies)
  │ → access token (JWT)                   │
  │ Authorization: Bearer <token>          │ same-origin fetch with the session cookie
  └──────────────┬─────────────────────────┘
                 ▼
     Next.js route handlers  web/src/app/api/*   (proxy.ts refreshes cookie sessions)
       · verify the user with Supabase Auth (cookie or Bearer)
       · Zod-validate input, filter every query by the signed-in patient
       · {data, meta} / {error:{code,message}, requestId} envelopes
                 ▼
     Prisma 6 → PostgreSQL (Supabase)   RLS on every table guards the Supabase Data API
```

- **One identity:** `profiles.id` = Supabase `auth.users.id`. A database trigger creates the profile (role `patient`) on sign-up.
- **Web:** pages call `/api/*` through `web/src/lib/client/api.ts` (no tokens in JavaScript, nothing stored in `localStorage` except the language choice and the client-side security log). A 401 shows "session expired" with a sign-in link that returns to the dashboard.
- **Android:** `mobile/app/src/main/java/com/medlink/mobile/api/` signs in against Supabase Auth with the publishable key, keeps the session in app-private SharedPreferences, refreshes the access token before it expires, and calls the same `/api/*` routes with `Authorization: Bearer`. A rejected token signs the user out of the Online tab. Tokens and health data are never logged.
- **Room (Android)** holds the separate *offline* local account, appointment reminders and personal notes. It is not a cache of the online data and does not sync; the Online tab never writes to Room and never fakes offline writes.
- Prisma connects as the table owner (bypasses RLS), so ownership is enforced in every API query and covered by the mocked tests.

## Integration status

| Feature | Website | Android |
| --- | --- | --- |
| Sign-in / session / sign-out | Live (Supabase cookies, middleware refresh) | Online tab: live (Supabase token, refresh, sign-out). Offline account: Room only |
| Sign-up | Live (`/sign-up`, email confirmation) | Not in the app; create the account on the website |
| Profile and settings | API exists; dashboard settings form is still in-memory only | Room (offline profile) only |
| Facilities / practitioners | Public API live; used by the booking dialog. Landing/explore pages still show demo data | Practitioners: live (booking). Map/hospital list: hard-coded demo |
| Appointments (list, book, reschedule, cancel) | Live | Online tab: live. Care tab: Room reminders (local only) |
| Medical records (read) | Live | Online tab: live (read). Records tab: Room personal notes |
| Queues (list, join, my ticket, leave) | Live | Online tab: live |
| Prescriptions and items (read) | Live | Online tab: live |
| Medicines and prices | Live, prices labelled **demo** | Online tab: live, prices labelled **demo** |
| Video consults, messages, ID verification, vitals, ordering, refills | Demo only | Not present |
| Doctor / pharmacy / hospital / admin dashboards | Demo only (mock data) | Not present |

## Demo data and known limitations

- **Demo facilities and practitioners (fictional).** `npm run db:seed:demo` (from `web/`) adds 2 facilities and 3 practitioners, all named `DEMO - …`, with made-up addresses and phone numbers, licence numbers `DEMO-0001` to `DEMO-0003` and no login accounts. They are not real clinics or doctors; never use them for real care. See "Demo seed" below.
- Medicine prices are demo sample data (`source = 'demo'`, effective 2026-10-19), not current prices, and are labelled as such everywhere.
- No prescriber, dispensing, pharmacy-order, staff or admin workflows: prescriptions are read-only, there is no API to set appointment status beyond cancel, and queue tickets are never "called" by staff.
- Telemedicine, messaging, ID verification and vitals are UI demos.
- No deployed URL is configured in this repository. The Android app needs a reachable HTTPS base URL (or `http://10.0.2.2:3000` for the emulator against `npm run dev`; debug builds allow cleartext). Supabase Auth redirect URLs must include the deployed site's `/auth/confirm` for email confirmation.

### Demo seed

`web/prisma/seed-demo.mjs`, run with `npm run db:seed:demo` from `web/` (reads `web/.env`).

- **Safe to re-run:** fixed UUIDs, `createMany` with `skipDuplicates`. It only inserts missing demo rows and never updates or deletes anything, so other rows are untouched. A second run prints `inserted 0 facilities and 0 practitioners`.
- **Target guard:** it refuses to run unless `DATABASE_URL` points at the MedLink-SA Supabase project (ref `rjcuiadcsvlxfbplcihl`, pooler user `postgres.<ref>` or host `db.<ref>.supabase.co`), and never prints the URL.
- **What it creates:**

| Id | Row | Links |
| --- | --- | --- |
| `0d3e0000-0000-4000-8000-00000000f001` | Facility `DEMO - Soweto Community Clinic` (clinic, Soweto, Gauteng) | |
| `0d3e0000-0000-4000-8000-00000000f002` | Facility `DEMO - Johannesburg Family Practice` (clinic, Johannesburg, Gauteng) | |
| `0d3e0000-0000-4000-8000-00000000a001` | Practitioner `DEMO - Dr Thandi Mokoena`, General Practitioner, `DEMO-0001` | Soweto clinic |
| `0d3e0000-0000-4000-8000-00000000a002` | Practitioner `DEMO - Dr Pieter Naidoo`, Family Medicine, `DEMO-0002` | Johannesburg practice |
| `0d3e0000-0000-4000-8000-00000000a003` | Practitioner `DEMO - Dr Lerato Dube`, Paediatrics, `DEMO-0003` | Soweto clinic |

- **Verify through the API** (with `npm run dev` running): `GET /api/facilities`, `GET /api/facilities/0d3e0000-0000-4000-8000-00000000f001`, `GET /api/practitioners?facilityId=0d3e0000-0000-4000-8000-00000000f001`. Every practitioner is linked to a facility, so it can be booked; signed-in patients see both facilities under `GET /api/queues`. Licence numbers are never returned by the API.
- To remove the demo rows later, delete those five ids by hand (the script never deletes).

## How to demo

**Website:** `cd web && npm run dev`, open `/sign-up`, confirm the email, sign in, then on the patient dashboard: Medicines (search, open a medicine, see the demo price labels), Appointments (book → appears in the list → reschedule → cancel), Queue (join a facility → ticket number and people ahead → leave), Records and Prescriptions (empty states unless data exists). Sign out from the dashboard.

**Android phone (manual, not automated):**
1. In `mobile/local.properties` set `medlink.apiBaseUrl` (deployed URL, or `http://<PC LAN IP>:3000` with `npm run dev -- -H 0.0.0.0` on the same Wi-Fi), `medlink.supabaseUrl` and `medlink.supabasePublishableKey`.
2. `cd mobile && ./gradlew installDebug` with the phone connected (USB debugging on).
3. Create the offline account on the start screen, sign in.
4. Open the **Online** tab, sign in with the website account.
5. Medicines → "Show demo prices"; Appointments → book, reschedule, cancel; Queue → join, leave; Records; Prescriptions → "Show items".
6. Turn on airplane mode and retry: you should see "Could not reach MedLink…" with "Try again"; nothing is saved offline.
7. Sign out from the Online tab.

## Assignment evidence checklist

Fill these in with real evidence; nothing here has been recorded for you.

- [ ] DevOps lifecycle: plan → code → build → test → release → deploy → operate → monitor, with links to the commits, CI runs and (when it exists) the deployment
- [ ] CI runs green on `main` (link the GitHub Actions runs; the web job runs tests, build, type-check, lint and contract validation; the Android job builds the APK and runs unit tests)
- [ ] Team meeting notes / minutes and attendance
- [ ] GitHub activity: issues, pull requests, reviews and commit history per member
- [ ] Physical-phone demo: video or screenshots of the steps above on a real device (date and device model)
- [ ] Deployed website URL and a working public endpoint check (e.g. `GET /api/medicines`)
