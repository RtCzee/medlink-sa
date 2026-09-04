# MedLink SA — Production-Ready Healthcare Platform Plan

## Context

MedLink SA is a South African healthcare platform with 5 user roles (admin, doctor, hospital, patient, pharmacy). It's currently a **frontend-only mockup** — ~28,100 lines of TS/TSX across 56 files with hardcoded data, no real backend, no database, no authentication. The goal is to transform it into a **production-ready, deployable** platform with real auth, database, API, security, and scalable architecture — all using free/open-source services. The design must be deployment-agnostic (demo on Vercel, full deploy elsewhere).

## Approach

**Modular Monolith with Domain Boundaries** — single Next.js app, strict domain separation per role, self-contained modules. This was chosen over microservices (overkill for current scale) and flat monolith (poor maintainability).

**Ponytail mode: full** — YAGNI ladder applied: (1) does it exist? (2) already in codebase? (3) stdlib? (4) native platform? (5) existing dep? (6) one line? (7) minimum that works. Comment deliberate simplifications with `ponytail:`.

---

## Phase 1: Database Schema (Prisma + PostgreSQL)

**What changes:** Replace default SQLite schema with 15 models + 4 enums covering all 5 roles.

### Schema Design

```
enums:
  UserRole          -> patient | doctor | hospital | pharmacy | admin
  EquipmentStatus   -> operational | maintenance | decommissioned
  AppointmentStatus -> scheduled | confirmed | completed | cancelled | no_show
  OrderStatus       -> pending | confirmed | dispensing | ready | delivered | cancelled

models:
  User            -> id, email, name, passwordHash, role, avatar, verified, createdAt, updatedAt
  DoctorProfile   -> userId (FK->User), specialty, licenseNumber, facility, bio
  PatientProfile  -> userId (FK->User), dateOfBirth, gender, idNumber, medicalAid, emergencyContact
  Hospital        -> id, name, address, city, province, phone, email, website, logo, bedCount, verified, createdAt
  HospitalAdmin   -> userId (FK->User), hospitalId (FK->Hospital), position
  Ward            -> id, hospitalId (FK->Hospital), name, capacity, department
  StaffMember     -> userId (FK->User), hospitalId (FK->Hospital), wardId (FK->Ward), position, shift
  Equipment       -> id, hospitalId (FK->Hospital), name, model, status, lastMaintenance, nextMaintenance
  Pharmacist      -> userId (FK->User), licenseNumber, pharmacyName, address, phone
  Medicine        -> id, name, generic, form, strength, pack, schedule, requiresPrescription, category
  MedicinePrice   -> id, medicineId (FK->Medicine), pharmacistId (FK->Pharmacist), price, inStock, deliveryAvailable
  Appointment     -> id, patientId (FK->User), doctorId (FK->User), hospitalId (FK->Hospital), datetime, status, notes, type
  Prescription    -> id, appointmentId (FK->Appointment), doctorId (FK->User), patientId (FK->User), items (Json), notes, dispensed, createdAt
  HealthRecord    -> id, patientId (FK->User), doctorId (FK->User), type, title, content, attachments (Json), createdAt
  Order           -> id, patientId (FK->User), pharmacistId (FK->Pharmacist), items (Json), status, total, deliveryAddress, createdAt
```

### Key Decisions
- **User is single auth entity** — separate profile tables for doctor/patient/pharmacist/hospital-admin
- **Enums for statuses** — not strings, prevents typos, Prisma enforces at DB level
- **Json for flexible fields** — prescription items, order items, health record attachments
- **Cuid IDs** — URL-safe, no sequential leaking
- **Decimal for money** — `Decimal` type for prices
- **No soft deletes** — ponytail: add later if needed; hard delete is simpler for MVP
- **No audit table in schema** — existing `security.ts` localStorage audit log is sufficient for MVP

### Files to Create/Modify
- `prisma/schema.prisma` — **replace entirely** with 15 models + 4 enums
- `.env.example` — document required env vars (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL)
- `.env.local` — create with Supabase connection string + Auth.js secrets (gitignored)

### Supabase Setup
1. Create free Supabase project -> get connection string
2. Update `prisma/schema.prisma` datasource to PostgreSQL
3. Run `npx prisma db push` to sync schema
4. Run `npx prisma generate` to generate client

---

## Phase 2: Auth System (Auth.js v4)

