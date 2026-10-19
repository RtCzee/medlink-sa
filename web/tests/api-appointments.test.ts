// MOCKED unit tests for the patient appointment endpoints. Supabase Auth and Prisma
// are mocked: nothing touches the network or a database. The concurrency test at the
// bottom uses an in-memory lock to show the routes check for conflicts UNDER the
// booking lock; it does NOT prove PostgreSQL's locking (see
// appointments-locking.integration.test.ts for that).
import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { USER_A, USER_B, apiRequest, readJson, signedInAs, signedOut, type ErrorBody } from "./helpers";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  db: {
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    appointment: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    practitioner: { findUnique: vi.fn() },
    facility: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import { POST as cancelAppointment } from "@/app/api/appointments/[id]/cancel/route";
import { GET as getAppointment, PATCH as patchAppointment } from "@/app/api/appointments/[id]/route";
import { GET as listAppointments, POST as createAppointment } from "@/app/api/appointments/route";
import { APPOINTMENT_ORDER_BY, APPOINTMENT_SELECT } from "@/lib/api/appointments";
import { resetRateLimits } from "@/lib/api/rate-limit";

// 2026-10-19 10:00 SAST (UTC+2).
const NOW = new Date("2026-10-19T08:00:00.000Z");
const APPT_ID = "a1a1a1a1-b2b2-4c3c-8d4d-e5e5e5e5e5e5";
const OTHER_ID = "f0f0f0f0-e1e1-4d2d-9c3c-b4b4b4b4b4b4";
const PRACTITIONER_ID = "8a7b6c5d-4e3f-4a1b-8c9d-0e1f2a3b4c5d";
const FACILITY_ID = "3f2b8c1e-7d4a-4e5b-9c6d-1a2b3c4d5e6f";
const OTHER_FACILITY_ID = "9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b";

// Tomorrow 09:30 SAST == 07:30 UTC.
const SLOT_SAST = "2026-10-20T09:30:00+02:00";
const SLOT_UTC = new Date("2026-10-20T07:30:00.000Z");

const PRACTITIONER = {
  id: PRACTITIONER_ID,
  fullName: "Dr Sipho Dlamini",
  specialty: "Cardiology",
  facilityId: FACILITY_ID,
  profileId: null as string | null,
  facility: { id: FACILITY_ID, name: "Chris Hani Baragwanath Hospital" },
};

function row(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: APPT_ID,
    practitionerId: PRACTITIONER_ID,
    practitionerName: "Dr Sipho Dlamini",
    specialty: "Cardiology",
    facilityId: FACILITY_ID,
    facilityName: "Chris Hani Baragwanath Hospital",
    scheduledAt: SLOT_UTC,
    reason: "Check-up",
    status: "requested",
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

const DTO = {
  id: APPT_ID,
  practitionerId: PRACTITIONER_ID,
  practitionerName: "Dr Sipho Dlamini",
  specialty: "Cardiology",
  facilityId: FACILITY_ID,
  facilityName: "Chris Hani Baragwanath Hospital",
  scheduledAt: "2026-10-20T07:30:00.000Z",
  reason: "Check-up",
  status: "requested",
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (path: string, headers?: Record<string, string>) => apiRequest(path, { headers });
const post = (path: string, body?: unknown, headers?: Record<string, string>) =>
  apiRequest(path, { method: "POST", body, headers });
const patch = (path: string, body?: unknown) => apiRequest(path, { method: "PATCH", body });

const validCreate = (overrides: Record<string, unknown> = {}) => ({
  practitionerId: PRACTITIONER_ID,
  scheduledAt: SLOT_SAST,
  reason: "Check-up",
  ...overrides,
});

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError(
    'Invalid `prisma.appointment.create()` invocation: relation "appointments" password=hunter2',
    { code, clientVersion: "6.19.3" }
  );
}

function dbTouched(): boolean {
  return (
    mocks.db.$transaction.mock.calls.length > 0 ||
    Object.values(mocks.db.appointment).some((fn) => fn.mock.calls.length > 0) ||
    mocks.db.practitioner.findUnique.mock.calls.length > 0
  );
}

/** The lock keys passed to pg_advisory_xact_lock, in call order. */
function lockKeys(): string[] {
  return mocks.db.$executeRaw.mock.calls.map((call) => String(call[1]));
}

async function expectError(res: Response, status: number, code: string) {
  expect(res.status).toBe(status);
  expect(res.headers.get("cache-control")).toBe("no-store");
  const body = await readJson<ErrorBody>(res);
  expect(body.error.code).toBe(code);
  expect(body.requestId).toBe(res.headers.get("x-request-id"));
  return body;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  resetRateLimits();
  signedInAs(mocks.getUser, USER_A);
  mocks.db.$transaction.mockImplementation((arg: unknown) =>
    typeof arg === "function"
      ? (arg as (tx: typeof mocks.db) => Promise<unknown>)(mocks.db)
      : Promise.all(arg as Promise<unknown>[])
  );
  mocks.db.$executeRaw.mockResolvedValue(1);
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

/* ------------------------------ Authentication ----------------------------- */

describe("appointments: authentication (MOCKED)", () => {
  const calls: Array<[string, () => Promise<Response>]> = [
    ["GET list", () => listAppointments(get("/api/appointments"))],
    ["POST create", () => createAppointment(post("/api/appointments", validCreate()))],
    ["GET detail", () => getAppointment(get(`/api/appointments/${APPT_ID}`), ctx(APPT_ID))],
    ["PATCH", () => patchAppointment(patch(`/api/appointments/${APPT_ID}`, { reason: "x" }), ctx(APPT_ID))],
    ["POST cancel", () => cancelAppointment(post(`/api/appointments/${APPT_ID}/cancel`), ctx(APPT_ID))],
  ];

  it.each(calls)("%s without a session -> 401, no DB access", async (_name, call) => {
    signedOut(mocks.getUser);
    await expectError(await call(), 401, "UNAUTHENTICATED");
    expect(dbTouched()).toBe(false);
  });

  it("a malformed Authorization header -> 401 (never falls back to cookies)", async () => {
    const res = await listAppointments(get("/api/appointments", { authorization: "Bearer nope" }));
    await expectError(res, 401, "UNAUTHENTICATED");
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(dbTouched()).toBe(false);
  });

  it("cookie-authenticated write from another origin -> 403", async () => {
    const res = await createAppointment(
      post("/api/appointments", validCreate(), { origin: "https://evil.example" })
    );
    await expectError(res, 403, "FORBIDDEN");
    expect(dbTouched()).toBe(false);
  });
});

/* ---------------------------------- List ----------------------------------- */

describe("GET /api/appointments (MOCKED)", () => {
  it("lists only the caller's appointments, ordered by time then id, no-store", async () => {
    mocks.db.appointment.findMany.mockResolvedValue([row()]);
    mocks.db.appointment.count.mockResolvedValue(1);

    const res = await listAppointments(get("/api/appointments"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({
      data: [DTO],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    expect(mocks.db.appointment.findMany).toHaveBeenCalledWith({
      where: { patientId: USER_A.id },
      select: APPOINTMENT_SELECT,
      orderBy: APPOINTMENT_ORDER_BY,
      skip: 0,
      take: 20,
    });
    expect(APPOINTMENT_ORDER_BY).toEqual([{ scheduledAt: "asc" }, { id: "asc" }]);
    expect(mocks.db.appointment.count).toHaveBeenCalledWith({ where: { patientId: USER_A.id } });
  });

  it("scopes to whoever is signed in (user B sees only B's)", async () => {
    signedInAs(mocks.getUser, USER_B);
    mocks.db.appointment.findMany.mockResolvedValue([]);
    mocks.db.appointment.count.mockResolvedValue(0);

    await listAppointments(get("/api/appointments"));

    expect(mocks.db.appointment.findMany.mock.calls[0][0].where).toEqual({ patientId: USER_B.id });
  });

  it("maps status, from (inclusive) and to (exclusive) to UTC instants; paginates", async () => {
    mocks.db.appointment.findMany.mockResolvedValue([]);
    mocks.db.appointment.count.mockResolvedValue(45);

    const res = await listAppointments(
      get(
        "/api/appointments?status=confirmed&from=2026-10-20T00:00:00%2B02:00&to=2026-10-27T00:00:00Z&page=3&pageSize=10"
      )
    );

    expect(res.status).toBe(200);
    const args = mocks.db.appointment.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      patientId: USER_A.id,
      status: "confirmed",
      scheduledAt: {
        gte: new Date("2026-10-19T22:00:00.000Z"),
        lt: new Date("2026-10-27T00:00:00.000Z"),
      },
    });
    expect(args.skip).toBe(20);
    expect(args.take).toBe(10);
    expect((await readJson<{ meta: unknown }>(res)).meta).toEqual({
      page: 3,
      pageSize: 10,
      total: 45,
      totalPages: 5,
    });
  });

  it.each([
    "status=done",
    "status=REQUESTED",
    "from=2026-10-20",
    "from=2026-10-20T09:30:00",
    "from=2026-10-21T00:00:00Z&to=2026-10-20T00:00:00Z",
    "from=2026-10-20T00:00:00Z&to=2026-10-20T00:00:00Z",
    "page=0",
    "page=1.5",
    "pageSize=101",
    `patientId=${USER_B.id}`,
    "unknown=1",
    "status=requested&status=confirmed",
  ])("rejects ?%s with 400 and no DB call", async (qs) => {
    const res = await listAppointments(get(`/api/appointments?${qs}`));
    const body = await expectError(res, 400, "VALIDATION_FAILED");
    expect(body.error.message).toBe("The query string is invalid.");
    expect(mocks.db.appointment.findMany).not.toHaveBeenCalled();
  });

  it("drops fields that are not in the DTO even if the DB returned them", async () => {
    mocks.db.appointment.findMany.mockResolvedValue([row({ patientId: USER_B.id, internal: "x" })]);
    mocks.db.appointment.count.mockResolvedValue(1);

    const body = await readJson<{ data: Record<string, unknown>[] }>(
      await listAppointments(get("/api/appointments"))
    );

    expect(body.data[0]).toEqual(DTO);
    expect(body.data[0]).not.toHaveProperty("patientId");
  });

  it("DB failure -> 500 generic, no internals, no-store", async () => {
    mocks.db.$transaction.mockRejectedValue(new Error('relation "appointments" password=hunter2'));

    const res = await listAppointments(get("/api/appointments"));
    const body = await expectError(res, 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|relation|appointments"/);
  });
});

/* --------------------------------- Detail ---------------------------------- */

describe("GET /api/appointments/{id} (MOCKED)", () => {
  it("returns the caller's appointment, filtered by id AND patientId", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue(row({ status: "confirmed" }));

    const res = await getAppointment(get(`/api/appointments/${APPT_ID}`), ctx(APPT_ID));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({ data: { ...DTO, status: "confirmed" } });
    expect(mocks.db.appointment.findFirst).toHaveBeenCalledWith({
      where: { id: APPT_ID, patientId: USER_A.id },
      select: APPOINTMENT_SELECT,
    });
  });

  it("another patient's (or a missing) appointment -> the same 404", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue(null);
    const foreign = await getAppointment(get(`/api/appointments/${OTHER_ID}`), ctx(OTHER_ID));
    const missing = await getAppointment(get(`/api/appointments/${APPT_ID}`), ctx(APPT_ID));

    const a = await expectError(foreign, 404, "APPOINTMENT_NOT_FOUND");
    const b = await expectError(missing, 404, "APPOINTMENT_NOT_FOUND");
    expect(a.error).toEqual(b.error);
  });

  it("invalid id -> 400 (path id), unknown query -> 400", async () => {
    const bad = await getAppointment(get("/api/appointments/abc"), ctx("abc"));
    const body = await expectError(bad, 400, "VALIDATION_FAILED");
    expect(body.error.details?.[0].path).toBe("id");

    const extra = await getAppointment(get(`/api/appointments/${APPT_ID}?expand=1`), ctx(APPT_ID));
    await expectError(extra, 400, "VALIDATION_FAILED");
    expect(mocks.db.appointment.findFirst).not.toHaveBeenCalled();
  });
});

/* --------------------------------- Create ---------------------------------- */

describe("POST /api/appointments (MOCKED)", () => {
  beforeEach(() => {
    mocks.db.practitioner.findUnique.mockResolvedValue(PRACTITIONER);
    mocks.db.appointment.findFirst.mockResolvedValue(null);
    mocks.db.appointment.create.mockResolvedValue(row());
  });

  it("creates for the session patient with server-derived names and the default status", async () => {
    const res = await createAppointment(post("/api/appointments", validCreate()));

    expect(res.status).toBe(201);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({ data: DTO });

    const { data, select } = mocks.db.appointment.create.mock.calls[0][0];
    expect(select).toEqual(APPOINTMENT_SELECT);
    expect(data).toEqual({
      patientId: USER_A.id,
      practitionerId: PRACTITIONER_ID,
      practitionerName: "Dr Sipho Dlamini",
      specialty: "Cardiology",
      facilityId: FACILITY_ID,
      facilityName: "Chris Hani Baragwanath Hospital",
      scheduledAt: SLOT_UTC, // +02:00 input stored as the UTC instant
      reason: "Check-up",
    });
    expect(data).not.toHaveProperty("status");
  });

  it("takes the booking locks (practitioner, then patient) before any check or write", async () => {
    await createAppointment(post("/api/appointments", validCreate()));

    expect(lockKeys()).toEqual([
      `appointments:practitioner:${PRACTITIONER_ID}`,
      `appointments:patient:${USER_A.id}`,
    ]);
    const lastLock = Math.max(...mocks.db.$executeRaw.mock.invocationCallOrder);
    expect(mocks.db.practitioner.findUnique.mock.invocationCallOrder[0]).toBeGreaterThan(lastLock);
    expect(mocks.db.appointment.findFirst.mock.invocationCallOrder[0]).toBeGreaterThan(lastLock);
    expect(mocks.db.appointment.create.mock.invocationCallOrder[0]).toBeGreaterThan(
      mocks.db.appointment.findFirst.mock.invocationCallOrder[0]
    );
  });

  it("checks the slot for the practitioner OR the patient, active statuses, exact start", async () => {
    await createAppointment(post("/api/appointments", validCreate()));

    expect(mocks.db.appointment.findFirst).toHaveBeenCalledWith({
      where: {
        scheduledAt: SLOT_UTC,
        status: { in: ["requested", "confirmed"] },
        OR: [{ practitionerId: PRACTITIONER_ID }, { patientId: USER_A.id }],
      },
      select: { patientId: true },
    });
  });

  it("reason is optional (stored as null); a matching facilityId is accepted", async () => {
    const res = await createAppointment(
      post("/api/appointments", { practitionerId: PRACTITIONER_ID, facilityId: FACILITY_ID, scheduledAt: SLOT_SAST })
    );
    expect(res.status).toBe(201);
    expect(mocks.db.appointment.create.mock.calls[0][0].data.reason).toBeNull();
  });

  it.each([
    ["patientId", USER_B.id],
    ["status", "confirmed"],
    ["practitionerName", "Dr Fake"],
    ["facilityName", "Fake Clinic"],
    ["specialty", "Surgery"],
    ["id", APPT_ID],
    ["createdAt", NOW.toISOString()],
    ["updatedAt", NOW.toISOString()],
  ])("rejects the forbidden field %s (400 unrecognized_keys, nothing written)", async (field, value) => {
    const res = await createAppointment(post("/api/appointments", validCreate({ [field]: value })));
    const body = await expectError(res, 400, "VALIDATION_FAILED");
    expect(body.error.details?.[0]).toMatchObject({ code: "unrecognized_keys", keys: [field] });
    expect(dbTouched()).toBe(false);
  });

  it.each([
    ["missing practitionerId", { scheduledAt: SLOT_SAST }],
    ["missing scheduledAt", { practitionerId: PRACTITIONER_ID }],
    ["practitionerId not a uuid", validCreate({ practitionerId: "abc" })],
    ["facilityId not a uuid", validCreate({ facilityId: 42 })],
    ["scheduledAt without an offset", validCreate({ scheduledAt: "2026-10-20T09:30:00" })],
    ["scheduledAt date only", validCreate({ scheduledAt: "2026-10-20" })],
    ["scheduledAt impossible date", validCreate({ scheduledAt: "2026-02-30T09:30:00Z" })],
    ["scheduledAt with seconds", validCreate({ scheduledAt: "2026-10-20T09:30:15+02:00" })],
    ["scheduledAt in the past", validCreate({ scheduledAt: "2026-10-19T09:59:00+02:00" })],
    ["scheduledAt exactly now", validCreate({ scheduledAt: "2026-10-19T10:00:00+02:00" })],
    ["scheduledAt beyond 365 days", validCreate({ scheduledAt: "2027-10-20T09:30:00+02:00" })],
    ["scheduledAt as a number", validCreate({ scheduledAt: 1792488600000 })],
    ["reason empty", validCreate({ reason: "   " })],
    ["reason too long", validCreate({ reason: "x".repeat(501) })],
    ["reason not a string", validCreate({ reason: 5 })],
  ])("%s -> 400 VALIDATION_FAILED, nothing written", async (_name, body) => {
    const res = await createAppointment(post("/api/appointments", body));
    await expectError(res, 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("malformed JSON, non-object body and wrong content type are rejected", async () => {
    const bad = await createAppointment(
      apiRequest("/api/appointments", { method: "POST", rawBody: "{nope", headers: { "content-type": "application/json" } })
    );
    await expectError(bad, 400, "INVALID_JSON");
    const arr = await createAppointment(post("/api/appointments", [validCreate()]));
    await expectError(arr, 400, "INVALID_BODY");
    const text = await createAppointment(
      apiRequest("/api/appointments", { method: "POST", rawBody: "x", headers: { "content-type": "text/plain" } })
    );
    await expectError(text, 415, "UNSUPPORTED_MEDIA_TYPE");
    expect(dbTouched()).toBe(false);
  });

  it("unknown practitioner -> 404 PRACTITIONER_NOT_FOUND, nothing written", async () => {
    mocks.db.practitioner.findUnique.mockResolvedValue(null);
    await expectError(await createAppointment(post("/api/appointments", validCreate())), 404, "PRACTITIONER_NOT_FOUND");
    expect(mocks.db.appointment.create).not.toHaveBeenCalled();
  });

  it("practitioner without a facility -> 400 (path practitionerId)", async () => {
    mocks.db.practitioner.findUnique.mockResolvedValue({ ...PRACTITIONER, facilityId: null, facility: null });
    const body = await expectError(
      await createAppointment(post("/api/appointments", validCreate())),
      400,
      "VALIDATION_FAILED"
    );
    expect(body.error.details?.[0].path).toBe("practitionerId");
    expect(mocks.db.appointment.create).not.toHaveBeenCalled();
  });

  it("facilityId of another existing facility -> 400 (path facilityId)", async () => {
    mocks.db.facility.findUnique.mockResolvedValue({ id: OTHER_FACILITY_ID });
    const body = await expectError(
      await createAppointment(post("/api/appointments", validCreate({ facilityId: OTHER_FACILITY_ID }))),
      400,
      "VALIDATION_FAILED"
    );
    expect(body.error.details?.[0].path).toBe("facilityId");
    expect(mocks.db.appointment.create).not.toHaveBeenCalled();
  });

  it("facilityId that doesn't exist -> 404 FACILITY_NOT_FOUND", async () => {
    mocks.db.facility.findUnique.mockResolvedValue(null);
    await expectError(
      await createAppointment(post("/api/appointments", validCreate({ facilityId: OTHER_FACILITY_ID }))),
      404,
      "FACILITY_NOT_FOUND"
    );
    expect(mocks.db.appointment.create).not.toHaveBeenCalled();
  });

  it("a practitioner can't book themselves -> 400", async () => {
    mocks.db.practitioner.findUnique.mockResolvedValue({ ...PRACTITIONER, profileId: USER_A.id });
    await expectError(await createAppointment(post("/api/appointments", validCreate())), 400, "VALIDATION_FAILED");
    expect(mocks.db.appointment.create).not.toHaveBeenCalled();
  });

  it("practitioner already booked at that time -> 409 APPOINTMENT_CONFLICT", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue({ patientId: USER_B.id });
    const body = await expectError(
      await createAppointment(post("/api/appointments", validCreate())),
      409,
      "APPOINTMENT_CONFLICT"
    );
    expect(body.error.message).toMatch(/not available with this practitioner/);
    expect(JSON.stringify(body)).not.toContain(USER_B.id);
    expect(mocks.db.appointment.create).not.toHaveBeenCalled();
  });

  it("patient already has an appointment at that time -> 409 APPOINTMENT_CONFLICT", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue({ patientId: USER_A.id });
    const body = await expectError(
      await createAppointment(post("/api/appointments", validCreate())),
      409,
      "APPOINTMENT_CONFLICT"
    );
    expect(body.error.message).toBe("You already have an appointment at that time.");
  });

  it("missing patient profile (FK P2003) -> 404 PROFILE_NOT_FOUND, no internals", async () => {
    mocks.db.appointment.create.mockRejectedValue(knownError("P2003"));
    const body = await expectError(
      await createAppointment(post("/api/appointments", validCreate())),
      404,
      "PROFILE_NOT_FOUND"
    );
    expect(JSON.stringify(body)).not.toMatch(/hunter2|prisma/);
  });

  it.each(["P2028", "P2034"])("transaction %s (lock wait / timeout) -> 503, retryable", async (code) => {
    mocks.db.$transaction.mockRejectedValue(knownError(code));
    await expectError(await createAppointment(post("/api/appointments", validCreate())), 503, "SERVICE_UNAVAILABLE");
  });

  it("unexpected DB error -> 500 generic, no SQL or secrets", async () => {
    mocks.db.appointment.create.mockRejectedValue(new Error('insert into "appointments" password=hunter2'));
    const body = await expectError(
      await createAppointment(post("/api/appointments", validCreate())),
      500,
      "INTERNAL_ERROR"
    );
    expect(JSON.stringify(body)).not.toMatch(/hunter2|insert|appointments"/);
  });
});

/* ---------------------------------- PATCH ---------------------------------- */

describe("PATCH /api/appointments/{id} (MOCKED)", () => {
  const state = (overrides: Record<string, unknown> = {}) => ({
    id: APPT_ID,
    status: "requested",
    scheduledAt: SLOT_UTC,
    practitionerId: PRACTITIONER_ID,
    ...overrides,
  });

  /** findFirst calls: state reads (and the conflict check) then the final full read. */
  function primeFindFirst(current: Record<string, unknown> | null, after: Record<string, unknown> = row()) {
    mocks.db.appointment.findFirst.mockImplementation(async (args: { select: Record<string, unknown> }) => {
      if ("patientId" in args.select && Object.keys(args.select).length === 1) return null; // slot check
      if (args.select === APPOINTMENT_SELECT) return after;
      return current;
    });
    mocks.db.appointment.updateMany.mockResolvedValue({ count: 1 });
  }

  const call = (body: unknown, id = APPT_ID) =>
    patchAppointment(patch(`/api/appointments/${id}`, body), ctx(id));

  it("updates the reason of a confirmed appointment (no locks; guarded write)", async () => {
    primeFindFirst(state({ status: "confirmed" }), row({ status: "confirmed", reason: "Follow-up" }));

    const res = await call({ reason: "  Follow-up  " });

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await readJson<{ data: { reason: string } }>(res)).data.reason).toBe("Follow-up");
    expect(mocks.db.$executeRaw).not.toHaveBeenCalled();
    expect(mocks.db.appointment.updateMany).toHaveBeenCalledWith({
      where: { id: APPT_ID, patientId: USER_A.id, status: "confirmed", scheduledAt: SLOT_UTC },
      data: { reason: "Follow-up" },
    });
  });

  it("reason: null clears it", async () => {
    primeFindFirst(state());
    await call({ reason: null });
    expect(mocks.db.appointment.updateMany.mock.calls[0][0].data).toEqual({ reason: null });
  });

  it("reschedules a requested appointment under the lock, excluding itself from the conflict check", async () => {
    primeFindFirst(state());
    const res = await call({ scheduledAt: "2026-10-21T14:00:00+02:00" });

    expect(res.status).toBe(200);
    expect(lockKeys()).toEqual([
      `appointments:practitioner:${PRACTITIONER_ID}`,
      `appointments:patient:${USER_A.id}`,
    ]);
    const slotCheck = mocks.db.appointment.findFirst.mock.calls.find(
      ([args]) => Object.keys(args.select).length === 1
    )?.[0];
    expect(slotCheck.where).toMatchObject({
      scheduledAt: new Date("2026-10-21T12:00:00.000Z"),
      NOT: { id: APPT_ID },
    });
    expect(mocks.db.appointment.updateMany.mock.calls[0][0].data).toEqual({
      scheduledAt: new Date("2026-10-21T12:00:00.000Z"),
    });
  });

  it("rescheduling into a taken slot -> 409 APPOINTMENT_CONFLICT, nothing written", async () => {
    primeFindFirst(state());
    mocks.db.appointment.findFirst.mockImplementation(async (args: { select: Record<string, unknown> }) =>
      Object.keys(args.select).length === 1 ? { patientId: USER_B.id } : state()
    );
    await expectError(await call({ scheduledAt: "2026-10-21T14:00:00+02:00" }), 409, "APPOINTMENT_CONFLICT");
    expect(mocks.db.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("same scheduledAt -> no write, 200 unchanged", async () => {
    primeFindFirst(state());
    const res = await call({ scheduledAt: SLOT_SAST });
    expect(res.status).toBe(200);
    expect(mocks.db.appointment.updateMany).not.toHaveBeenCalled();
    expect(mocks.db.$executeRaw).not.toHaveBeenCalled();
  });

  it.each([
    ["a confirmed appointment", state({ status: "confirmed" }), { scheduledAt: "2026-10-21T14:00:00+02:00" }],
    ["a cancelled appointment", state({ status: "cancelled" }), { reason: "x" }],
    ["a completed appointment", state({ status: "completed" }), { reason: "x" }],
    ["a past appointment", state({ scheduledAt: new Date("2026-10-19T07:00:00.000Z") }), { reason: "x" }],
    ["one whose practitioner was removed", state({ practitionerId: null }), { scheduledAt: "2026-10-21T14:00:00+02:00" }],
  ])("changing %s -> 409 APPOINTMENT_NOT_EDITABLE", async (_name, current, body) => {
    primeFindFirst(current);
    await expectError(await call(body), 409, "APPOINTMENT_NOT_EDITABLE");
    expect(mocks.db.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("the appointment changed concurrently (guarded write matched 0 rows) -> 409", async () => {
    primeFindFirst(state());
    mocks.db.appointment.updateMany.mockResolvedValue({ count: 0 });
    await expectError(await call({ reason: "x" }), 409, "APPOINTMENT_NOT_EDITABLE");
  });

  it("another patient's appointment -> 404, nothing written", async () => {
    primeFindFirst(null);
    await expectError(await call({ reason: "x" }, OTHER_ID), 404, "APPOINTMENT_NOT_FOUND");
    expect(mocks.db.appointment.findFirst.mock.calls[0][0].where).toEqual({ id: OTHER_ID, patientId: USER_A.id });
    expect(mocks.db.appointment.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ["status", "completed"],
    ["status", "confirmed"],
    ["practitionerId", PRACTITIONER_ID],
    ["facilityId", FACILITY_ID],
    ["patientId", USER_B.id],
    ["practitionerName", "x"],
    ["createdAt", NOW.toISOString()],
    ["updatedAt", NOW.toISOString()],
  ])("rejects %s=%s (400, nothing read or written)", async (field, value) => {
    await expectError(await call({ [field]: value }), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it.each([
    ["empty object", {}],
    ["past time", { scheduledAt: "2026-10-18T09:30:00+02:00" }],
    ["time without offset", { scheduledAt: "2026-10-21T14:00:00" }],
    ["empty reason", { reason: "" }],
  ])("%s -> 400", async (_name, body) => {
    await expectError(await call(body), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });
});

/* --------------------------------- Cancel ---------------------------------- */

describe("POST /api/appointments/{id}/cancel (MOCKED)", () => {
  const cancel = (id = APPT_ID, body?: unknown, raw?: string) =>
    cancelAppointment(
      raw !== undefined
        ? apiRequest(`/api/appointments/${id}/cancel`, { method: "POST", rawBody: raw, headers: { "content-type": "application/json" } })
        : post(`/api/appointments/${id}/cancel`, body),
      ctx(id)
    );

  it.each(["requested", "confirmed"])("%s -> cancelled (guarded transition, 200)", async (status) => {
    mocks.db.appointment.findFirst
      .mockResolvedValueOnce(row({ status }))
      .mockResolvedValueOnce(row({ status: "cancelled" }));
    mocks.db.appointment.updateMany.mockResolvedValue({ count: 1 });

    const res = await cancel();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await readJson<{ data: { status: string } }>(res)).data.status).toBe("cancelled");
    expect(mocks.db.appointment.updateMany).toHaveBeenCalledWith({
      where: { id: APPT_ID, patientId: USER_A.id, status: { in: ["requested", "confirmed"] } },
      data: { status: "cancelled" },
    });
  });

  it("repeat cancel -> 200 with the appointment unchanged, no write", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue(row({ status: "cancelled" }));
    const res = await cancel();
    expect(res.status).toBe(200);
    expect((await readJson<{ data: { status: string } }>(res)).data.status).toBe("cancelled");
    expect(mocks.db.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("completed -> 409 APPOINTMENT_NOT_CANCELLABLE", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue(row({ status: "completed" }));
    await expectError(await cancel(), 409, "APPOINTMENT_NOT_CANCELLABLE");
    expect(mocks.db.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("time already passed -> 409 APPOINTMENT_NOT_CANCELLABLE", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue(row({ scheduledAt: new Date("2026-10-19T07:59:00.000Z") }));
    await expectError(await cancel(), 409, "APPOINTMENT_NOT_CANCELLABLE");
  });

  it("completed concurrently between read and write -> 409", async () => {
    mocks.db.appointment.findFirst
      .mockResolvedValueOnce(row())
      .mockResolvedValueOnce(row({ status: "completed" }));
    mocks.db.appointment.updateMany.mockResolvedValue({ count: 0 });
    await expectError(await cancel(), 409, "APPOINTMENT_NOT_CANCELLABLE");
  });

  it("cancelled concurrently by another request -> 200 (same outcome)", async () => {
    mocks.db.appointment.findFirst
      .mockResolvedValueOnce(row())
      .mockResolvedValueOnce(row({ status: "cancelled" }));
    mocks.db.appointment.updateMany.mockResolvedValue({ count: 0 });
    expect((await cancel()).status).toBe(200);
  });

  it("another patient's appointment -> 404, nothing written", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue(null);
    await expectError(await cancel(OTHER_ID), 404, "APPOINTMENT_NOT_FOUND");
    expect(mocks.db.appointment.findFirst.mock.calls[0][0].where).toEqual({ id: OTHER_ID, patientId: USER_A.id });
    expect(mocks.db.appointment.updateMany).not.toHaveBeenCalled();
  });

  it("an empty JSON object body is accepted", async () => {
    mocks.db.appointment.findFirst.mockResolvedValue(row({ status: "cancelled" }));
    expect((await cancel(APPT_ID, {})).status).toBe(200);
  });

  it.each([
    ["status: completed", { status: "completed" }],
    ["status: cancelled", { status: "cancelled" }],
    ["any field", { reason: "x" }],
  ])("a body with %s -> 400, nothing read or written", async (_name, body) => {
    await expectError(await cancel(APPT_ID, body), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("malformed body -> 400 INVALID_JSON", async () => {
    await expectError(await cancel(APPT_ID, undefined, "{"), 400, "INVALID_JSON");
  });

  it("invalid id -> 400", async () => {
    await expectError(await cancel("not-a-uuid"), 400, "VALIDATION_FAILED");
  });
});

/* ----------------------- Concurrency (MOCKED, in-memory) ------------------- */

describe("double booking under concurrency (MOCKED: in-memory lock, NOT PostgreSQL)", () => {
  it("two simultaneous requests for the same slot: exactly one 201, one 409", async () => {
    // A per-key async mutex stands in for pg_advisory_xact_lock, held until the
    // "transaction" callback finishes. This shows the route checks the slot only
    // after taking the lock; the real PostgreSQL behaviour is covered by the opt-in
    // integration test.
    const held = new Map<string, Promise<void>>();
    const booked: Array<{ practitionerId: string; patientId: string; scheduledAt: Date }> = [];

    mocks.db.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const releases: Array<() => void> = [];
      const tx = {
        ...mocks.db,
        $executeRaw: async (_sql: TemplateStringsArray, key: string) => {
          while (held.has(key)) await held.get(key);
          let release!: () => void;
          held.set(key, new Promise<void>((resolve) => (release = resolve)));
          releases.push(() => {
            held.delete(key);
            release();
          });
          return 1;
        },
        appointment: {
          ...mocks.db.appointment,
          findFirst: async ({ where }: { where: { scheduledAt: Date; OR: Array<Record<string, string>> } }) => {
            // Read first, then delay before answering: widens the check-then-insert race
            // window so an unlocked implementation would double book.
            const clash =
              booked.find(
                (b) =>
                  b.scheduledAt.getTime() === where.scheduledAt.getTime() &&
                  (b.practitionerId === where.OR[0].practitionerId || b.patientId === where.OR[1].patientId)
              ) ?? null;
            await new Promise((r) => setTimeout(r, 10));
            return clash;
          },
          create: async ({ data }: { data: (typeof booked)[number] }) => {
            booked.push(data);
            return row();
          },
        },
      };
      try {
        return await fn(tx);
      } finally {
        releases.forEach((r) => r());
      }
    });
    mocks.db.practitioner.findUnique.mockResolvedValue(PRACTITIONER);
    mocks.getUser
      .mockResolvedValueOnce({ data: { user: USER_A }, error: null })
      .mockResolvedValueOnce({ data: { user: USER_B }, error: null });

    const [a, b] = await Promise.all([
      createAppointment(post("/api/appointments", validCreate())),
      createAppointment(post("/api/appointments", validCreate())),
    ]);

    expect([a.status, b.status].sort()).toEqual([201, 409]);
    expect(booked).toHaveLength(1);
  });
});
