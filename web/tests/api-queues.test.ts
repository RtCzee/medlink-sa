// MOCKED unit tests for the queue endpoints. Supabase Auth and Prisma are mocked (no
// network, no database). They prove the routes scope queries to the session patient,
// take the queue locks in order and apply the status rules. They do NOT prove
// PostgreSQL concurrency: see queues-locking.integration.test.ts (opt-in, live).
import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { USER_A, USER_B, apiRequest, readJson, signedInAs, signedOut, type ErrorBody } from "./helpers";

const mocks = vi.hoisted(() => {
  const db = {
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
    facility: { findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    queueTicket: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      upsert: vi.fn(),
    },
    profile: { findUnique: vi.fn() },
  };
  return { getUser: vi.fn(), db };
});

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import * as ticketDetailRoute from "@/app/api/queue-tickets/[id]/route";
import * as leaveRoute from "@/app/api/queue-tickets/[id]/leave/route";
import * as ticketListRoute from "@/app/api/queue-tickets/route";
import * as joinRoute from "@/app/api/queues/[id]/join/route";
import * as queueListRoute from "@/app/api/queues/route";
import { FACILITY_ORDER_BY } from "@/lib/api/directory";
import { QUEUE_FACILITY_SELECT, TICKET_ORDER_BY, TICKET_SELECT } from "@/lib/api/queues";
import { resetRateLimits } from "@/lib/api/rate-limit";

const { GET: listQueues } = queueListRoute;
const { POST: joinQueue } = joinRoute;
const { GET: listTickets } = ticketListRoute;
const { GET: getTicket } = ticketDetailRoute;
const { POST: leaveQueue } = leaveRoute;

// 2026-10-19 22:30 UTC == 2026-10-20 00:30 SAST: the service date is already the 20th.
const NOW = new Date("2026-10-19T22:30:00.000Z");
const TODAY = "2026-10-20";
const TODAY_DATE = new Date(`${TODAY}T00:00:00.000Z`);
const FACILITY_ID = "3f2b8c1e-7d4a-4e5b-9c6d-1a2b3c4d5e6f";
const TICKET_ID = "e1e1e1e1-f2f2-4a3a-8b4b-c5c5c5c5c5c5";
const OTHER_ID = "f6f6f6f6-a7a7-4b8b-9c9c-d0d0d0d0d0d0";
const ISSUED = new Date("2026-10-19T22:20:00.000Z");

function ticketRow(overrides: Record<string, unknown> = {}) {
  return {
    id: TICKET_ID,
    facilityId: FACILITY_ID,
    serviceDate: TODAY_DATE,
    ticketNumber: 42,
    status: "waiting",
    issuedAt: ISSUED,
    createdAt: ISSUED,
    updatedAt: ISSUED,
    facility: { name: "Rosebank Clinic" },
    ...overrides,
  };
}

const ticketDto = (overrides: Record<string, unknown> = {}) => ({
  id: TICKET_ID,
  facilityId: FACILITY_ID,
  facilityName: "Rosebank Clinic",
  serviceDate: TODAY,
  ticketNumber: 42,
  status: "waiting",
  waitingAhead: 3,
  issuedAt: ISSUED.toISOString(),
  createdAt: ISSUED.toISOString(),
  updatedAt: ISSUED.toISOString(),
  ...overrides,
});

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (path: string) => apiRequest(path);
const post = (path: string, init: { body?: unknown; rawBody?: string; headers?: Record<string, string> } = {}) =>
  apiRequest(path, { method: "POST", ...init });
const join = (id = FACILITY_ID, init = {}) => joinQueue(post(`/api/queues/${id}/join`, init), ctx(id));
const leave = (id = TICKET_ID, init = {}) => leaveQueue(post(`/api/queue-tickets/${id}/leave`, init), ctx(id));

