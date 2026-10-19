// MOCKED unit tests for the medical-record endpoints. Supabase Auth and Prisma are
// mocked: nothing touches the network or a database. These prove the routes scope
// every query to the session patient in code; they do NOT prove live database
// isolation (no live test exists for these routes yet).
import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { USER_A, USER_B, apiRequest, readJson, signedInAs, signedOut, type ErrorBody } from "./helpers";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  db: {
    $transaction: vi.fn(),
    medicalRecord: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    profile: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import * as detailRoute from "@/app/api/medical-records/[id]/route";
import * as listRoute from "@/app/api/medical-records/route";
import { MEDICAL_RECORD_ORDER_BY, MEDICAL_RECORD_SELECT, todayInJohannesburg } from "@/lib/api/medical-records";
import { resetRateLimits } from "@/lib/api/rate-limit";

const { GET: listRecords, POST: createRecord } = listRoute;
const { GET: getRecord } = detailRoute;

// 2026-10-19 22:30 UTC == 2026-10-20 00:30 SAST: the South African date is already the 20th.
const NOW = new Date("2026-10-19T22:30:00.000Z");
const RECORD_ID = "c3c3c3c3-d4d4-4e5e-8f6f-a7a7a7a7a7a7";
const OTHER_ID = "d9d9d9d9-e8e8-4f7f-9a6a-b5b5b5b5b5b5";
const CREATED = new Date("2026-10-19T10:00:00.000Z");

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: RECORD_ID,
    title: "Blood test",
    category: "Lab result",
    provider: "Lancet Laboratories",
    recordedOn: new Date("2026-10-15T00:00:00.000Z"),
    notes: "Cholesterol slightly high",
    createdAt: CREATED,
    updatedAt: CREATED,
    ...overrides,
  };
}

const DTO = {
  id: RECORD_ID,
  title: "Blood test",
  category: "Lab result",
  provider: "Lancet Laboratories",
  recordedOn: "2026-10-15",
  notes: "Cholesterol slightly high",
  createdAt: CREATED.toISOString(),
  updatedAt: CREATED.toISOString(),
};

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (path: string, headers?: Record<string, string>) => apiRequest(path, { headers });
const post = (body: unknown, headers?: Record<string, string>) =>
  apiRequest("/api/medical-records", { method: "POST", body, headers });
const validCreate = (overrides: Record<string, unknown> = {}) => ({
  title: "Blood test",
  category: "Lab result",
  provider: "Lancet Laboratories",
  recordedOn: "2026-10-15",
  notes: "Cholesterol slightly high",
  ...overrides,
});

