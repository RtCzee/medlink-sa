# MedLink SA

South Africa's national digital health ecosystem — one platform connecting patients, doctors, hospitals, pharmacies, and administrators.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, webpack) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts |
| Auth | NextAuth.js v4 |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Fonts | Inter + JetBrains Mono |

## Project Structure

```
medlink-sa/
├── prisma/
│   ├── schema.prisma          # Database schema (PostgreSQL)
│   └── seed.ts                # Seed script
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (providers)
│   │   ├── page.tsx           # Landing page
│   │   ├── sign-in/           # Auth pages
│   │   ├── sign-up/
│   │   ├── service/           # Service overview
│   │   ├── explore/           # Medicine explorer
│   │   ├── faq/               # FAQ page
│   │   └── dashboard/
│   │       ├── patient/       # Patient dashboard (13 sub-components)
│   │       ├── doctor/        # Doctor dashboard (14 sub-components)
│   │       ├── pharmacy/      # Pharmacy dashboard
│   │       ├── hospital/      # Hospital dashboard
│   │       └── admin/         # Admin dashboard
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives
│   │   ├── layout/            # Navbar, footer, dashboard shell
│   │   └── landing/           # Landing page sections
│   └── lib/
│       ├── data.ts            # Mock data (medicines, testimonials, etc.)
│       ├── db.ts              # Prisma client singleton
│       ├── utils.ts           # cn() + getInitials()
│       ├── auth-context.tsx   # Auth provider & User type
│       ├── lang-context.tsx   # Language context (EN/ZU/AF/ST)
│       └── services/          # Service modules (admin, doctor, etc.)
├── next.config.mjs
├── tailwind.config.ts
└── package.json
```

## User Roles

| Role | Dashboard | Capabilities |
|------|-----------|-------------|
| **Patient** | `/dashboard/patient` | Book appointments, view records, order medicine, manage prescriptions, video consults, join queue |
| **Doctor** | `/dashboard/doctor` | Manage appointments, write prescriptions, view patient records, risk assessment |
| **Pharmacy** | `/dashboard/pharmacy` | Manage orders, track deliveries, inventory, pricing, dispensing |
| **Hospital** | `/dashboard/hospital` | Bed management, ward overview, staff scheduling, equipment tracking |
| **Admin** | `/dashboard/admin` | User management, platform analytics, hospital verification, audit logs |

## Getting Started

### Prerequisites

- **Node.js** 18+ (20 recommended)
- **PostgreSQL** 14+ (local or hosted)
- **npm**, **yarn**, or **pnpm**

### 1. Clone and install

```bash
git clone https://github.com/D34THC0N3/medlink-sa.git
cd medlink-sa
npm install
```

### 2. Environment variables

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Required variables:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/medlink_sa?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-random-secret-at-least-32-chars"
```

Generate a secret quickly:

```bash
openssl rand -base64 32
```

### 3. Database setup

#### Option A: Supabase (free hosted PostgreSQL)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string (use the **URI** format)
3. Paste it as your `DATABASE_URL`
4. Run the migration:

```bash
npx prisma db push
npx prisma generate
```

#### Option B: Local PostgreSQL

1. Install PostgreSQL (via [postgres.app](https://postgresapp.com), [brew](https://brew.sh), or your package manager)
2. Create a database:

```bash
createdb medlink_sa
```

3. Set `DATABASE_URL` to `postgresql://localhost:5432/medlink_sa`
4. Run the migration:

```bash
npx prisma db push
npx prisma generate
```

#### Option C: Docker

```bash
docker run -d --name medlink-pg \
  -e POSTGRES_USER=medlink \
  -e POSTGRES_PASSWORD=medlink \
  -e POSTGRES_DB=medlink_sa \
  -p 5432:5432 \
  postgres:16-alpine
```

Then set:

```env
DATABASE_URL="postgresql://medlink:medlink@localhost:5432/medlink_sa?schema=public"
```

### 4. Seed the database (optional)

```bash
npx tsx prisma/seed.ts
```

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build (webpack) |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run dev migration |
| `npm run db:reset` | Reset database and re-run migrations |
| `npm run db:seed` | Seed database with test data |

## Deployment

### Vercel (recommended)

The simplest path — push to `main` and Vercel auto-deploys:

1. Connect your GitHub repo at [vercel.com](https://vercel.com)
2. Set environment variables in the Vercel dashboard:
   - `DATABASE_URL` — use a hosted PostgreSQL (Supabase, Neon, Railway, etc.)
   - `NEXTAUTH_URL` — your production URL (e.g. `https://medlink-sa.vercel.app`)
   - `NEXTAUTH_SECRET` — a strong random string
3. Deploy. Vercel runs `next build --webpack` automatically.

> **Note:** The build uses `next build --webpack` (not Turbopack). Turbopack has Windows/SWC compatibility issues. The `next.config.mjs` includes a `framer-motion` CJS alias required for webpack bundling.

### Self-hosted / Docker

The project outputs a standalone build. To run it anywhere:

```bash
# Build
npm run build

# The standalone server is at .next/standalone/
# Copy static assets
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public

# Run
node .next/standalone/server.js
```

### Dockerfile example

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

### Railway / Render / Fly.io

1. Connect your repo
2. Set the same three env vars (`DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`)
3. Use the build command: `npm run build`
4. Use the start command: `npm run start`

### Alternative databases

The Prisma schema is configured for PostgreSQL. To use a different provider:

1. Change `provider` in `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "mysql"  // or "sqlite"
  url      = env("DATABASE_URL")
}
```

2. Update `DATABASE_URL` accordingly:

```env
# MySQL
DATABASE_URL="mysql://user:password@localhost:3306/medlink_sa"

# SQLite
DATABASE_URL="file:./dev.db"
```

3. Re-run migrations:

```bash
npx prisma db push
npx prisma generate
```

> **Note:** SQLite lacks some PostgreSQL features (enums, JSON columns). You may need to adjust the schema.

## Key Features

- **Multi-role dashboards** — Patient, Doctor, Pharmacy, Hospital, Admin
- **Medicine explorer** — Compare prices across pharmacies, filter by schedule, availability, delivery
- **Appointment booking** — Schedule, confirm, and manage consultations
- **Prescription management** — Doctors write, patients view, pharmacies dispense
- **Queue system** — Virtual queue for walk-in clinics
- **Video consultations** — In-browser telehealth
- **Multi-language** — English, isiZulu, Afrikaans, Sesotho
- **Dark mode** — System-aware with manual toggle
- **Responsive** — Mobile-first, works on all screen sizes
- **Accessible** — ARIA labels, semantic HTML, keyboard navigation

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXTAUTH_URL` | Yes | Base URL (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Yes | Random secret for session encryption |