**What changes:** Replace hardcoded `auth-context.tsx` TEST_ACCOUNTS with Auth.js (already installed: `next-auth@4.24.11`).

### Auth.js Configuration

```ts
// src/lib/auth.ts (NEW)
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./db"
import bcrypt from "bcryptjs" // ADD to package.json

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const user = await db.user.findUnique({ where: { email: credentials.email } })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return { id: user.id, name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = user.role
      return token
    },
    async session({ session, token }) {
      session.user.id = token.sub
      session.user.role = token.role
      return session
    },
  },
  pages: {
    signIn: "/sign-in",
  },
})
```

### Route Handlers
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js catch-all route
- `src/app/api/auth/signup/route.ts` — registration endpoint with bcrypt hashing

### Middleware
- `src/middleware.ts` (NEW) — root-level middleware for auth guards
  - Protect `/dashboard/*` routes — redirect to `/sign-in` if unauthenticated
  - Role-based access: each dashboard checks `session.user.role`
  - Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy

### Frontend Integration
- Replace `src/lib/auth-context.tsx` with Auth.js `SessionProvider` + `useSession()`
- Update `src/app/layout.tsx` to wrap with `SessionProvider`
- Update `src/app/sign-in/page.tsx` to use `signIn()` from Auth.js
- Update `src/app/sign-up/page.tsx` to POST to `/api/auth/signup`
- Update `src/components/layout/dashboard-layout.tsx` to use `useSession()` + `signOut()`
- Update all `useAuth()` calls across 5 dashboard pages to `useSession()`

### Seed Script
- `prisma/seed.ts` (NEW) — create test accounts with bcrypt-hashed passwords
- Run via `npx prisma db seed`

### Files to Create/Modify
- `src/lib/auth.ts` — NEW: Auth.js configuration
- `src/middleware.ts` — NEW: auth guards + security headers
- `src/app/api/auth/[...nextauth]/route.ts` — NEW: Auth.js route
- `src/app/api/auth/signup/route.ts` — NEW: registration endpoint
- `src/lib/auth-context.tsx` — **replace** with Auth.js wrapper
- `src/app/layout.tsx` — add SessionProvider
- `src/app/sign-in/page.tsx` — use Auth.js signIn
- `src/app/sign-up/page.tsx` — use Auth.js signup API
- `src/components/layout/dashboard-layout.tsx` — use useSession
- `prisma/seed.ts` — NEW: seed script
- `package.json` — add `bcryptjs`, add `prisma.seed` config

---

## Phase 3: Security Layer

**What changes:** Expand existing `src/lib/security.ts` with server-side protections.

### Server-Side Security
- `src/lib/security/rate-limit.ts` — in-memory rate limiting for API routes (ponytail: Redis later)
- `src/lib/security/validation.ts` — Zod schemas for all API inputs (already have `zod@4.0.2`)
- `src/lib/security/sanitize.ts` — server-side input sanitization (move from client-only)
- `src/lib/security/csrf.ts` — CSRF token validation for form submissions
- `src/lib/security/audit.ts` — server-side audit logging to DB (expand localStorage audit)

### Middleware Security Headers
```ts
// src/middleware.ts additions
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### Anti-Pattern Protections
- **SQL Injection** — Prisma parameterized queries (built-in, no raw SQL)
- **XSS** — React auto-escapes + existing `security.ts` client-side heuristics + server sanitization
- **CSRF** — Auth.js handles session tokens; add CSRF tokens for state-changing operations
- **Prompt Injection** — existing `security.ts` `detectPromptInjection()` function (already built)
- **Brute Force** — server-side rate limiting per IP per endpoint
- **Session Fixation** — Auth.js JWT rotation

### Files to Create/Modify
- `src/lib/security/rate-limit.ts` — NEW
- `src/lib/security/validation.ts` — NEW
- `src/lib/security/sanitize.ts` — NEW (move logic from `src/lib/security.ts`)
- `src/lib/security/csrf.ts` — NEW
- `src/lib/security/audit.ts` — NEW
- `src/lib/security.ts` — refactor to import from modular security files
- `src/middleware.ts` — add security headers

---

## Phase 4: API Layer

**What changes:** Create typed API route handlers with server services pattern.

### API Routes Structure
```
src/app/api/
├── auth/               -> Auth.js (Phase 2)
├── admin/
│   ├── users/          -> GET (list), PATCH (verify/reject)
│   ├── stats/          -> GET (dashboard stats)
│   └── audit/          -> GET (audit logs)
├── doctor/
│   ├── appointments/   -> GET, POST, PATCH
│   ├── patients/       -> GET
│   └── records/        -> GET, POST
├── hospital/
│   ├── stats/          -> GET
│   ├── staff/          -> GET, POST
│   ├── equipment/      -> GET, POST, PATCH
│   └── wards/          -> GET, POST
├── patient/
│   ├── appointments/   -> GET, POST
│   ├── records/        -> GET
│   └── orders/         -> GET, POST
├── pharmacy/
│   ├── medicines/      -> GET, POST
│   ├── orders/         -> GET, PATCH
│   └── inventory/      -> GET, PATCH
└── explore/            -> GET (directory search)
```

### Server Services Pattern
```ts
// src/lib/services/admin.ts (NEW)
import { db } from "../db"
import type { UserRole } from "@prisma/client"

