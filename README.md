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
| Database | Prisma schema present (sqlite placeholder), not used by the app yet |
| Fonts | Inter + JetBrains Mono |

## Project Structure

```
medlink-sa/
├── mobile/                    # Android app (Kotlin + Jetpack Compose), see mobile/README.md
└── web/                       # Next.js website (everything below runs from here)
    ├── prisma/
    │   └── schema.prisma      # Prisma schema (currently a sqlite placeholder: User, Post)
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

### 3. Database (optional, not used by the app yet)

`web/prisma/schema.prisma` currently uses the `sqlite` provider with placeholder `User` and `Post` models, and no app code reads or writes the database. To work with it, set `DATABASE_URL` (in your shell or in `web/.env`, which is git-ignored), then run:

```bash
# web/.env
DATABASE_URL="file:./dev.db"
```

```bash
npm run db:push
npm run db:generate
```

There is no seed script and there are no migrations yet.

## Available Scripts

Run from `web/`:

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build (`next build --webpack`, standalone output) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push Prisma schema to the database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run dev migration |
| `npm run db:reset` | Reset database and re-run migrations |

There are no automated tests yet.

## Continuous integration

GitHub Actions runs `.github/workflows/ci.yml` on every push and pull request to `main`:

| Job | Runner | What it does |
|-----|--------|--------------|
| `web` | ubuntu-latest, Node 24 | `npm ci` and `npm run build` in `web/`. `npm run lint` also runs but is **non-blocking** (`continue-on-error`) because of 6 existing `react-hooks/set-state-in-effect` errors. |
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
| `DATABASE_URL` | Only for the `db:*` scripts | Prisma connection string; must be a `file:` URL while the provider is `sqlite` |

The web app doesn't read any other environment variables yet (`next-auth` is installed but not wired up). Keep `.env*` files out of git; they are ignored.