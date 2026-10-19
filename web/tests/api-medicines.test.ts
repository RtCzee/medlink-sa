// MOCKED unit tests for the public medicine directory. Prisma is mocked (no database)
// and Supabase Auth is mocked only to prove it is never called. They prove the routes'
// where-clauses, selects, caching and validation; they do NOT prove RLS or live data.
import { Prisma } from "@prisma/client";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { FAKE_JWT, apiRequest, readJson, type ErrorBody } from "./helpers";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  db: {
    $transaction: vi.fn(),
    medicine: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn() },
    medicinePrice: { findMany: vi.fn(), count: vi.fn() },
    profile: { findUnique: vi.fn() },
    prescription: { findMany: vi.fn(), findFirst: vi.fn() },
    prescriptionItem: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import * as detailRoute from "@/app/api/medicines/[id]/route";
import * as pricesRoute from "@/app/api/medicines/[id]/prices/route";
import * as listRoute from "@/app/api/medicines/route";
import { PUBLIC_CACHE_CONTROL } from "@/lib/api/directory";
import { MEDICINE_ORDER_BY, MEDICINE_SELECT, PRICE_ORDER_BY, PRICE_SELECT } from "@/lib/api/medicines";

const { GET: listMedicines } = listRoute;
const { GET: getMedicine } = detailRoute;
const { GET: listPrices } = pricesRoute;

const MED_ID = "d1d1d1d1-e2e2-4f3f-8a4a-b5b5b5b5b5b5";
const PRICE_ID = "e7e7e7e7-f8f8-4a9a-8b0b-c1c1c1c1c1c1";

const medRow = (overrides: Record<string, unknown> = {}) => ({
  id: MED_ID,
  name: "Panado",
  genericName: "Paracetamol",
  strength: "500mg",
  form: "Tablet",
  category: "Pain & fever",
  requiresPrescription: false,
  source: "demo",
  ...overrides,
});

const priceRow = (overrides: Record<string, unknown> = {}) => ({
  id: PRICE_ID,
  pharmacyName: "Clicks",
  amount: new Prisma.Decimal("24.99"),
  currency: "ZAR",
  effectiveFrom: new Date("2026-10-19T00:00:00.000Z"),
  source: "demo",
  ...overrides,
});

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const get = (path: string, headers?: Record<string, string>) => apiRequest(path, { headers });