function dbTouched(): boolean {
  return (
    mocks.db.$transaction.mock.calls.length > 0 ||
    mocks.db.profile.findUnique.mock.calls.length > 0 ||
    Object.values(mocks.db.medicalRecord).some((fn) => fn.mock.calls.length > 0)
  );
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
  mocks.db.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  mocks.db.profile.findUnique.mockResolvedValue({ role: "patient" });
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("medical records: authentication (MOCKED)", () => {
  it.each<[string, () => Promise<Response>]>([
    ["GET list", () => listRecords(get("/api/medical-records"))],
    ["GET detail", () => getRecord(get(`/api/medical-records/${RECORD_ID}`), ctx(RECORD_ID))],
    ["POST", () => createRecord(post(validCreate()))],
  ])("%s without a session -> 401, no DB access", async (_name, call) => {
    signedOut(mocks.getUser);
    await expectError(await call(), 401, "UNAUTHENTICATED");
    expect(dbTouched()).toBe(false);
  });

  it("a malformed Authorization header -> 401 without calling Supabase", async () => {
    await expectError(
      await listRecords(get("/api/medical-records", { authorization: "Basic abc" })),
      401,
      "UNAUTHENTICATED"
    );
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("only GET (list, detail) and POST exist: no update or delete handlers", () => {
    expect(Object.keys(listRoute).filter((k) => /^[A-Z]+$/.test(k)).sort()).toEqual(["GET", "POST"]);
    expect(Object.keys(detailRoute).filter((k) => /^[A-Z]+$/.test(k))).toEqual(["GET"]);
  });
});

describe("GET /api/medical-records (MOCKED)", () => {
  it("lists only the caller's records, newest first, with a deterministic tiebreak", async () => {
    mocks.db.medicalRecord.findMany.mockResolvedValue([row()]);
    mocks.db.medicalRecord.count.mockResolvedValue(1);

    const res = await listRecords(get("/api/medical-records"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({
      data: [DTO],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    expect(mocks.db.medicalRecord.findMany).toHaveBeenCalledWith({
      where: { patientId: USER_A.id },
      select: MEDICAL_RECORD_SELECT,
      orderBy: MEDICAL_RECORD_ORDER_BY,
      skip: 0,
      take: 20,
    });
    expect(MEDICAL_RECORD_ORDER_BY).toEqual([{ recordedOn: "desc" }, { createdAt: "desc" }, { id: "desc" }]);
    expect(mocks.db.medicalRecord.count).toHaveBeenCalledWith({ where: { patientId: USER_A.id } });
  });

  it("user B's list is scoped to B (A cannot see B's records and vice versa)", async () => {
    signedInAs(mocks.getUser, USER_B);
    mocks.db.medicalRecord.findMany.mockResolvedValue([]);
    mocks.db.medicalRecord.count.mockResolvedValue(0);

    await listRecords(get("/api/medical-records"));

    expect(mocks.db.medicalRecord.findMany.mock.calls[0][0].where).toEqual({ patientId: USER_B.id });
  });

  it("maps category (case-insensitive) and inclusive from/to dates; paginates", async () => {
    mocks.db.medicalRecord.findMany.mockResolvedValue([]);
    mocks.db.medicalRecord.count.mockResolvedValue(41);

    const res = await listRecords(
      get("/api/medical-records?category=lab%20result&from=2026-01-01&to=2026-06-30&page=2&pageSize=20")
    );

    expect(res.status).toBe(200);
    const args = mocks.db.medicalRecord.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      patientId: USER_A.id,
      category: { equals: "lab result", mode: "insensitive" },
      recordedOn: {
        gte: new Date("2026-01-01T00:00:00.000Z"),
        lte: new Date("2026-06-30T00:00:00.000Z"),
      },
    });
    expect([args.skip, args.take]).toEqual([20, 20]);
    expect((await readJson<{ meta: unknown }>(res)).meta).toEqual({
      page: 2,
      pageSize: 20,
      total: 41,
      totalPages: 3,
    });
  });

  it("from == to is allowed (a single day)", async () => {
    mocks.db.medicalRecord.findMany.mockResolvedValue([]);
    mocks.db.medicalRecord.count.mockResolvedValue(0);
    expect((await listRecords(get("/api/medical-records?from=2026-10-15&to=2026-10-15"))).status).toBe(200);
  });

  it.each([
    `patientId=${USER_B.id}`,
    `userId=${USER_B.id}`,
    "unknown=1",
    "page=0",
    "page=-1",
    "page=abc",
    "page=1.5",
    "pageSize=101",
    "category=",
    `category=${"x".repeat(81)}`,
    "from=2026-02-30",
    "from=2026-10-19T00:00:00Z",
    "from=19-10-2026",
    "from=1899-12-31",
    "from=2026-06-30&to=2026-01-01",
    "category=a&category=b",
  ])("rejects ?%s with 400 and no DB call", async (qs) => {
    const body = await expectError(await listRecords(get(`/api/medical-records?${qs}`)), 400, "VALIDATION_FAILED");
    expect(body.error.message).toBe("The query string is invalid.");
    expect(mocks.db.medicalRecord.findMany).not.toHaveBeenCalled();
  });

  it("never returns patientId or other fields, even if the DB returned them", async () => {
    mocks.db.medicalRecord.findMany.mockResolvedValue([row({ patientId: USER_B.id, internalFlag: true })]);
    mocks.db.medicalRecord.count.mockResolvedValue(1);

    const body = await readJson<{ data: Record<string, unknown>[] }>(await listRecords(get("/api/medical-records")));

    expect(body.data[0]).toEqual(DTO);
    expect(body.data[0]).not.toHaveProperty("patientId");
    expect(Object.keys(MEDICAL_RECORD_SELECT)).not.toContain("patientId");
    expect(Object.keys(MEDICAL_RECORD_SELECT)).not.toContain("patient");
  });

  it("DB failure -> 500 generic, no internals", async () => {
    mocks.db.$transaction.mockRejectedValue(new Error('relation "medical_records" password=hunter2'));
    const body = await expectError(await listRecords(get("/api/medical-records")), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|medical_records/);
  });

  it("database unreachable -> 503", async () => {
    mocks.db.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("can't reach", { code: "P1001", clientVersion: "6.19.3" })
    );
    await expectError(await listRecords(get("/api/medical-records")), 503, "SERVICE_UNAVAILABLE");
  });
});

describe("GET /api/medical-records/{id} (MOCKED)", () => {
  it("returns the caller's record, filtered by id AND patientId", async () => {
    mocks.db.medicalRecord.findFirst.mockResolvedValue(row());

    const res = await getRecord(get(`/api/medical-records/${RECORD_ID}`), ctx(RECORD_ID));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({ data: DTO });
    expect(mocks.db.medicalRecord.findFirst).toHaveBeenCalledWith({
      where: { id: RECORD_ID, patientId: USER_A.id },
      select: MEDICAL_RECORD_SELECT,
    });
  });

  it("A asking for B's record gets the same 404 as for a missing record", async () => {
    mocks.db.medicalRecord.findFirst.mockResolvedValue(null);
    const foreign = await expectError(
      await getRecord(get(`/api/medical-records/${OTHER_ID}`), ctx(OTHER_ID)),
      404,
      "MEDICAL_RECORD_NOT_FOUND"
    );
    const missing = await expectError(
      await getRecord(get(`/api/medical-records/${RECORD_ID}`), ctx(RECORD_ID)),
      404,
      "MEDICAL_RECORD_NOT_FOUND"
    );
    expect(foreign.error).toEqual(missing.error);
    expect(mocks.db.medicalRecord.findFirst.mock.calls[0][0].where).toEqual({ id: OTHER_ID, patientId: USER_A.id });
  });

  it.each([
    ["an invalid id", "/api/medical-records/abc", "abc"],
    ["a supplied patientId", `/api/medical-records/${RECORD_ID}?patientId=${USER_B.id}`, RECORD_ID],
    ["any query parameter", `/api/medical-records/${RECORD_ID}?include=patient`, RECORD_ID],
  ])("%s -> 400, no DB call", async (_name, path, id) => {
    await expectError(await getRecord(get(path), ctx(id)), 400, "VALIDATION_FAILED");
    expect(mocks.db.medicalRecord.findFirst).not.toHaveBeenCalled();
  });

  it("DB failure -> 500 generic", async () => {
    mocks.db.medicalRecord.findFirst.mockRejectedValue(new Error("select * from medical_records"));
    const body = await expectError(
      await getRecord(get(`/api/medical-records/${RECORD_ID}`), ctx(RECORD_ID)),
      500,
      "INTERNAL_ERROR"
    );
    expect(JSON.stringify(body)).not.toContain("select");
  });
});

describe("POST /api/medical-records (MOCKED)", () => {
  beforeEach(() => {
    mocks.db.medicalRecord.create.mockResolvedValue(row());
  });

  it("a patient adds their own record (201); patient and timestamps come from the server", async () => {
    const res = await createRecord(post(validCreate({ title: "  Blood test  " })));

    expect(res.status).toBe(201);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await readJson(res)).toEqual({ data: DTO });
    expect(mocks.db.profile.findUnique).toHaveBeenCalledWith({ where: { id: USER_A.id }, select: { role: true } });
    expect(mocks.db.medicalRecord.create).toHaveBeenCalledWith({
      data: {
        patientId: USER_A.id,
        title: "Blood test",
        category: "Lab result",
        provider: "Lancet Laboratories",
        recordedOn: new Date("2026-10-15T00:00:00.000Z"),
        notes: "Cholesterol slightly high",
      },
      select: MEDICAL_RECORD_SELECT,
    });
  });

  it("provider and notes are optional (stored as null)", async () => {
    await createRecord(post({ title: "X-ray", category: "Imaging", recordedOn: "2026-10-01" }));
    const { data } = mocks.db.medicalRecord.create.mock.calls[0][0];
    expect(data.provider).toBeNull();
    expect(data.notes).toBeNull();
  });

  it("'today' is the South African date (already 2026-10-20 at 00:30 SAST)", async () => {
    expect(todayInJohannesburg()).toBe("2026-10-20");
    expect((await createRecord(post(validCreate({ recordedOn: "2026-10-20" })))).status).toBe(201);
    await expectError(await createRecord(post(validCreate({ recordedOn: "2026-10-21" }))), 400, "VALIDATION_FAILED");
  });

  it.each(["doctor", "pharmacy", "hospital", "admin"])("role %s -> 403, nothing written", async (role) => {
    mocks.db.profile.findUnique.mockResolvedValue({ role });
    await expectError(await createRecord(post(validCreate())), 403, "FORBIDDEN");
    expect(mocks.db.medicalRecord.create).not.toHaveBeenCalled();
  });

  it("missing profile -> 404 PROFILE_NOT_FOUND, nothing written", async () => {
    mocks.db.profile.findUnique.mockResolvedValue(null);
    await expectError(await createRecord(post(validCreate())), 404, "PROFILE_NOT_FOUND");
    expect(mocks.db.medicalRecord.create).not.toHaveBeenCalled();
  });

  it.each([
    ["patientId", USER_B.id],
    ["userId", USER_B.id],
    ["id", RECORD_ID],
    ["createdAt", NOW.toISOString()],
    ["updatedAt", NOW.toISOString()],
    ["authorId", USER_B.id],
    ["practitionerId", RECORD_ID],
    ["facilityId", RECORD_ID],
    ["appointmentId", RECORD_ID],
    ["fileUrl", "https://storage.example/private.pdf"],
  ])("rejects the forbidden field %s (400 unrecognized_keys, no DB access)", async (field, value) => {
    const body = await expectError(await createRecord(post(validCreate({ [field]: value }))), 400, "VALIDATION_FAILED");
    expect(body.error.details?.[0]).toMatchObject({ code: "unrecognized_keys", keys: [field] });
    expect(dbTouched()).toBe(false);
  });

  it.each([
    ["missing title", { category: "Lab", recordedOn: "2026-10-01" }],
    ["missing category", { title: "X", recordedOn: "2026-10-01" }],
    ["missing recordedOn", { title: "X", category: "Lab" }],
    ["blank title", validCreate({ title: "   " })],
    ["title too long", validCreate({ title: "x".repeat(121) })],
    ["category too long", validCreate({ category: "x".repeat(81) })],
    ["provider too long", validCreate({ provider: "x".repeat(151) })],
    ["blank provider", validCreate({ provider: "" })],
    ["notes too long", validCreate({ notes: "x".repeat(2001) })],
    ["title not a string", validCreate({ title: 5 })],
    ["recordedOn impossible date", validCreate({ recordedOn: "2026-02-30" })],
    ["recordedOn with a time", validCreate({ recordedOn: "2026-10-15T00:00:00Z" })],
    ["recordedOn wrong format", validCreate({ recordedOn: "15/10/2026" })],
    ["recordedOn before 1900", validCreate({ recordedOn: "1899-12-31" })],
    ["recordedOn in the future", validCreate({ recordedOn: "2027-01-01" })],
  ])("%s -> 400, no DB access", async (_name, body) => {
    await expectError(await createRecord(post(body)), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("malformed JSON, arrays and non-JSON bodies are rejected", async () => {
    await expectError(
      await createRecord(apiRequest("/api/medical-records", { method: "POST", rawBody: "{", headers: { "content-type": "application/json" } })),
      400,
      "INVALID_JSON"
    );
    await expectError(await createRecord(post([validCreate()])), 400, "INVALID_BODY");
    await expectError(
      await createRecord(apiRequest("/api/medical-records", { method: "POST", rawBody: "x", headers: { "content-type": "text/plain" } })),
      415,
      "UNSUPPORTED_MEDIA_TYPE"
    );
    expect(dbTouched()).toBe(false);
  });

  it("cookie-authenticated write from another origin -> 403", async () => {
    await expectError(await createRecord(post(validCreate(), { origin: "https://evil.example" })), 403, "FORBIDDEN");
    expect(dbTouched()).toBe(false);
  });

  it("FK failure (profile row gone) -> 404 PROFILE_NOT_FOUND, no internals", async () => {
    mocks.db.medicalRecord.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("fk medical_records_patient_id_fkey password=hunter2", {
        code: "P2003",
        clientVersion: "6.19.3",
      })
    );
    const body = await expectError(await createRecord(post(validCreate())), 404, "PROFILE_NOT_FOUND");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|fkey/);
  });

  it("unexpected DB error -> 500 generic", async () => {
    mocks.db.medicalRecord.create.mockRejectedValue(new Error("insert into medical_records password=hunter2"));
    const body = await expectError(await createRecord(post(validCreate())), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|insert/);
  });
});