function writesTouched(): boolean {
  const q = mocks.db.queueTicket;
  return [q.create, q.update, q.updateMany, q.delete, q.deleteMany, q.upsert].some((fn) => fn.mock.calls.length > 0);
}
function dbTouched(): boolean {
  return (
    mocks.db.$transaction.mock.calls.length > 0 ||
    mocks.db.profile.findUnique.mock.calls.length > 0 ||
    Object.values(mocks.db.queueTicket).some((fn) => fn.mock.calls.length > 0) ||
    Object.values(mocks.db.facility).some((fn) => fn.mock.calls.length > 0)
  );
}
const lockKeys = () => mocks.db.$executeRaw.mock.calls.map((call) => call.slice(1).join("|"));

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
    typeof arg === "function" ? (arg as (tx: unknown) => unknown)(mocks.db) : Promise.all(arg as Promise<unknown>[])
  );
  mocks.db.$executeRaw.mockResolvedValue(1);
  mocks.db.profile.findUnique.mockResolvedValue({ role: "patient" });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("queues: authentication and surface (MOCKED)", () => {
  it.each<[string, () => Promise<Response>]>([
    ["GET /api/queues", () => listQueues(get("/api/queues"))],
    ["POST join", () => join()],
    ["GET /api/queue-tickets", () => listTickets(get("/api/queue-tickets"))],
    ["GET ticket", () => getTicket(get(`/api/queue-tickets/${TICKET_ID}`), ctx(TICKET_ID))],
    ["POST leave", () => leave()],
  ])("%s without a session -> 401, no DB access", async (_name, call) => {
    signedOut(mocks.getUser);
    await expectError(await call(), 401, "UNAUTHENTICATED");
    expect(dbTouched()).toBe(false);
  });

  it("exposes only the documented handlers (no staff call/serve/reorder, no PATCH/DELETE)", () => {
    const methods = (mod: object) => Object.keys(mod).filter((k) => /^[A-Z]+$/.test(k)).sort();
    expect(methods(queueListRoute)).toEqual(["GET"]);
    expect(methods(joinRoute)).toEqual(["POST"]);
    expect(methods(ticketListRoute)).toEqual(["GET"]);
    expect(methods(ticketDetailRoute)).toEqual(["GET"]);
    expect(methods(leaveRoute)).toEqual(["POST"]);
  });
});

