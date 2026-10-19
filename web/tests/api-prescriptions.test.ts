// MOCKED unit tests for the prescription endpoints. Supabase Auth and Prisma are mocked
// (no network, no database). They prove the routes scope every query to the session
// patient and return only whitelisted fields; they do NOT prove RLS or live behaviour.
import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { USER_A, USER_B, apiRequest, readJson, signedInAs, signedOut, type ErrorBody } from "./helpers";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  db: {
    $transaction: vi.fn(),
    prescription: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
    prescriptionItem: { findMany: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import * as detailRoute from "@/app/api/prescriptions/[id]/route";
import * as listRoute from "@/app/api/prescriptions/route";
import {
  PRESCRIPTION_DETAIL_SELECT,
  PRESCRIPTION_ITEM_ORDER_BY,
  PRESCRIPTION_ORDER_BY,
  PRESCRIPTION_SUMMARY_SELECT,
} from "@/lib/api/prescriptions";

const { GET: listPrescriptions } = listRoute;
const { GET: getPrescription } = detailRoute;

const RX_ID = "b1b1b1b1-c2c2-4d3d-8e4e-f5f5f5f5f5f5";
const OTHER_ID = "a9a9a9a9-b8b8-4c7c-9d6d-e5e5e5e5e5e5";
const FACILITY_ID = "3f2b8c1e-7d4a-4e5b-9c6d-1a2b3c4d5e6f";
const CREATED = new Date("2026-10-19T08:00:00.000Z");

function summaryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: RX_ID,
    status: "active",
    issuedOn: new Date("2026-10-19T00:00:00.000Z"),
    expiresOn: new Date("2027-04-19T00:00:00.000Z"),
    notes: "Take with food",
    createdAt: CREATED,
    updatedAt: CREATED,
    practitioner: { fullName: "Dr Sipho Dlamini", specialty: "General practice" },
    facility: { id: FACILITY_ID, name: "Rosebank Clinic" },
    _count: { items: 1 },
    ...overrides,
  };
}

const item = {
  id: "c1c1c1c1-d2d2-4e3e-8f4f-a5a5a5a5a5a5",
  medicineName: "Metformin 850mg",
  dosage: "1 tablet twice daily",
  quantity: 60,
  instructions: null,
  refills: 2,
};

const summaryDto = (overrides: Record<string, unknown> = {}) => ({
  id: RX_ID,
  status: "active",
  issuedOn: "2026-10-19",
  expiresOn: "2027-04-19",
  notes: "Take with food",
  practitioner: { fullName: "Dr Sipho Dlamini", specialty: "General practice" },
  facility: { id: FACILITY_ID, name: "Rosebank Clinic" },
  itemCount: 1,
  createdAt: CREATED.toISOString(),
  updatedAt: CREATED.toISOString(),
  ...overrides,
});

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (path: string) => apiRequest(path);

