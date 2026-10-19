// MOCKED unit tests for the public directory endpoints: Prisma is mocked and the
// Supabase server client is a spy that must never be called. No network, no DB.
import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { apiRequest, readJson, type ErrorBody } from "./helpers";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  db: {
    $transaction: vi.fn(),
    facility: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
    practitioner: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/utils/supabase/server", () => ({ createClient: mocks.createClient }));

import { GET as getFacility } from "@/app/api/facilities/[id]/route";
import { GET as listFacilities } from "@/app/api/facilities/route";
import { GET as getPractitioner } from "@/app/api/practitioners/[id]/route";
import { GET as listPractitioners } from "@/app/api/practitioners/route";
import {
  FACILITY_SELECT,
  PRACTITIONER_SELECT,
  PUBLIC_CACHE_CONTROL,
  type RestrictedPractitionerField,
} from "@/lib/api/directory";

const FACILITY_ID = "3f2b8c1e-7d4a-4e5b-9c6d-1a2b3c4d5e6f";
const PRACTITIONER_ID = "8a7b6c5d-4e3f-4a1b-8c9d-0e1f2a3b4c5d";
const MISSING_ID = "0b1c2d3e-4f5a-4b6c-8d7e-9f0a1b2c3d4e";

const FACILITY_ROW = {
  id: FACILITY_ID,
  name: "Chris Hani Baragwanath Hospital",
  type: "hospital" as const,
  province: "Gauteng",
  city: "Soweto",
  address: "26 Chris Hani Rd",
  phone: "+27 11 933 8000",
  latitude: new Prisma.Decimal("-26.260500"),
  longitude: new Prisma.Decimal("27.943300"),
};
const FACILITY_DTO = { ...FACILITY_ROW, latitude: -26.2605, longitude: 27.9433 };

const PRACTITIONER_ROW = {
  id: PRACTITIONER_ID,
  fullName: "Dr Sipho Dlamini",
  specialty: "Cardiology",
  facilityId: FACILITY_ID,
  facility: { id: FACILITY_ID, name: "Chris Hani Baragwanath Hospital" },
};

const route = (path: string) => apiRequest(path);
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

function listCall(model: "facility" | "practitioner") {
  return mocks.db[model].findMany.mock.calls[0]?.[0] as {
    where: Record<string, unknown>;
    select: Record<string, unknown>;
    orderBy: unknown;
    skip: number;
    take: number;
  };
}

function primeList(model: "facility" | "practitioner", rows: unknown[], total: number) {
  mocks.db[model].findMany.mockResolvedValue(rows);
  mocks.db[model].count.mockResolvedValue(total);
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.db.$transaction.mockImplementation((ops: Promise<unknown>[]) => Promise.all(ops));
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  // Public endpoints must never look at the session.
  expect(mocks.createClient).not.toHaveBeenCalled();
});