describe("GET /api/queues (MOCKED)", () => {
  it("lists facilities with today's South African service date; no patient data or counts", async () => {
    mocks.db.facility.findMany.mockResolvedValue([
      { id: FACILITY_ID, name: "Rosebank Clinic", type: "clinic", province: "Gauteng", city: "Johannesburg", phone: "x" },
    ]);
    mocks.db.facility.count.mockResolvedValue(1);

    const res = await listQueues(get("/api/queues?type=clinic&page=1&pageSize=10"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({
      data: [{ id: FACILITY_ID, name: "Rosebank Clinic", type: "clinic", province: "Gauteng", city: "Johannesburg", serviceDate: TODAY }],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    expect(mocks.db.facility.findMany).toHaveBeenCalledWith({
      where: { type: "clinic" },
      select: QUEUE_FACILITY_SELECT,
      orderBy: FACILITY_ORDER_BY,
      skip: 0,
      take: 10,
    });
    expect(mocks.db.queueTicket.findMany).not.toHaveBeenCalled();
    expect(mocks.db.queueTicket.count).not.toHaveBeenCalled();
  });

  it.each(["page=0", "pageSize=101", "type=spa", "patientId=x", "q=a", "type=clinic&type=hospital"])(
    "rejects ?%s with 400",
    async (qs) => {
      await expectError(await listQueues(get(`/api/queues?${qs}`)), 400, "VALIDATION_FAILED");
      expect(mocks.db.facility.findMany).not.toHaveBeenCalled();
    }
  );

  it("DB failure -> 500 generic", async () => {
    mocks.db.$transaction.mockRejectedValue(new Error("select from facilities password=hunter2"));
    const body = await expectError(await listQueues(get("/api/queues")), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|facilities/);
  });
});

describe("POST /api/queues/{id}/join (MOCKED)", () => {
  beforeEach(() => {
    mocks.db.facility.findUnique.mockResolvedValue({ id: FACILITY_ID });
    mocks.db.queueTicket.findFirst.mockResolvedValue(null);
    mocks.db.queueTicket.aggregate.mockResolvedValue({ _max: { ticketNumber: 41 } });
    mocks.db.queueTicket.create.mockResolvedValue(ticketRow());
    mocks.db.queueTicket.count.mockResolvedValue(3);
  });

  it("issues the next ticket for today to the session patient (201)", async () => {
    const res = await join();

    expect(res.status).toBe(201);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({ data: ticketDto() });
    expect(mocks.db.queueTicket.create).toHaveBeenCalledWith({
      data: { patientId: USER_A.id, facilityId: FACILITY_ID, serviceDate: TODAY_DATE, ticketNumber: 42 },
      select: TICKET_SELECT,
    });
    expect(mocks.db.queueTicket.aggregate).toHaveBeenCalledWith({
      where: { facilityId: FACILITY_ID, serviceDate: TODAY_DATE },
      _max: { ticketNumber: true },
    });
    expect(mocks.db.queueTicket.count).toHaveBeenCalledWith({
      where: { facilityId: FACILITY_ID, serviceDate: TODAY_DATE, status: "waiting", ticketNumber: { lt: 42 } },
    });
  });

  it("the first ticket of the day is number 1", async () => {
    mocks.db.queueTicket.aggregate.mockResolvedValue({ _max: { ticketNumber: null } });
    await join();
    expect(mocks.db.queueTicket.create.mock.calls[0][0].data.ticketNumber).toBe(1);
  });

  it("takes the queue lock (facility + day) then the patient lock, before any read", async () => {
    const order: string[] = [];
    mocks.db.$executeRaw.mockImplementation(async (...args: unknown[]) => {
      order.push(`lock:${args.slice(1).join("|")}`);
      return 1;
    });
    mocks.db.facility.findUnique.mockImplementation(async () => {
      order.push("read:facility");
      return { id: FACILITY_ID };
    });
    await join();
    expect(order).toEqual([
      `lock:queues:facility:${FACILITY_ID}:${TODAY}`,
      `lock:queues:patient:${USER_A.id}`,
      "read:facility",
    ]);
  });

  it("identity comes from the session: user B's join is for B", async () => {
    signedInAs(mocks.getUser, USER_B);
    await join();
    expect(mocks.db.queueTicket.create.mock.calls[0][0].data.patientId).toBe(USER_B.id);
    expect(lockKeys()).toContain(`queues:patient:${USER_B.id}`);
  });

  it("an active ticket today (any facility) -> 409 QUEUE_TICKET_ACTIVE, nothing written", async () => {
    mocks.db.queueTicket.findFirst.mockResolvedValue({ id: OTHER_ID });
    await expectError(await join(), 409, "QUEUE_TICKET_ACTIVE");
    expect(mocks.db.queueTicket.findFirst).toHaveBeenCalledWith({
      where: { patientId: USER_A.id, serviceDate: TODAY_DATE, status: { in: ["waiting", "called"] } },
      select: { id: true },
    });
    expect(writesTouched()).toBe(false);
  });

  it("unknown facility -> 404 FACILITY_NOT_FOUND", async () => {
    mocks.db.facility.findUnique.mockResolvedValue(null);
    await expectError(await join(), 404, "FACILITY_NOT_FOUND");
    expect(writesTouched()).toBe(false);
  });

  it.each(["doctor", "pharmacy", "hospital", "admin"])("role %s -> 403, nothing written", async (role) => {
    mocks.db.profile.findUnique.mockResolvedValue({ role });
    await expectError(await join(), 403, "FORBIDDEN");
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it("missing profile -> 404 PROFILE_NOT_FOUND", async () => {
    mocks.db.profile.findUnique.mockResolvedValue(null);
    await expectError(await join(), 404, "PROFILE_NOT_FOUND");
    expect(writesTouched()).toBe(false);
  });

  it("an empty body or {} is accepted", async () => {
    expect((await join(FACILITY_ID, { body: {} })).status).toBe(201);
  });

  it.each([
    ["patientId", USER_B.id],
    ["status", "called"],
    ["ticketNumber", 1],
    ["position", 1],
    ["serviceDate", TODAY],
    ["issuedAt", NOW.toISOString()],
    ["createdAt", NOW.toISOString()],
    ["facilityId", FACILITY_ID],
    ["estimatedWaitMin", 0],
    ["priority", "high"],
  ])("rejects the client-supplied field %s (400, no DB access)", async (field, value) => {
    const body = await expectError(await join(FACILITY_ID, { body: { [field]: value } }), 400, "VALIDATION_FAILED");
    expect(body.error.details?.[0]).toMatchObject({ code: "unrecognized_keys", keys: [field] });
    expect(dbTouched()).toBe(false);
  });

  it("invalid facility id, query parameters, bad JSON and wrong content type are rejected", async () => {
    await expectError(await join("abc"), 400, "VALIDATION_FAILED");
    await expectError(
      await joinQueue(post(`/api/queues/${FACILITY_ID}/join?patientId=${USER_B.id}`), ctx(FACILITY_ID)),
      400,
      "VALIDATION_FAILED"
    );
    await expectError(
      await join(FACILITY_ID, { rawBody: "{", headers: { "content-type": "application/json" } }),
      400,
      "INVALID_JSON"
    );
    await expectError(await join(FACILITY_ID, { rawBody: "x", headers: { "content-type": "text/plain" } }), 415, "UNSUPPORTED_MEDIA_TYPE");
    expect(dbTouched()).toBe(false);
  });

  it("cookie-authenticated join from another origin -> 403", async () => {
    await expectError(await join(FACILITY_ID, { headers: { origin: "https://evil.example" } }), 403, "FORBIDDEN");
    expect(dbTouched()).toBe(false);
  });

  it("is rate-limited per patient (21st write in a minute -> 429)", async () => {
    for (let i = 0; i < 20; i++) await join();
    await expectError(await join(), 429, "RATE_LIMITED");
  });

  it("a numbering collision (unique index) -> 409 CONFLICT, generic", async () => {
    mocks.db.queueTicket.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("queue_tickets_facility_id_service_date_ticket_number_key", {
        code: "P2002",
        clientVersion: "6.19.3",
      })
    );
    const body = await expectError(await join(), 409, "CONFLICT");
    expect(JSON.stringify(body)).not.toContain("queue_tickets");
  });

  it("lock wait timeout -> 503 retryable", async () => {
    mocks.db.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("timeout", { code: "P2028", clientVersion: "6.19.3" })
    );
    await expectError(await join(), 503, "SERVICE_UNAVAILABLE");
  });

  it("FK failure (profile gone) -> 404 PROFILE_NOT_FOUND; other errors -> 500 generic", async () => {
    mocks.db.queueTicket.create.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("fk", { code: "P2003", clientVersion: "6.19.3" })
    );
    await expectError(await join(), 404, "PROFILE_NOT_FOUND");
    mocks.db.queueTicket.create.mockRejectedValueOnce(new Error("insert into queue_tickets password=hunter2"));
    const body = await expectError(await join(), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|queue_tickets/);
  });
});

describe("GET /api/queue-tickets (MOCKED)", () => {
  it("lists only the caller's tickets, newest first; waitingAhead only for today's waiting ticket", async () => {
    mocks.db.queueTicket.findMany.mockResolvedValue([
      ticketRow(),
      ticketRow({ id: OTHER_ID, serviceDate: new Date("2026-10-18T00:00:00.000Z"), status: "served", ticketNumber: 7 }),
    ]);
    mocks.db.queueTicket.count.mockResolvedValueOnce(2).mockResolvedValueOnce(3);

    const res = await listTickets(get("/api/queue-tickets?pageSize=2"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await readJson<{ data: Record<string, unknown>[]; meta: unknown }>(res);
    expect(body.data).toEqual([
      ticketDto(),
      ticketDto({ id: OTHER_ID, serviceDate: "2026-10-18", status: "served", ticketNumber: 7, waitingAhead: null }),
    ]);
    expect(body.meta).toEqual({ page: 1, pageSize: 2, total: 2, totalPages: 1 });
    expect(mocks.db.queueTicket.findMany).toHaveBeenCalledWith({
      where: { patientId: USER_A.id },
      select: TICKET_SELECT,
      orderBy: TICKET_ORDER_BY,
      skip: 0,
      take: 2,
    });
    expect(TICKET_ORDER_BY).toEqual([{ serviceDate: "desc" }, { issuedAt: "desc" }, { id: "desc" }]);
    expect(body.data[0]).not.toHaveProperty("patientId");
    expect(body.data[0]).not.toHaveProperty("estimatedWaitMin");
  });

  it("filters by status and paginates; user B is scoped to B", async () => {
    signedInAs(mocks.getUser, USER_B);
    mocks.db.queueTicket.findMany.mockResolvedValue([]);
    mocks.db.queueTicket.count.mockResolvedValue(45);
    const res = await listTickets(get("/api/queue-tickets?status=cancelled&page=3"));
    const args = mocks.db.queueTicket.findMany.mock.calls[0][0];
    expect(args.where).toEqual({ patientId: USER_B.id, status: "cancelled" });
    expect([args.skip, args.take]).toEqual([40, 20]);
    expect((await readJson<{ meta: unknown }>(res)).meta).toEqual({ page: 3, pageSize: 20, total: 45, totalPages: 3 });
  });

  it.each([`patientId=${USER_B.id}`, "status=done", "page=0", "pageSize=101", "x=1", "status=waiting&status=called"])(
    "rejects ?%s with 400",
    async (qs) => {
      await expectError(await listTickets(get(`/api/queue-tickets?${qs}`)), 400, "VALIDATION_FAILED");
      expect(mocks.db.queueTicket.findMany).not.toHaveBeenCalled();
    }
  );

  it("DB failure -> 500 generic", async () => {
    mocks.db.$transaction.mockRejectedValue(new Error("boom password=hunter2"));
    const body = await expectError(await listTickets(get("/api/queue-tickets")), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("hunter2");
  });
});

describe("GET /api/queue-tickets/{id} (MOCKED)", () => {
  it("returns the caller's ticket, filtered by id AND patientId", async () => {
    mocks.db.queueTicket.findFirst.mockResolvedValue(ticketRow());
    mocks.db.queueTicket.count.mockResolvedValue(3);
    const res = await getTicket(get(`/api/queue-tickets/${TICKET_ID}`), ctx(TICKET_ID));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({ data: ticketDto() });
    expect(mocks.db.queueTicket.findFirst).toHaveBeenCalledWith({
      where: { id: TICKET_ID, patientId: USER_A.id },
      select: TICKET_SELECT,
    });
  });

  it("another patient's ticket and a missing one give the same 404", async () => {
    mocks.db.queueTicket.findFirst.mockResolvedValue(null);
    const foreign = await expectError(await getTicket(get(`/api/queue-tickets/${OTHER_ID}`), ctx(OTHER_ID)), 404, "QUEUE_TICKET_NOT_FOUND");
    const missing = await expectError(await getTicket(get(`/api/queue-tickets/${TICKET_ID}`), ctx(TICKET_ID)), 404, "QUEUE_TICKET_NOT_FOUND");
    expect(foreign.error).toEqual(missing.error);
    expect(mocks.db.queueTicket.findFirst.mock.calls[0][0].where).toEqual({ id: OTHER_ID, patientId: USER_A.id });
  });

  it("invalid id or any query parameter -> 400", async () => {
    await expectError(await getTicket(get("/api/queue-tickets/abc"), ctx("abc")), 400, "VALIDATION_FAILED");
    await expectError(
      await getTicket(get(`/api/queue-tickets/${TICKET_ID}?patientId=${USER_B.id}`), ctx(TICKET_ID)),
      400,
      "VALIDATION_FAILED"
    );
    expect(mocks.db.queueTicket.findFirst).not.toHaveBeenCalled();
  });
});

describe("POST /api/queue-tickets/{id}/leave (MOCKED)", () => {
  it.each(["waiting", "called"])("leaves a %s ticket for today -> cancelled (guarded update)", async (status) => {
    mocks.db.queueTicket.findFirst
      .mockResolvedValueOnce(ticketRow({ status }))
      .mockResolvedValueOnce(ticketRow({ status: "cancelled" }));
    mocks.db.queueTicket.updateMany.mockResolvedValue({ count: 1 });

    const res = await leave();

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({ data: ticketDto({ status: "cancelled", waitingAhead: null }) });
    expect(mocks.db.queueTicket.updateMany).toHaveBeenCalledWith({
      where: { id: TICKET_ID, patientId: USER_A.id, serviceDate: TODAY_DATE, status: { in: ["waiting", "called"] } },
      data: { status: "cancelled" },
    });
    expect(lockKeys()).toEqual([`queues:patient:${USER_A.id}`]);
  });

  it("an already-cancelled ticket -> 200 unchanged, nothing written (repeat leave)", async () => {
    mocks.db.queueTicket.findFirst.mockResolvedValue(ticketRow({ status: "cancelled" }));
    const res = await leave();
    expect(res.status).toBe(200);
    expect((await readJson<{ data: { status: string } }>(res)).data.status).toBe("cancelled");
    expect(writesTouched()).toBe(false);
  });

  it("a concurrent double leave: the second update changes nothing and still returns cancelled", async () => {
    mocks.db.queueTicket.findFirst
      .mockResolvedValueOnce(ticketRow())
      .mockResolvedValueOnce(ticketRow({ status: "cancelled" }));
    mocks.db.queueTicket.updateMany.mockResolvedValue({ count: 0 });
    const res = await leave();
    expect(res.status).toBe(200);
    expect((await readJson<{ data: { status: string } }>(res)).data.status).toBe("cancelled");
  });

  it("served concurrently between read and write -> 409", async () => {
    mocks.db.queueTicket.findFirst
      .mockResolvedValueOnce(ticketRow())
      .mockResolvedValueOnce(ticketRow({ status: "served" }));
    mocks.db.queueTicket.updateMany.mockResolvedValue({ count: 0 });
    await expectError(await leave(), 409, "QUEUE_TICKET_NOT_LEAVABLE");
  });

  it("a served ticket -> 409 QUEUE_TICKET_NOT_LEAVABLE", async () => {
    mocks.db.queueTicket.findFirst.mockResolvedValue(ticketRow({ status: "served" }));
    await expectError(await leave(), 409, "QUEUE_TICKET_NOT_LEAVABLE");
    expect(writesTouched()).toBe(false);
  });

  it("an earlier day's ticket -> 409 QUEUE_TICKET_NOT_LEAVABLE", async () => {
    mocks.db.queueTicket.findFirst.mockResolvedValue(ticketRow({ serviceDate: new Date("2026-10-19T00:00:00.000Z") }));
    await expectError(await leave(), 409, "QUEUE_TICKET_NOT_LEAVABLE");
    expect(writesTouched()).toBe(false);
  });

  it("another patient's ticket -> 404, nothing written", async () => {
    mocks.db.queueTicket.findFirst.mockResolvedValue(null);
    await expectError(await leave(OTHER_ID), 404, "QUEUE_TICKET_NOT_FOUND");
    expect(mocks.db.queueTicket.findFirst.mock.calls[0][0].where).toEqual({ id: OTHER_ID, patientId: USER_A.id });
    expect(writesTouched()).toBe(false);
  });

  it.each([
    ["status", "served"],
    ["ticketNumber", 1],
    ["position", 0],
    ["patientId", USER_B.id],
  ])("rejects body field %s (400, no DB access)", async (field, value) => {
    await expectError(await leave(TICKET_ID, { body: { [field]: value } }), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("invalid id, query parameters and cross-origin are rejected", async () => {
    await expectError(await leave("abc"), 400, "VALIDATION_FAILED");
    await expectError(await leaveQueue(post(`/api/queue-tickets/${TICKET_ID}/leave?x=1`), ctx(TICKET_ID)), 400, "VALIDATION_FAILED");
    await expectError(await leave(TICKET_ID, { headers: { origin: "https://evil.example" } }), 403, "FORBIDDEN");
    expect(dbTouched()).toBe(false);
  });

  it("DB failure -> 500 generic", async () => {
    mocks.db.queueTicket.findFirst.mockRejectedValue(new Error("update queue_tickets password=hunter2"));
    const body = await expectError(await leave(), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|queue_tickets/);
  });
});