function dbTouched() {
  return (
    mocks.db.$transaction.mock.calls.length > 0 ||
    [...Object.values(mocks.db.prescription), ...Object.values(mocks.db.prescriptionItem)].some(
      (fn) => fn.mock.calls.length > 0
    )
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

const SENSITIVE = ["patientId", "patient", "profileId", "licenseNumber", "practitionerId", "appointmentId", "email"];
function expectNoSensitiveKeys(value: unknown) {
  const json = JSON.stringify(value);
  for (const key of SENSITIVE) expect(json).not.toContain(`"${key}"`);
}

beforeEach(() => {
  vi.clearAllMocks();
  signedInAs(mocks.getUser, USER_A);
  mocks.db.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => vi.restoreAllMocks());

describe("prescriptions: authentication and surface (MOCKED)", () => {
  it.each<[string, () => Promise<Response>]>([
    ["GET list", () => listPrescriptions(get("/api/prescriptions"))],
    ["GET detail", () => getPrescription(get(`/api/prescriptions/${RX_ID}`), ctx(RX_ID))],
  ])("%s without a session -> 401, no DB access", async (_name, call) => {
    signedOut(mocks.getUser);
    await expectError(await call(), 401, "UNAUTHENTICATED");
    expect(dbTouched()).toBe(false);
  });

  it("is read-only: only GET handlers exist", () => {
    const methods = (mod: object) => Object.keys(mod).filter((k) => /^[A-Z]+$/.test(k));
    expect(methods(listRoute)).toEqual(["GET"]);
    expect(methods(detailRoute)).toEqual(["GET"]);
  });
});

describe("GET /api/prescriptions (MOCKED)", () => {
  it("lists only the caller's prescriptions, newest first, deterministic", async () => {
    mocks.db.prescription.findMany.mockResolvedValue([summaryRow()]);
    mocks.db.prescription.count.mockResolvedValue(1);

    const res = await listPrescriptions(get("/api/prescriptions"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await readJson(res);
    expect(body).toEqual({ data: [summaryDto()], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
    expect(mocks.db.prescription.findMany).toHaveBeenCalledWith({
      where: { patientId: USER_A.id },
      select: PRESCRIPTION_SUMMARY_SELECT,
      orderBy: PRESCRIPTION_ORDER_BY,
      skip: 0,
      take: 20,
    });
    expect(mocks.db.prescription.count).toHaveBeenCalledWith({ where: { patientId: USER_A.id } });
    expect(PRESCRIPTION_ORDER_BY).toEqual([{ issuedOn: "desc" }, { createdAt: "desc" }, { id: "desc" }]);
    expectNoSensitiveKeys(body);
  });

  it("user B is scoped to B", async () => {
    signedInAs(mocks.getUser, USER_B);
    mocks.db.prescription.findMany.mockResolvedValue([]);
    mocks.db.prescription.count.mockResolvedValue(0);
    await listPrescriptions(get("/api/prescriptions"));
    expect(mocks.db.prescription.findMany.mock.calls[0][0].where).toEqual({ patientId: USER_B.id });
    expect(mocks.db.prescription.count.mock.calls[0][0].where).toEqual({ patientId: USER_B.id });
  });

  it("maps status and inclusive issued_on from/to; paginates", async () => {
    mocks.db.prescription.findMany.mockResolvedValue([]);
    mocks.db.prescription.count.mockResolvedValue(41);

    const res = await listPrescriptions(get("/api/prescriptions?status=expired&from=2026-01-01&to=2026-06-30&page=2"));

    const args = mocks.db.prescription.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      patientId: USER_A.id,
      status: "expired",
      issuedOn: { gte: new Date("2026-01-01T00:00:00.000Z"), lte: new Date("2026-06-30T00:00:00.000Z") },
    });
    expect([args.skip, args.take]).toEqual([20, 20]);
    expect((await readJson<{ meta: unknown }>(res)).meta).toEqual({ page: 2, pageSize: 20, total: 41, totalPages: 3 });
  });

  it("handles nulls: no practitioner, facility, expiry or notes", async () => {
    mocks.db.prescription.findMany.mockResolvedValue([
      summaryRow({ practitioner: null, facility: null, expiresOn: null, notes: null, _count: { items: 0 } }),
    ]);
    mocks.db.prescription.count.mockResolvedValue(1);
    const body = await readJson<{ data: unknown[] }>(await listPrescriptions(get("/api/prescriptions")));
    expect(body.data[0]).toEqual(
      summaryDto({ practitioner: null, facility: null, expiresOn: null, notes: null, itemCount: 0 })
    );
  });

  it("drops fields the DB returned by mistake (patientId, licence, profileId)", async () => {
    mocks.db.prescription.findMany.mockResolvedValue([
      summaryRow({
        patientId: USER_B.id,
        appointmentId: OTHER_ID,
        practitioner: { fullName: "Dr Sipho Dlamini", specialty: "General practice", licenseNumber: "MP123", profileId: OTHER_ID },
      }),
    ]);
    mocks.db.prescription.count.mockResolvedValue(1);
    const body = await readJson<{ data: unknown[] }>(await listPrescriptions(get("/api/prescriptions")));
    expect(body.data[0]).toEqual(summaryDto());
    expectNoSensitiveKeys(body);
  });

  it("selects never include restricted columns", () => {
    for (const select of [PRESCRIPTION_SUMMARY_SELECT, PRESCRIPTION_DETAIL_SELECT]) {
      expect(Object.keys(select)).not.toEqual(expect.arrayContaining(["patientId"]));
      expect(select).not.toHaveProperty("patientId");
      expect(select).not.toHaveProperty("patient");
      expect(select).not.toHaveProperty("practitionerId");
      expect(select).not.toHaveProperty("appointmentId");
      expect(select).not.toHaveProperty("appointment");
      expect(select.practitioner.select).toEqual({ fullName: true, specialty: true });
    }
  });

  it.each([
    `patientId=${USER_B.id}`,
    "unknown=1",
    "page=0",
    "page=1001",
    "page=x",
    "pageSize=101",
    "pageSize=0",
    "status=pending",
    "from=2026-02-30",
    "from=2026-10-19T00:00:00Z",
    "to=19-10-2026",
    "from=1899-12-31",
    "from=2026-06-30&to=2026-01-01",
    "status=active&status=expired",
  ])("rejects ?%s with 400 and no DB call", async (qs) => {
    const body = await expectError(await listPrescriptions(get(`/api/prescriptions?${qs}`)), 400, "VALIDATION_FAILED");
    expect(body.error.message).toBe("The query string is invalid.");
    expect(dbTouched()).toBe(false);
  });

  it("DB failure -> 500 generic; unreachable -> 503", async () => {
    mocks.db.$transaction.mockRejectedValueOnce(new Error('relation "prescriptions" password=hunter2'));
    const body = await expectError(await listPrescriptions(get("/api/prescriptions")), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|prescriptions"/);
    mocks.db.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("can't reach", { code: "P1001", clientVersion: "6.19.3" })
    );
    await expectError(await listPrescriptions(get("/api/prescriptions")), 503, "SERVICE_UNAVAILABLE");
  });
});

describe("GET /api/prescriptions/{id} (MOCKED)", () => {
  it("returns the caller's prescription with items read through the owned parent", async () => {
    mocks.db.prescription.findFirst.mockResolvedValue({ ...summaryRow(), items: [item] });

    const res = await getPrescription(get(`/api/prescriptions/${RX_ID}`), ctx(RX_ID));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await readJson(res);
    expect(body).toEqual({ data: { ...summaryDto(), items: [item] } });
    expect(mocks.db.prescription.findFirst).toHaveBeenCalledWith({
      where: { id: RX_ID, patientId: USER_A.id },
      select: PRESCRIPTION_DETAIL_SELECT,
    });
    // Items come only from the nested select of the owned prescription, never a direct query.
    expect(PRESCRIPTION_DETAIL_SELECT.items.orderBy).toEqual(PRESCRIPTION_ITEM_ORDER_BY);
    expect(mocks.db.prescriptionItem.findMany).not.toHaveBeenCalled();
    expect(mocks.db.prescriptionItem.findFirst).not.toHaveBeenCalled();
    expectNoSensitiveKeys(body);
  });

  it("item fields are whitelisted (no prescriptionId or timestamps)", async () => {
    mocks.db.prescription.findFirst.mockResolvedValue({
      ...summaryRow(),
      items: [{ ...item, prescriptionId: RX_ID, createdAt: CREATED }],
    });
    const body = await readJson<{ data: { items: unknown[] } }>(
      await getPrescription(get(`/api/prescriptions/${RX_ID}`), ctx(RX_ID))
    );
    expect(body.data.items).toEqual([item]);
  });

  it("another patient's prescription and a missing one give the same 404", async () => {
    mocks.db.prescription.findFirst.mockResolvedValue(null);
    const foreign = await expectError(await getPrescription(get(`/api/prescriptions/${OTHER_ID}`), ctx(OTHER_ID)), 404, "PRESCRIPTION_NOT_FOUND");
    const missing = await expectError(await getPrescription(get(`/api/prescriptions/${RX_ID}`), ctx(RX_ID)), 404, "PRESCRIPTION_NOT_FOUND");
    expect(foreign.error).toEqual(missing.error);
    expect(mocks.db.prescription.findFirst.mock.calls[0][0].where).toEqual({ id: OTHER_ID, patientId: USER_A.id });
  });

  it.each([
    ["a malformed id", "/api/prescriptions/abc", "abc"],
    ["a non-v4-shaped id", "/api/prescriptions/12345", "12345"],
    ["a supplied patientId", `/api/prescriptions/${RX_ID}?patientId=${USER_B.id}`, RX_ID],
    ["any query parameter", `/api/prescriptions/${RX_ID}?include=items`, RX_ID],
  ])("%s -> 400, no DB call", async (_name, path, id) => {
    await expectError(await getPrescription(get(path), ctx(id)), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("DB failure -> 500 generic", async () => {
    mocks.db.prescription.findFirst.mockRejectedValue(new Error("select * from prescriptions password=hunter2"));
    const body = await expectError(await getPrescription(get(`/api/prescriptions/${RX_ID}`), ctx(RX_ID)), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|select/);
  });
});