describe("GET /api/facilities (public, MOCKED)", () => {
  it("lists facilities with default pagination and public caching", async () => {
    primeList("facility", [FACILITY_ROW], 1);

    const res = await listFacilities(route("/api/facilities"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(PUBLIC_CACHE_CONTROL);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const body = await readJson<{ data: unknown[]; meta: unknown }>(res);
    expect(body).toEqual({
      data: [FACILITY_DTO],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    expect(listCall("facility")).toEqual({
      where: {},
      select: FACILITY_SELECT,
      orderBy: [{ name: "asc" }, { id: "asc" }],
      skip: 0,
      take: 20,
    });
    expect(mocks.db.facility.count).toHaveBeenCalledWith({ where: {} });
    expect(mocks.db.$transaction).toHaveBeenCalledTimes(1);
  });

  it("works with a session cookie and Authorization header present (ignored)", async () => {
    primeList("facility", [], 0);

    const res = await listFacilities(
      apiRequest("/api/facilities", {
        headers: { cookie: "sb-x-auth-token=abc", authorization: "Bearer a.b.c" },
      })
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("maps every filter to the expected Prisma where", async () => {
    primeList("facility", [], 0);

    const res = await listFacilities(
      route("/api/facilities?type=clinic&province=Gauteng&city=%20soweto%20&q=%20bara%20&page=3&pageSize=10")
    );

    expect(res.status).toBe(200);
    const call = listCall("facility");
    expect(call.where).toEqual({
      type: "clinic",
      province: "Gauteng",
      city: { equals: "soweto", mode: "insensitive" },
      name: { contains: "bara", mode: "insensitive" },
    });
    expect(call.skip).toBe(20);
    expect(call.take).toBe(10);
    expect(mocks.db.facility.count).toHaveBeenCalledWith({ where: call.where });
    expect((await readJson<{ meta: unknown }>(res)).meta).toEqual({
      page: 3,
      pageSize: 10,
      total: 0,
      totalPages: 0,
    });
  });

  it("computes totalPages and allows pageSize=100 and page=1000", async () => {
    primeList("facility", [], 250);

    const res = await listFacilities(route("/api/facilities?pageSize=100&page=1000"));

    expect(res.status).toBe(200);
    expect((await readJson<{ meta: unknown }>(res)).meta).toEqual({
      page: 1000,
      pageSize: 100,
      total: 250,
      totalPages: 3,
    });
    expect(listCall("facility").skip).toBe(99_900);
  });

  it.each([
    ["page=0"],
    ["page=-1"],
    ["page=abc"],
    ["page=1.5"],
    ["page=1001"],
    ["page="],
    ["pageSize=0"],
    ["pageSize=101"],
    ["pageSize=1e2"],
    ["type=spa"],
    ["q=a"],
    [`q=${"x".repeat(101)}`],
    [`province=${"x".repeat(51)}`],
    [`city=${"x".repeat(101)}`],
    ["unknown=1"],
    ["page=1&page=2"],
  ])("rejects ?%s with 400 VALIDATION_FAILED and no DB call", async (qs) => {
    const res = await listFacilities(route(`/api/facilities?${qs}`));

    expect(res.status).toBe(400);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const err = await readJson<ErrorBody>(res);
    expect(err.error.code).toBe("VALIDATION_FAILED");
    expect(err.error.message).toBe("The query string is invalid.");
    expect(err.requestId).toBe(res.headers.get("x-request-id"));
    expect(mocks.db.facility.findMany).not.toHaveBeenCalled();
  });

  it("DB failure -> 500 generic, no internals, not cacheable", async () => {
    mocks.db.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("relation \"facilities\" secret-internal", {
        code: "P2010",
        clientVersion: "6.19.3",
      })
    );

    const res = await listFacilities(route("/api/facilities"));

    expect(res.status).toBe(500);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const text = await res.text();
    expect(text).not.toMatch(/secret-internal|facilities|P2010|prisma/i);
    expect((JSON.parse(text) as ErrorBody).error).toEqual({
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    });
  });
});

describe("GET /api/facilities/{id} (public, MOCKED)", () => {
  it("returns one facility (200, cacheable)", async () => {
    mocks.db.facility.findUnique.mockResolvedValue(FACILITY_ROW);

    const res = await getFacility(route(`/api/facilities/${FACILITY_ID}`), ctx(FACILITY_ID));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(PUBLIC_CACHE_CONTROL);
    expect(await readJson(res)).toEqual({ data: FACILITY_DTO });
    expect(mocks.db.facility.findUnique).toHaveBeenCalledWith({
      where: { id: FACILITY_ID },
      select: FACILITY_SELECT,
    });
  });

  it("null coordinates stay null", async () => {
    mocks.db.facility.findUnique.mockResolvedValue({ ...FACILITY_ROW, latitude: null, longitude: null });

    const res = await getFacility(route(`/api/facilities/${FACILITY_ID}`), ctx(FACILITY_ID));

    const { data } = await readJson<{ data: { latitude: unknown; longitude: unknown } }>(res);
    expect(data.latitude).toBeNull();
    expect(data.longitude).toBeNull();
  });

  it("drops fields that are not in the DTO (createdAt etc.)", async () => {
    mocks.db.facility.findUnique.mockResolvedValue({ ...FACILITY_ROW, createdAt: new Date(), internalNote: "x" });

    const res = await getFacility(route(`/api/facilities/${FACILITY_ID}`), ctx(FACILITY_ID));

    expect(Object.keys((await readJson<{ data: object }>(res)).data).sort()).toEqual(
      Object.keys(FACILITY_DTO).sort()
    );
  });

  it.each(["not-a-uuid", "123", `${FACILITY_ID}x`])("invalid id %s -> 400", async (id) => {
    const res = await getFacility(route(`/api/facilities/${id}`), ctx(id));

    expect(res.status).toBe(400);
    const err = await readJson<ErrorBody>(res);
    expect(err.error.code).toBe("VALIDATION_FAILED");
    expect(err.error.message).toBe("The URL path is invalid.");
    expect(err.error.details?.[0].path).toBe("id");
    expect(mocks.db.facility.findUnique).not.toHaveBeenCalled();
  });

  it("unknown query param on detail -> 400", async () => {
    const res = await getFacility(route(`/api/facilities/${FACILITY_ID}?expand=all`), ctx(FACILITY_ID));
    expect(res.status).toBe(400);
  });

  it("missing -> 404 FACILITY_NOT_FOUND (no-store)", async () => {
    mocks.db.facility.findUnique.mockResolvedValue(null);

    const res = await getFacility(route(`/api/facilities/${MISSING_ID}`), ctx(MISSING_ID));

    expect(res.status).toBe(404);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect((await readJson<ErrorBody>(res)).error.code).toBe("FACILITY_NOT_FOUND");
  });
});

describe("GET /api/practitioners (public, MOCKED)", () => {
  it("lists practitioners with the embedded facility and default pagination", async () => {
    primeList("practitioner", [PRACTITIONER_ROW], 1);

    const res = await listPractitioners(route("/api/practitioners"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe(PUBLIC_CACHE_CONTROL);
    expect(await readJson(res)).toEqual({
      data: [PRACTITIONER_ROW],
      meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
    expect(listCall("practitioner")).toEqual({
      where: {},
      select: PRACTITIONER_SELECT,
      orderBy: [{ fullName: "asc" }, { id: "asc" }],
      skip: 0,
      take: 20,
    });
  });

  it("maps facilityId, specialty and q filters", async () => {
    primeList("practitioner", [], 0);

    const res = await listPractitioners(
      route(`/api/practitioners?facilityId=${FACILITY_ID}&specialty=cardiology&q=sipho`)
    );

    expect(res.status).toBe(200);
    expect(listCall("practitioner").where).toEqual({
      facilityId: FACILITY_ID,
      specialty: { equals: "cardiology", mode: "insensitive" },
      fullName: { contains: "sipho", mode: "insensitive" },
    });
  });

  it.each([
    ["facilityId=nope"],
    ["pageSize=101"],
    ["page=0"],
    ["q=s"],
    [`specialty=${"x".repeat(101)}`],
    ["licenseNumber=MP123"],
    ["profileId=x"],
  ])("rejects ?%s with 400", async (qs) => {
    const res = await listPractitioners(route(`/api/practitioners?${qs}`));

    expect(res.status).toBe(400);
    expect((await readJson<ErrorBody>(res)).error.code).toBe("VALIDATION_FAILED");
    expect(mocks.db.practitioner.findMany).not.toHaveBeenCalled();
  });

  it("the Prisma select never includes restricted fields", async () => {
    primeList("practitioner", [], 0);
    await listPractitioners(route("/api/practitioners"));

    const select = listCall("practitioner").select;
    for (const field of ["profileId", "licenseNumber", "profile"]) {
      expect(select).not.toHaveProperty(field);
    }
    expectTypeOf<Extract<keyof typeof PRACTITIONER_SELECT, RestrictedPractitionerField>>().toEqualTypeOf<never>();
  });

  it("drops restricted fields even if the DB returned them (bad select simulation)", async () => {
    const leaky = {
      ...PRACTITIONER_ROW,
      profileId: "99999999-9999-4999-8999-999999999999",
      licenseNumber: "MP0123456",
      profile: { email: "doc@test.invalid" },
      facility: { ...PRACTITIONER_ROW.facility, phone: "x" },
    };
    primeList("practitioner", [leaky], 1);
    mocks.db.practitioner.findUnique.mockResolvedValue(leaky);

    const list = await (await listPractitioners(route("/api/practitioners"))).text();
    const detail = await (
      await getPractitioner(route(`/api/practitioners/${PRACTITIONER_ID}`), ctx(PRACTITIONER_ID))
    ).text();

    for (const text of [list, detail]) {
      expect(text).not.toMatch(/profileId|licenseNumber|MP0123456|99999999|doc@test|"phone"/);
    }
  });
});

describe("GET /api/practitioners/{id} (public, MOCKED)", () => {
  it("returns one practitioner (200)", async () => {
    mocks.db.practitioner.findUnique.mockResolvedValue({ ...PRACTITIONER_ROW, facilityId: null, facility: null });

    const res = await getPractitioner(route(`/api/practitioners/${PRACTITIONER_ID}`), ctx(PRACTITIONER_ID));

    expect(res.status).toBe(200);
    expect(await readJson(res)).toEqual({
      data: { ...PRACTITIONER_ROW, facilityId: null, facility: null },
    });
    expect(mocks.db.practitioner.findUnique).toHaveBeenCalledWith({
      where: { id: PRACTITIONER_ID },
      select: PRACTITIONER_SELECT,
    });
  });

  it("invalid id -> 400, missing -> 404 PRACTITIONER_NOT_FOUND", async () => {
    const bad = await getPractitioner(route("/api/practitioners/abc"), ctx("abc"));
    expect(bad.status).toBe(400);

    mocks.db.practitioner.findUnique.mockResolvedValue(null);
    const missing = await getPractitioner(route(`/api/practitioners/${MISSING_ID}`), ctx(MISSING_ID));
    expect(missing.status).toBe(404);
    expect((await readJson<ErrorBody>(missing)).error.code).toBe("PRACTITIONER_NOT_FOUND");
  });

  it("DB failure -> 500 with requestId and no internals", async () => {
    mocks.db.practitioner.findUnique.mockRejectedValue(new Error("connect ECONNREFUSED postgresql://u:p@h/db"));

    const res = await getPractitioner(
      apiRequest(`/api/practitioners/${PRACTITIONER_ID}`, { headers: { "x-request-id": "dir-test-0001" } }),
      ctx(PRACTITIONER_ID)
    );

    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).not.toMatch(/ECONNREFUSED|postgresql|stack/);
    expect((JSON.parse(text) as ErrorBody).requestId).toBe("dir-test-0001");
  });
});