export async function getAdminStats() {
  const [totalUsers, pendingVerifications, totalHospitals] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { verified: "pending" } }),
    db.hospital.count(),
  ])
  return { totalUsers, pendingVerifications, totalHospitals }
}

export async function getUsers(role?: UserRole) {
  return db.user.findMany({
    where: role ? { role } : undefined,
    include: { doctorProfile: true, patientProfile: true },
    orderBy: { createdAt: "desc" },
  })
}
```

### API Response Pattern
```ts
// Standard response shape
type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string }
```

### Files to Create
- `src/lib/services/admin.ts`
- `src/lib/services/doctor.ts`
- `src/lib/services/hospital.ts`
- `src/lib/services/patient.ts`
- `src/lib/services/pharmacy.ts`
- `src/lib/services/explore.ts`
- `src/app/api/admin/users/route.ts`
- `src/app/api/admin/stats/route.ts`
- `src/app/api/admin/audit/route.ts`
- `src/app/api/doctor/appointments/route.ts`
- `src/app/api/doctor/patients/route.ts`
- `src/app/api/doctor/records/route.ts`
- `src/app/api/hospital/stats/route.ts`
- `src/app/api/hospital/staff/route.ts`
- `src/app/api/hospital/equipment/route.ts`
- `src/app/api/hospital/wards/route.ts`
- `src/app/api/patient/appointments/route.ts`
- `src/app/api/patient/records/route.ts`
- `src/app/api/patient/orders/route.ts`
- `src/app/api/pharmacy/medicines/route.ts`
- `src/app/api/pharmacy/orders/route.ts`
- `src/app/api/pharmacy/inventory/route.ts`
- `src/app/api/explore/route.ts`

---

## Phase 5: Frontend Architecture — Dashboard Splitting

**What changes:** Break up 2,500+ line monolith dashboard pages into composable components.

### Splitting Strategy (per dashboard)
Each dashboard page (e.g., `admin/page.tsx` at 2,570 lines) becomes a thin orchestrator importing section components:

```
src/app/dashboard/admin/page.tsx  ->  ~150 lines (layout + state)
src/components/dashboard/admin/
├── stats-cards.tsx           ->  overview metric cards
├── user-management.tsx       ->  user table + filters
├── verification-queue.tsx    ->  pending verifications
├── audit-trail.tsx           ->  audit log table
├── system-health.tsx         ->  server status + metrics
├── platform-settings.tsx     ->  settings panel
├── hospital-directory.tsx    ->  hospital management
└── index.ts                  ->  re-exports
```

### Same pattern for all 5 dashboards:
- `src/components/dashboard/doctor/` — appointments, patients, records, schedule
- `src/components/dashboard/hospital/` — stats, staff, equipment, wards
- `src/components/dashboard/patient/` — appointments, records, orders, profile
- `src/components/dashboard/pharmacy/` — inventory, orders, medicines, delivery

### Shared Components
- `src/components/dashboard/data-table.tsx` — generic sortable/filterable table (wraps @tanstack/react-table)
- `src/components/dashboard/stat-card.tsx` — reusable stat display
- `src/components/dashboard/search-bar.tsx` — search + filter combo
- `src/components/dashboard/skeleton-loader.tsx` — per-section skeleton loading states
- `src/components/dashboard/error-boundary.tsx` — per-section error boundaries

### Data Fetching
- Replace mock data imports with `fetch()` calls to API routes
- Use existing `@tanstack/react-query` (already installed) for caching/refetching
- Add loading states with skeleton loaders

### Files to Create
- 5 x dashboard component directories (~35 component files total)
- 5 x shared dashboard components

### Files to Modify
- `src/app/dashboard/admin/page.tsx` — rewrite as thin orchestrator
- `src/app/dashboard/doctor/page.tsx` — rewrite as thin orchestrator
- `src/app/dashboard/hospital/page.tsx` — rewrite as thin orchestrator
- `src/app/dashboard/patient/page.tsx` — rewrite as thin orchestrator
- `src/app/dashboard/pharmacy/page.tsx` — rewrite as thin orchestrator

---

## Phase 6: Deployment Configuration

**What changes:** Make the app deployable anywhere.

### Environment Variables
```env
# .env.example
DATABASE_URL=postgresql://...        # Supabase / self-hosted Postgres
NEXTAUTH_SECRET=...                  # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000   # or production URL
```

### Vercel Deployment
- `vercel.json` (if needed) — build command: `next build --webpack`
- Database: Supabase free tier (external)
- No Vercel-specific dependencies

### Self-Hosted Deployment
- `Dockerfile` (NEW) — multi-stage build
- `docker-compose.yml` (NEW) — app + PostgreSQL containers
- `.dockerignore` (NEW)

### Files to Create
- `.env.example`
- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `vercel.json` (optional)

---

## Verification Plan

### After Each Phase
1. `npx prisma generate` — schema compiles
2. `npx prisma db push` — schema syncs to DB
3. `npm run build` — builds without errors
4. Manual sign-in test with seeded accounts

### After All Phases
1. Full build passes: `npm run build`
2. Dev server starts: `npm run dev`
3. Sign in with each of 5 test roles -> correct dashboard loads
4. Each dashboard loads data from API (not mock)
5. Security headers present in response
6. Rate limiting works (spam sign-in -> blocked)
7. Role-based access works (doctor can't access admin routes)

### Lint/Typecheck
- `npm run lint` passes
- No TypeScript errors

---

## Task Dependency Graph

| Task | Depends On | Reason |
|------|------------|--------|
| Phase 1: Database Schema | None | Foundation — all other phases need the schema |
| Phase 2: Auth System | Phase 1 | Auth needs User model + bcrypt to verify passwords |
| Phase 3: Security Layer | Phase 2 | Server security builds on auth middleware |
| Phase 4: API Layer | Phase 1, 2, 3 | APIs need schema + auth + validation |
| Phase 5: Frontend Architecture | Phase 4 | Frontend fetches from API routes |
| Phase 6: Deployment Config | Phase 1-5 | Final packaging after all features work |

## Parallel Execution Graph

```
Wave 1 (Start immediately):
└── Phase 1: Database Schema

