# MedLink SA

A digital health platform built for South Africa — connecting patients, doctors, pharmacies, hospitals, and administrators in one place.

## Tech Stack

| Layer | What we use |
|-------|-------------|
| Framework | Next.js 16 (App Router, webpack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Auth | Client-side demo login (NextAuth.js v4 installed, not yet used) |
| ORM | Prisma 6 |
| Database | PostgreSQL (planned host: Supabase) via Prisma; schema and migrations present, not used by the app yet |
| Fonts | Inter + JetBrains Mono |

## Project Structure

```
medlink-sa/
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
    │   │   ├── api/route.ts   # GET /api stub ("Hello, world!")
    │   │   ├── sign-in/       # Auth pages
    │   │   ├── sign-up/
    │   │   ├── service/       # Service overview
    │   │   ├── explore/       # Medicine explorer
    │   │   ├── faq/           # FAQ page
    │   │   └── dashboard/     # patient, doctor, pharmacy, hospital, admin
    │   ├── components/        # ui/ (shadcn), layout/, landing/
    │   ├── hooks/
    │   ├── lib/               # data.ts (mock data), db.ts (Prisma client), auth-context.tsx, lang-context.tsx, security.ts, utils.ts
    │   └── types/
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

Head to [http://localhost:3000](http://localhost:3000). Login is a demo: the test accounts shown on the sign-in page (password `12345678`) are hard-coded in `web/src/lib/auth-context.tsx`, and dashboards use mock data.

### 3. Database (PostgreSQL, not used by the app yet)

The schema in `web/prisma/schema.prisma` targets PostgreSQL (planned host: Supabase). No app code reads or writes the database yet, there is no seed script, and the app runs without a database.

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

Deleting a profile deletes the patient's settings, emergency profile, appointments, records and queue tickets. Deleting a practitioner or facility keeps appointments (the link is set to null); a facility that still has queue tickets cannot be deleted.

**Environment.** Copy `web/.env.example` to `web/.env` (git-ignored) and fill in your own values. Never commit real keys.

- `DATABASE_URL`: pooled connection (Supabase pooler, port 6543, `?pgbouncer=true&connection_limit=1`), used by the app at runtime.
- `DIRECT_URL`: Supabase session pooler (port 5432), used by Prisma Migrate. The direct connection (`db.<project-ref>.supabase.co:5432`) also works.

**Migrations** (`web/prisma/migrations/`):

1. `20261018200000_init`: tables, enums, indexes and foreign keys, generated by Prisma.
2. `20261018200100_supabase_auth_rls`: hand-written, applied once by `prisma migrate deploy`.
   - Everywhere (plain PostgreSQL too): enables Row Level Security on every table, including Prisma's `_prisma_migrations`; adds CHECK constraints (ticket number > 0, estimated wait >= 0, latitude -90 to 90, longitude -180 to 180); and adds a trigger that sets `updated_at` on every update.
   - On Supabase only: triggers on `auth.users` create the profile, settings and emergency profile on signup (role always `patient`), copy email changes to `profiles.email`, and delete the profile when the auth user is deleted. Existing auth users get any missing rows backfilled. Column-level grants and RLS policies for the Supabase Data API let patients read their own data, change only their profile name and phone, edit (not delete) their emergency profile and settings, add, edit and delete their own medical records, and only *read* their own appointments and queue tickets. `id`, `created_at` and `updated_at` are always set by the database. Anyone can read facilities and the practitioner directory (`id`, `full_name`, `specialty`, `facility_id`; `profile_id` and `license_number` stay private). `_prisma_migrations` is closed to the Data API.
   - On plain PostgreSQL (CI, Prisma's shadow database) the Supabase-only part is skipped with a notice.

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
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:format` | Format the Prisma schema |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate:dev` | Create/apply a dev migration (local or throwaway database only) |
| `npm run db:migrate:deploy` | Apply pending migrations (CI, Supabase) |
| `npm run db:migrate:status` | Show migration status |
| `npm run db:migrate:diff` | Print the full schema as SQL (diff from an empty database) |

There are no automated tests yet.

## Continuous integration

GitHub Actions runs `.github/workflows/ci.yml` on every push and pull request to `main`:

| Job | Runner | What it does |
|-----|--------|--------------|
| `web` | ubuntu-latest, Node 24 | `npm ci`, `npx prisma validate` (placeholder connection strings, no database) and `npm run build` in `web/`. `npm run lint` also runs but is **non-blocking** (`continue-on-error`) because of 6 existing `react-hooks/set-state-in-effect` errors. |
| `android` | ubuntu-latest, Temurin JDK 21 | `./gradlew assembleDebug test` in `mobile/`, then uploads the debug APK as the `medlink-debug-apk` artifact |

There are no automated tests yet in either app, so the `test` task currently has nothing to run.
## Mobile app

The Android app lives in `mobile/`. Open that folder in Android Studio and run the `app` configuration, or build from the command line:

```bash
cd mobile
./gradlew assembleDebug      # Windows: gradlew.bat assembleDebug
```

See `mobile/README.md` for details.

## Deployment

> The build uses `next build --webpack` (not Turbopack). `web/next.config.mjs` includes a `framer-motion` CJS alias needed for webpack bundling.

### Vercel

1. Connect the GitHub repo at [vercel.com](https://vercel.com) and set the project **Root Directory** to `web`.
2. Deploy. Vercel runs `npm run build`.

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
| `NEXT_PUBLIC_SUPABASE_URL` | Not yet | Supabase project URL (planned) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Not yet | Supabase publishable key, safe in the browser/app (planned) |
| `SUPABASE_SECRET_KEY` | Not yet | Supabase secret key: **server-only**, never expose to the browser or the Android app (planned) |

The web app doesn't read any of these yet (`next-auth` is installed but not wired up). `web/.env.example` lists them with placeholder values. Keep real `.env*` files out of git; they are ignored (only `.env.example` is tracked).