function dbTouched() {
  return (
    mocks.db.$transaction.mock.calls.length > 0 ||
    [...Object.values(mocks.db.medicine), ...Object.values(mocks.db.medicinePrice)].some((fn) => fn.mock.calls.length > 0)
  );
}
function privateDataTouched() {
  return [mocks.db.profile.findUnique, mocks.db.prescription.findMany, mocks.db.prescription.findFirst, mocks.db.prescriptionItem.findMany].some(
    (fn) => fn.mock.calls.length > 0
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
  mocks.db.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe("medicines: public access policy (MOCKED)", () => {
  it.each<[string, (h?: Record<string, string>) => Promise<Response>]>([
    ["list", (h) => listMedicines(get("/api/medicines", h))],
    ["detail", (h) => getMedicine(get(`/api/medicines/${MED_ID}`, h), ctx(MED_ID))],
    ["prices", (h) => listPrices(get(`/api/medicines/${MED_ID}/prices`, h), ctx(MED_ID))],
  ])("%s works without a session, never reads it, and is publicly cacheable", async (_name, call) => {
    mocks.db.medicine.findMany.mockResolvedValue([medRow()]);
    mocks.db.medicine.count.mockResolvedValue(1);
    mocks.db.medicine.findFirst.mockResolvedValue(medRow());
    mocks.db.medicinePrice.findMany.mockResolvedValue([priceRow()]);
    mocks.db.medicinePrice.count.mockResolvedValue(1);

    for (const headers of [undefined, { authorization: `Bearer ${FAKE_JWT}` }, { authorization: "Basic broken" }]) {
      const res = await call(headers);
      expect(res.status).toBe(200);
      expect(res.headers.get("cache-control")).toBe(PUBLIC_CACHE_CONTROL);
      expect(res.headers.get("set-cookie")).toBeNull();
    }
    expect(mocks.getUser).not.toHaveBeenCalled();
    expect(privateDataTouched()).toBe(false);
  });

  it("is read-only: only GET handlers exist", () => {
    for (const mod of [listRoute, detailRoute, pricesRoute]) {
      expect(Object.keys(mod).filter((k) => /^[A-Z]+$/.test(k))).toEqual(["GET"]);
    }
  });
});

describe("GET /api/medicines (MOCKED)", () => {
  it("lists active medicines ordered by name then id, with whitelisted fields", async () => {
    mocks.db.medicine.findMany.mockResolvedValue([medRow({ active: true, createdAt: new Date(), internal: "x" })]);
    mocks.db.medicine.count.mockResolvedValue(1);

    const res = await listMedicines(get("/api/medicines"));

    expect(await readJson(res)).toEqual({ data: [medRow()], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
    expect(mocks.db.medicine.findMany).toHaveBeenCalledWith({
      where: { active: true },
      select: MEDICINE_SELECT,
      orderBy: MEDICINE_ORDER_BY,
      skip: 0,
      take: 20,
    });
    expect(mocks.db.medicine.count).toHaveBeenCalledWith({ where: { active: true } });
    expect(MEDICINE_ORDER_BY).toEqual([{ name: "asc" }, { id: "asc" }]);
    expect(Object.keys(MEDICINE_SELECT).sort()).toEqual(
      ["category", "form", "genericName", "id", "name", "requiresPrescription", "source", "strength"]
    );
  });

  it("maps q, category and requiresPrescription; paginates", async () => {
    mocks.db.medicine.findMany.mockResolvedValue([]);
    mocks.db.medicine.count.mockResolvedValue(45);

    const res = await listMedicines(get("/api/medicines?q=%20pan%20&category=pain%20%26%20fever&requiresPrescription=false&page=3&pageSize=20"));

    const args = mocks.db.medicine.findMany.mock.calls[0][0];
    expect(args.where).toEqual({
      active: true,
      name: { contains: "pan", mode: "insensitive" },
      category: { equals: "pain & fever", mode: "insensitive" },
      requiresPrescription: false,
    });
    expect([args.skip, args.take]).toEqual([40, 20]);
    expect((await readJson<{ meta: unknown }>(res)).meta).toEqual({ page: 3, pageSize: 20, total: 45, totalPages: 3 });
  });

  it("requiresPrescription=true maps to true", async () => {
    mocks.db.medicine.findMany.mockResolvedValue([]);
    mocks.db.medicine.count.mockResolvedValue(0);
    await listMedicines(get("/api/medicines?requiresPrescription=true"));
    expect(mocks.db.medicine.findMany.mock.calls[0][0].where).toEqual({ active: true, requiresPrescription: true });
  });

  it.each([
    "unknown=1",
    "patientId=x",
    "active=false",
    "page=0",
    "pageSize=101",
    "q=a",
    `q=${"x".repeat(101)}`,
    "category=",
    "requiresPrescription=yes",
    "requiresPrescription=1",
    "q=pan&q=bru",
  ])("rejects ?%s with 400 (no-store) and no DB call", async (qs) => {
    await expectError(await listMedicines(get(`/api/medicines?${qs}`)), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("DB failure -> 500 generic, no-store; unreachable -> 503", async () => {
    mocks.db.$transaction.mockRejectedValueOnce(new Error('relation "medicines" password=hunter2'));
    const body = await expectError(await listMedicines(get("/api/medicines")), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|relation/);
    mocks.db.$transaction.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("can't reach", { code: "P1001", clientVersion: "6.19.3" })
    );
    await expectError(await listMedicines(get("/api/medicines")), 503, "SERVICE_UNAVAILABLE");
  });
});

describe("GET /api/medicines/{id} (MOCKED)", () => {
  it("returns an active medicine (where id AND active)", async () => {
    mocks.db.medicine.findFirst.mockResolvedValue(medRow({ genericName: null, strength: null, form: null, category: null }));
    const res = await getMedicine(get(`/api/medicines/${MED_ID}`), ctx(MED_ID));
    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({
      data: medRow({ genericName: null, strength: null, form: null, category: null }),
    });
    expect(mocks.db.medicine.findFirst).toHaveBeenCalledWith({ where: { id: MED_ID, active: true }, select: MEDICINE_SELECT });
  });

  it("missing or inactive -> 404 MEDICINE_NOT_FOUND (no-store)", async () => {
    mocks.db.medicine.findFirst.mockResolvedValue(null);
    await expectError(await getMedicine(get(`/api/medicines/${MED_ID}`), ctx(MED_ID)), 404, "MEDICINE_NOT_FOUND");
  });

  it("invalid id or any query parameter -> 400, no DB call", async () => {
    await expectError(await getMedicine(get("/api/medicines/m1"), ctx("m1")), 400, "VALIDATION_FAILED");
    await expectError(await getMedicine(get(`/api/medicines/${MED_ID}?x=1`), ctx(MED_ID)), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("DB failure -> 500 generic", async () => {
    mocks.db.medicine.findFirst.mockRejectedValue(new Error("boom password=hunter2"));
    const body = await expectError(await getMedicine(get(`/api/medicines/${MED_ID}`), ctx(MED_ID)), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toContain("hunter2");
  });
});

describe("GET /api/medicines/{id}/prices (MOCKED)", () => {
  beforeEach(() => mocks.db.medicine.findFirst.mockResolvedValue({ id: MED_ID }));

  it("lists the medicine's prices, newest effective date first; amount is an exact decimal string", async () => {
    mocks.db.medicinePrice.findMany.mockResolvedValue([priceRow({ medicineId: MED_ID, createdAt: new Date() })]);
    mocks.db.medicinePrice.count.mockResolvedValue(1);

    const res = await listPrices(get(`/api/medicines/${MED_ID}/prices?pageSize=5`), ctx(MED_ID));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(PUBLIC_CACHE_CONTROL);
    expect(await readJson(res)).toEqual({
      data: [{ id: PRICE_ID, pharmacyName: "Clicks", amount: "24.99", currency: "ZAR", effectiveFrom: "2026-10-19", source: "demo" }],
      meta: { page: 1, pageSize: 5, total: 1, totalPages: 1 },
    });
    expect(mocks.db.medicine.findFirst).toHaveBeenCalledWith({ where: { id: MED_ID, active: true }, select: { id: true } });
    const where = { medicineId: MED_ID, medicine: { active: true } };
    expect(mocks.db.medicinePrice.findMany).toHaveBeenCalledWith({ where, select: PRICE_SELECT, orderBy: PRICE_ORDER_BY, skip: 0, take: 5 });
    expect(mocks.db.medicinePrice.count).toHaveBeenCalledWith({ where });
    expect(PRICE_ORDER_BY).toEqual([{ effectiveFrom: "desc" }, { pharmacyName: "asc" }, { id: "asc" }]);
  });

  it("whole-rand and zero amounts keep two decimals", async () => {
    mocks.db.medicinePrice.findMany.mockResolvedValue([
      priceRow({ amount: new Prisma.Decimal("27") }),
      priceRow({ id: MED_ID, amount: new Prisma.Decimal("0") }),
    ]);
    mocks.db.medicinePrice.count.mockResolvedValue(2);
    const body = await readJson<{ data: { amount: string }[] }>(await listPrices(get(`/api/medicines/${MED_ID}/prices`), ctx(MED_ID)));
    expect(body.data.map((p) => p.amount)).toEqual(["27.00", "0.00"]);
  });

  it("missing or inactive medicine -> 404, prices not queried", async () => {
    mocks.db.medicine.findFirst.mockResolvedValue(null);
    await expectError(await listPrices(get(`/api/medicines/${MED_ID}/prices`), ctx(MED_ID)), 404, "MEDICINE_NOT_FOUND");
    expect(mocks.db.medicinePrice.findMany).not.toHaveBeenCalled();
  });

  it.each(["page=0", "pageSize=101", "pharmacy=Clicks", "page=1&page=2"])("rejects ?%s with 400", async (qs) => {
    await expectError(await listPrices(get(`/api/medicines/${MED_ID}/prices?${qs}`), ctx(MED_ID)), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("invalid id -> 400, no DB call", async () => {
    await expectError(await listPrices(get("/api/medicines/abc/prices"), ctx("abc")), 400, "VALIDATION_FAILED");
    expect(dbTouched()).toBe(false);
  });

  it("DB failure -> 500 generic", async () => {
    mocks.db.$transaction.mockRejectedValue(new Error("select from medicine_prices password=hunter2"));
    const body = await expectError(await listPrices(get(`/api/medicines/${MED_ID}/prices`), ctx(MED_ID)), 500, "INTERNAL_ERROR");
    expect(JSON.stringify(body)).not.toMatch(/hunter2|medicine_prices/);
  });
});