Wave 2 (After Wave 1):
└── Phase 2: Auth System

Wave 3 (After Phase 2):
├── Phase 3: Security Layer
└── Phase 4: API Layer (can start service files, routes need security)

Wave 4 (After Phase 4):
└── Phase 5: Frontend Architecture

Wave 5 (After Phase 4-5):
└── Phase 6: Deployment Config

Critical Path: Phase 1 -> Phase 2 -> Phase 4 -> Phase 5 -> Phase 6
```

## Delegation Recommendation

| Phase | Agent Type | Reason |
|-------|-----------|--------|
| Phase 1: Database Schema | General coding agent | Prisma schema work, straightforward |
| Phase 2: Auth System | General coding agent | Auth.js config, middleware, route handlers |
| Phase 3: Security Layer | General coding agent | Security utilities, middleware headers |
| Phase 4: API Layer | General coding agent | CRUD route handlers + services |
| Phase 5: Frontend Architecture | General coding agent | Component splitting + data fetching |
| Phase 6: Deployment Config | General coding agent | Docker + env config |

All phases should be executed sequentially by the main agent.

## TODOs

- [ ] **Phase 1.1** — Create `.env.example` with DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
- [ ] **Phase 1.2** — Create `.env.local` with Supabase connection string (gitignored)
- [ ] **Phase 1.3** — Replace `prisma/schema.prisma` with 15 models + 4 enums
- [ ] **Phase 1.4** — Run `npx prisma generate` to verify schema compiles
- [ ] **Phase 1.5** — Run `npx prisma db push` to sync to Supabase
- [ ] **Phase 2.1** — Add `bcryptjs` to package.json + install
- [ ] **Phase 2.2** — Create `src/lib/auth.ts` (Auth.js configuration)
- [ ] **Phase 2.3** — Create `src/app/api/auth/[...nextauth]/route.ts`
- [ ] **Phase 2.4** — Create `src/app/api/auth/signup/route.ts`
- [ ] **Phase 2.5** — Create `src/middleware.ts` (auth guards)
- [ ] **Phase 2.6** — Replace `src/lib/auth-context.tsx` with Auth.js wrapper
- [ ] **Phase 2.7** — Update `src/app/layout.tsx` with SessionProvider
- [ ] **Phase 2.8** — Update `src/app/sign-in/page.tsx` to use Auth.js
- [ ] **Phase 2.9** — Update `src/app/sign-up/page.tsx` to use Auth.js signup
- [ ] **Phase 2.10** — Update `src/components/layout/dashboard-layout.tsx` to use useSession
- [ ] **Phase 2.11** — Create `prisma/seed.ts` with 5 test accounts (bcrypt hashed)
- [ ] **Phase 2.12** — Add prisma.seed config to package.json
- [ ] **Phase 3.1** — Create `src/lib/security/rate-limit.ts`
- [ ] **Phase 3.2** — Create `src/lib/security/validation.ts` (Zod schemas)
- [ ] **Phase 3.3** — Create `src/lib/security/sanitize.ts`
- [ ] **Phase 3.4** — Create `src/lib/security/csrf.ts`
- [ ] **Phase 3.5** — Create `src/lib/security/audit.ts`
- [ ] **Phase 3.6** — Refactor `src/lib/security.ts` to import from modular files
- [ ] **Phase 3.7** — Add security headers to `src/middleware.ts`
- [ ] **Phase 4.1** — Create `src/lib/services/admin.ts`
- [ ] **Phase 4.2** — Create `src/lib/services/doctor.ts`
- [ ] **Phase 4.3** — Create `src/lib/services/hospital.ts`
- [ ] **Phase 4.4** — Create `src/lib/services/patient.ts`
- [ ] **Phase 4.5** — Create `src/lib/services/pharmacy.ts`
- [ ] **Phase 4.6** — Create `src/lib/services/explore.ts`
- [ ] **Phase 4.7** — Create admin API routes (users, stats, audit)
- [ ] **Phase 4.8** — Create doctor API routes (appointments, patients, records)
- [ ] **Phase 4.9** — Create hospital API routes (stats, staff, equipment, wards)
- [ ] **Phase 4.10** — Create patient API routes (appointments, records, orders)
- [ ] **Phase 4.11** — Create pharmacy API routes (medicines, orders, inventory)
- [ ] **Phase 4.12** — Create explore API route
- [ ] **Phase 5.1** — Create shared dashboard components (data-table, stat-card, search-bar, skeleton, error-boundary)
- [ ] **Phase 5.2** — Split admin dashboard into ~8 section components
- [ ] **Phase 5.3** — Split doctor dashboard into ~6 section components
- [ ] **Phase 5.4** — Split hospital dashboard into ~7 section components
- [ ] **Phase 5.5** — Split patient dashboard into ~6 section components
- [ ] **Phase 5.6** — Split pharmacy dashboard into ~6 section components
- [ ] **Phase 5.7** — Wire all dashboards to API routes with React Query
- [ ] **Phase 6.1** — Create `.env.example`
- [ ] **Phase 6.2** — Create `Dockerfile` (multi-stage build)
- [ ] **Phase 6.3** — Create `docker-compose.yml` (app + PostgreSQL)
- [ ] **Phase 6.4** — Create `.dockerignore`
- [ ] **Phase 6.5** — Verify full build passes: `npm run build`
- [ ] **Phase 6.6** — Verify dev server starts and all 5 roles work

## Verification

1. `npx prisma generate` — schema compiles without errors
2. `npx prisma db push` — schema syncs to Supabase PostgreSQL
3. `npm run build` — full production build passes (14+ pages)
4. `npm run dev` — dev server starts on port 3000
5. Sign in with each test account -> correct role dashboard loads
6. Dashboard data comes from API (not mock data)
7. Security headers present in HTTP responses
8. Rate limiting blocks brute-force attempts
9. Role-based access prevents cross-role navigation
10. `npm run lint` passes with no errors
