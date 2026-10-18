// MOCKED unit tests: Supabase Auth and Prisma are mocked; nothing touches the network or DB.
import { Prisma } from "@prisma/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FAKE_JWT,
  USER_A,
  USER_B,
  apiRequest,
  readJson,
  signedInAs,
  signedOut,
  type ErrorBody,
} from "./helpers";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  db: {
    profile: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), upsert: vi.fn() },
    userSettings: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@/lib/db", () => ({ db: mocks.db }));
vi.mock("@/utils/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));

import { GET as getProfile, PATCH as patchProfile } from "@/app/api/profile/route";
import { GET as getSettings, PATCH as patchSettings } from "@/app/api/settings/route";
import { resetRateLimits } from "@/lib/api/rate-limit";

const NOW = new Date("2026-10-19T10:00:00.000Z");
const PROFILE_A = {
  id: USER_A.id,
  fullName: "Thandi A",
  email: USER_A.email,
  phone: null,
  role: "patient" as const,
  createdAt: NOW,
  updatedAt: NOW,
};
const SETTINGS_A = {
  language: "en" as const,
  theme: "system" as const,
  notificationsEnabled: true,
  showEmergencyQr: true,
  updatedAt: NOW,
};

const PROFILE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
};
const SETTINGS_SELECT = {
  language: true,
  theme: true,
  notificationsEnabled: true,
  showEmergencyQr: true,
  updatedAt: true,
};

function knownError(code: string) {
  return new Prisma.PrismaClientKnownRequestError(
    "Invalid `prisma.profile.update()` invocation: INTERNAL relation \"profiles\" password=hunter2",
    { code, clientVersion: "6.19.3" }
  );
}

/** Every where-clause any Prisma mock received. */
function allWhereArgs(): unknown[] {
  return [
    ...mocks.db.profile.findUnique.mock.calls,
    ...mocks.db.profile.update.mock.calls,
    ...mocks.db.userSettings.findUnique.mock.calls,
    ...mocks.db.userSettings.update.mock.calls,
  ].map((call) => (call[0] as { where: unknown }).where);
}

function expectNoCreates() {
  expect(mocks.db.profile.create).not.toHaveBeenCalled();
  expect(mocks.db.profile.upsert).not.toHaveBeenCalled();
  expect(mocks.db.userSettings.create).not.toHaveBeenCalled();
  expect(mocks.db.userSettings.upsert).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimits();
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/profile", () => {
  it("returns the signed-in user's profile (200, scoped by session id, select only)", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.findUnique.mockResolvedValue(PROFILE_A);

    const res = await getProfile(apiRequest("/api/profile"));

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const body = await readJson<{ data: Record<string, unknown> }>(res);
    expect(body.data).toEqual({ ...PROFILE_A, createdAt: NOW.toISOString(), updatedAt: NOW.toISOString() });
    expect(mocks.db.profile.findUnique).toHaveBeenCalledWith({ where: { id: USER_A.id }, select: PROFILE_SELECT });
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
  });

  it("ignores a forged id in the query string", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.findUnique.mockResolvedValue(PROFILE_A);

    const res = await getProfile(apiRequest(`/api/profile?id=${USER_B.id}&userId=${USER_B.id}`));

    expect(res.status).toBe(200);
    expect(allWhereArgs()).toEqual([{ id: USER_A.id }]);
  });

  it("returns 404 PROFILE_NOT_FOUND when the row is missing, without creating one", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.findUnique.mockResolvedValue(null);

    const res = await getProfile(apiRequest("/api/profile"));

    expect(res.status).toBe(404);
    expect((await readJson<ErrorBody>(res)).error.code).toBe("PROFILE_NOT_FOUND");
    expectNoCreates();
  });
});

describe("PATCH /api/profile", () => {
  it("updates fullName and phone (200), trimmed, scoped to the session user", async () => {
    signedInAs(mocks.getUser, USER_A);
    const updated = { ...PROFILE_A, fullName: "Thandi Mokoena", phone: "+27 82 123 4567" };
    mocks.db.profile.update.mockResolvedValue(updated);

    const res = await patchProfile(
      apiRequest("/api/profile", {
        method: "PATCH",
        body: { fullName: "  Thandi Mokoena  ", phone: "+27 82 123 4567" },
      })
    );

    expect(res.status).toBe(200);
    expect((await readJson<{ data: { fullName: string } }>(res)).data.fullName).toBe("Thandi Mokoena");
    expect(mocks.db.profile.update).toHaveBeenCalledWith({
      where: { id: USER_A.id },
      data: { fullName: "Thandi Mokoena", phone: "+27 82 123 4567" },
      select: PROFILE_SELECT,
    });
  });

  it("accepts phone: null to clear the number", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.update.mockResolvedValue(PROFILE_A);

    const res = await patchProfile(apiRequest("/api/profile", { method: "PATCH", body: { phone: null } }));

    expect(res.status).toBe(200);
    expect(mocks.db.profile.update.mock.calls[0][0].data).toEqual({ phone: null });
  });

  it.each([
    ["role", { role: "admin" }],
    ["id", { id: USER_B.id, fullName: "X" }],
    ["email", { email: "new@test.invalid" }],
    ["user_id", { user_id: USER_B.id, fullName: "X" }],
    ["userId", { userId: USER_B.id, fullName: "X" }],
    ["patient_id", { patient_id: USER_B.id }],
    ["created_at", { created_at: "2020-01-01" }],
    ["updatedAt", { updatedAt: "2020-01-01", fullName: "X" }],
  ])("rejects protected field %s with 400 and never writes", async (field, body) => {
    signedInAs(mocks.getUser, USER_A);

    const res = await patchProfile(apiRequest("/api/profile", { method: "PATCH", body }));

    expect(res.status).toBe(400);
    const err = await readJson<ErrorBody>(res);
    expect(err.error.code).toBe("VALIDATION_FAILED");
    expect(err.error.details?.some((d) => d.keys?.includes(field))).toBe(true);
    expect(mocks.db.profile.update).not.toHaveBeenCalled();
  });

  it.each([
    ["empty object", {}],
    ["blank fullName", { fullName: "   " }],
    ["fullName too long", { fullName: "x".repeat(101) }],
    ["fullName not a string", { fullName: 42 }],
    ["phone with letters", { phone: "082 CALL ME" }],
    ["phone too short", { phone: "12345" }],
    ["phone too long", { phone: "+27 82 123 4567 8901 2345 6789 01234" }],
  ])("rejects invalid payload (%s) with 400", async (_label, body) => {
    signedInAs(mocks.getUser, USER_A);

    const res = await patchProfile(apiRequest("/api/profile", { method: "PATCH", body }));

    expect(res.status).toBe(400);
    expect((await readJson<ErrorBody>(res)).error.code).toBe("VALIDATION_FAILED");
    expect(mocks.db.profile.update).not.toHaveBeenCalled();
  });

  it("does not echo submitted values in validation errors", async () => {
    signedInAs(mocks.getUser, USER_A);
    const secretish = "082 SECRET-VALUE";

    const res = await patchProfile(apiRequest("/api/profile", { method: "PATCH", body: { phone: secretish } }));

    expect(res.status).toBe(400);
    expect(await res.text()).not.toContain("SECRET-VALUE");
  });

  it.each([
    ["malformed JSON", "{ fullName: ", "INVALID_JSON"],
    ["empty body", "", "INVALID_JSON"],
    ["JSON array", "[1,2]", "INVALID_BODY"],
    ["JSON string", '"hello"', "INVALID_BODY"],
    ["JSON null", "null", "INVALID_BODY"],
  ])("rejects %s with 400 %s", async (_label, rawBody, code) => {
    signedInAs(mocks.getUser, USER_A);

    const res = await patchProfile(
      apiRequest("/api/profile", { method: "PATCH", rawBody, headers: { "content-type": "application/json" } })
    );

    expect(res.status).toBe(400);
    expect((await readJson<ErrorBody>(res)).error.code).toBe(code);
    expect(mocks.db.profile.update).not.toHaveBeenCalled();
  });

  it("rejects a non-JSON content type with 415", async () => {
    signedInAs(mocks.getUser, USER_A);

    const res = await patchProfile(
      apiRequest("/api/profile", { method: "PATCH", rawBody: "fullName=x", headers: { "content-type": "application/x-www-form-urlencoded" } })
    );

    expect(res.status).toBe(415);
    expect(mocks.db.profile.update).not.toHaveBeenCalled();
  });

  it("returns 404 PROFILE_NOT_FOUND when the row is missing (P2025), without creating one", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.update.mockRejectedValue(knownError("P2025"));

    const res = await patchProfile(apiRequest("/api/profile", { method: "PATCH", body: { fullName: "A" } }));

    expect(res.status).toBe(404);
    expect((await readJson<ErrorBody>(res)).error.code).toBe("PROFILE_NOT_FOUND");
    expectNoCreates();
  });

  it("blocks cookie-authenticated cross-site writes with 403", async () => {
    signedInAs(mocks.getUser, USER_A);

    const res = await patchProfile(
      apiRequest("/api/profile", {
        method: "PATCH",
        body: { fullName: "A" },
        headers: { origin: "https://evil.example", host: "localhost:3000" },
      })
    );

    expect(res.status).toBe(403);
    expect(mocks.db.profile.update).not.toHaveBeenCalled();
  });

  it("allows same-origin cookie writes", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.update.mockResolvedValue(PROFILE_A);

    const res = await patchProfile(
      apiRequest("/api/profile", {
        method: "PATCH",
        body: { fullName: "A" },
        headers: { origin: "http://localhost:3000", host: "localhost:3000" },
      })
    );

    expect(res.status).toBe(200);
  });

  it("rate-limits writes per user with 429 and Retry-After (per-instance limiter)", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.update.mockResolvedValue(PROFILE_A);

    let last: Response | undefined;
    for (let i = 0; i < 21; i++) {
      last = await patchProfile(apiRequest("/api/profile", { method: "PATCH", body: { fullName: "A" } }));
    }

    expect(last?.status).toBe(429);
    expect(last?.headers.get("retry-after")).toMatch(/^\d+$/);
    expect((await readJson<ErrorBody>(last!)).error.code).toBe("RATE_LIMITED");
    expect(mocks.db.profile.update).toHaveBeenCalledTimes(20);
  });
});

describe("GET/PATCH /api/settings", () => {
  it("GET returns the user's settings (200), scoped by user_id", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.userSettings.findUnique.mockResolvedValue(SETTINGS_A);

    const res = await getSettings(apiRequest("/api/settings"));

    expect(res.status).toBe(200);
    expect((await readJson<{ data: Record<string, unknown> }>(res)).data).toEqual({
      ...SETTINGS_A,
      updatedAt: NOW.toISOString(),
    });
    expect(mocks.db.userSettings.findUnique).toHaveBeenCalledWith({
      where: { userId: USER_A.id },
      select: SETTINGS_SELECT,
    });
  });

  it("PATCH updates enums and booleans (200)", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.userSettings.update.mockResolvedValue({ ...SETTINGS_A, language: "zu", theme: "dark", showEmergencyQr: false });

    const res = await patchSettings(
      apiRequest("/api/settings", { method: "PATCH", body: { language: "zu", theme: "dark", showEmergencyQr: false } })
    );

    expect(res.status).toBe(200);
    expect(mocks.db.userSettings.update).toHaveBeenCalledWith({
      where: { userId: USER_A.id },
      data: { language: "zu", theme: "dark", showEmergencyQr: false },
      select: SETTINGS_SELECT,
    });
  });

  it.each([
    ["unknown language", { language: "fr" }],
    ["unknown theme", { theme: "blue" }],
    ["boolean as string", { notificationsEnabled: "true" }],
    ["empty object", {}],
    ["userId", { userId: USER_B.id, theme: "dark" }],
    ["user_id", { user_id: USER_B.id, theme: "dark" }],
    ["createdAt", { createdAt: "2020-01-01", theme: "dark" }],
  ])("PATCH rejects %s with 400", async (_label, body) => {
    signedInAs(mocks.getUser, USER_A);

    const res = await patchSettings(apiRequest("/api/settings", { method: "PATCH", body }));

    expect(res.status).toBe(400);
    expect((await readJson<ErrorBody>(res)).error.code).toBe("VALIDATION_FAILED");
    expect(mocks.db.userSettings.update).not.toHaveBeenCalled();
  });

  it("GET returns 404 SETTINGS_NOT_FOUND for a missing row, without creating one", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.userSettings.findUnique.mockResolvedValue(null);

    const res = await getSettings(apiRequest("/api/settings"));

    expect(res.status).toBe(404);
    expect((await readJson<ErrorBody>(res)).error.code).toBe("SETTINGS_NOT_FOUND");
    expectNoCreates();
  });

  it("PATCH returns 404 SETTINGS_NOT_FOUND for a missing row (no upsert)", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.userSettings.update.mockRejectedValue(knownError("P2025"));

    const res = await patchSettings(apiRequest("/api/settings", { method: "PATCH", body: { theme: "dark" } }));

    expect(res.status).toBe(404);
    expect((await readJson<ErrorBody>(res)).error.code).toBe("SETTINGS_NOT_FOUND");
    expectNoCreates();
  });
});

describe("authentication", () => {
  const endpoints: Array<[string, () => Promise<Response>]> = [
    ["GET /api/profile", () => getProfile(apiRequest("/api/profile"))],
    ["PATCH /api/profile", () => patchProfile(apiRequest("/api/profile", { method: "PATCH", body: { fullName: "A" } }))],
    ["GET /api/settings", () => getSettings(apiRequest("/api/settings"))],
    ["PATCH /api/settings", () => patchSettings(apiRequest("/api/settings", { method: "PATCH", body: { theme: "dark" } }))],
  ];

  it.each(endpoints)("%s without a session -> 401 JSON, no DB access", async (_name, call) => {
    signedOut(mocks.getUser);

    const res = await call();

    expect(res.status).toBe(401);
    expect(res.headers.get("content-type")).toContain("application/json");
    const err = await readJson<ErrorBody>(res);
    expect(err.error.code).toBe("UNAUTHENTICATED");
    expect(err.requestId).toBeTruthy();
    expect(allWhereArgs()).toEqual([]);
  });

  it.each(endpoints)("%s with an invalid Bearer token -> 401", async (_name) => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthApiError", status: 403, message: "invalid JWT" },
    });
    const [method, path] = _name.split(" ");
    const handler = { "GET /api/profile": getProfile, "PATCH /api/profile": patchProfile, "GET /api/settings": getSettings, "PATCH /api/settings": patchSettings }[_name]!;

    const res = await handler(
      apiRequest(path, {
        method,
        body: method === "PATCH" ? { theme: "dark", fullName: "A" } : undefined,
        headers: { authorization: `Bearer ${FAKE_JWT}` },
      })
    );

    expect(res.status).toBe(401);
    expect(allWhereArgs()).toEqual([]);
  });

  it("verifies a Bearer token with supabase.auth.getUser(jwt) and scopes to that user", async () => {
    signedInAs(mocks.getUser, USER_B);
    mocks.db.profile.findUnique.mockResolvedValue({ ...PROFILE_A, id: USER_B.id });

    const res = await getProfile(apiRequest("/api/profile", { headers: { authorization: `Bearer ${FAKE_JWT}` } }));

    expect(res.status).toBe(200);
    expect(mocks.getUser).toHaveBeenCalledTimes(1);
    expect(mocks.getUser).toHaveBeenCalledWith(FAKE_JWT);
    expect(allWhereArgs()).toEqual([{ id: USER_B.id }]);
  });

  it("rejects a malformed Authorization header without falling back to cookies", async () => {
    signedInAs(mocks.getUser, USER_A);

    const res = await getProfile(apiRequest("/api/profile", { headers: { authorization: "Basic dXNlcjpwYXNz" } }));

    expect(res.status).toBe(401);
    expect(mocks.getUser).not.toHaveBeenCalled();
  });

  it("Bearer writes are not subject to the cookie Origin check", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.userSettings.update.mockResolvedValue(SETTINGS_A);

    const res = await patchSettings(
      apiRequest("/api/settings", {
        method: "PATCH",
        body: { theme: "dark" },
        headers: { authorization: `Bearer ${FAKE_JWT}`, origin: "https://app.example", host: "localhost:3000" },
      })
    );

    expect(res.status).toBe(200);
  });

  it("returns 503 when Supabase Auth is unreachable", async () => {
    mocks.getUser.mockResolvedValue({
      data: { user: null },
      error: { name: "AuthRetryableFetchError", status: 0, message: "fetch failed" },
    });

    const res = await getProfile(apiRequest("/api/profile"));

    expect(res.status).toBe(503);
  });
});

describe("patient A vs patient B isolation", () => {
  it("with session A, every query targets A even when the body and query name B", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.findUnique.mockResolvedValue(PROFILE_A);
    mocks.db.profile.update.mockResolvedValue(PROFILE_A);
    mocks.db.userSettings.findUnique.mockResolvedValue(SETTINGS_A);
    mocks.db.userSettings.update.mockResolvedValue(SETTINGS_A);

    const statuses = [
      (await getProfile(apiRequest(`/api/profile?id=${USER_B.id}`))).status,
      (await patchProfile(apiRequest(`/api/profile?id=${USER_B.id}`, { method: "PATCH", body: { fullName: "A" } }))).status,
      (await patchProfile(apiRequest("/api/profile", { method: "PATCH", body: { id: USER_B.id, fullName: "A" } }))).status,
      (await getSettings(apiRequest(`/api/settings?userId=${USER_B.id}`))).status,
      (await patchSettings(apiRequest(`/api/settings?userId=${USER_B.id}`, { method: "PATCH", body: { theme: "dark" } }))).status,
      (await patchSettings(apiRequest("/api/settings", { method: "PATCH", body: { userId: USER_B.id, theme: "dark" } }))).status,
    ];

    expect(statuses).toEqual([200, 200, 400, 200, 200, 400]);
    const wheres = allWhereArgs();
    expect(wheres).toHaveLength(4);
    expect(JSON.stringify(wheres)).not.toContain(USER_B.id);
    for (const where of wheres) {
      expect(Object.values(where as Record<string, string>)).toEqual([USER_A.id]);
    }
  });
});

describe("database failures", () => {
  it("an unexpected Prisma error -> 500 generic message, no internals, requestId present", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.findUnique.mockRejectedValue(knownError("P2010"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await getProfile(apiRequest("/api/profile", { headers: { "x-request-id": "req-test-123456" } }));

    expect(res.status).toBe(500);
    const text = await res.text();
    const body = JSON.parse(text) as ErrorBody;
    expect(body.error).toEqual({ code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." });
    expect(body.requestId).toBe("req-test-123456");
    expect(res.headers.get("x-request-id")).toBe("req-test-123456");
    for (const leak of ["prisma", "INTERNAL relation", "hunter2", "stack", "P2010", "at "]) {
      expect(text).not.toContain(leak);
    }
    // Structured log: requestId, route, status, error name/code, but no message contents.
    expect(errorLog).toHaveBeenCalledTimes(1);
    const logged = JSON.parse(String(errorLog.mock.calls[0][0])) as Record<string, unknown>;
    expect(logged).toMatchObject({ level: "error", requestId: "req-test-123456", route: "GET /api/profile", method: "GET", status: 500, errorCode: "P2010" });
    expect(String(errorLog.mock.calls[0][0])).not.toContain("hunter2");
  });

  it("a plain thrown Error -> 500 generic", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.userSettings.update.mockRejectedValue(new Error("connection string postgresql://user:pw@host/db"));

    const res = await patchSettings(apiRequest("/api/settings", { method: "PATCH", body: { theme: "dark" } }));

    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain("postgresql://");
  });

  it("a DB connection error (P1001) -> 503", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.findUnique.mockRejectedValue(knownError("P1001"));

    const res = await getProfile(apiRequest("/api/profile"));

    expect(res.status).toBe(503);
    expect((await readJson<ErrorBody>(res)).error.code).toBe("SERVICE_UNAVAILABLE");
  });

  it("a unique-constraint error (P2002) -> 409", async () => {
    signedInAs(mocks.getUser, USER_A);
    mocks.db.profile.update.mockRejectedValue(knownError("P2002"));

    const res = await patchProfile(apiRequest("/api/profile", { method: "PATCH", body: { fullName: "A" } }));

    expect(res.status).toBe(409);
  });

  it("an invalid incoming x-request-id is replaced with a generated one", async () => {
    signedOut(mocks.getUser);

    const res = await getProfile(apiRequest("/api/profile", { headers: { "x-request-id": "bad id <script>" } }));

    const id = res.headers.get("x-request-id");
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect((await readJson<ErrorBody>(res)).requestId).toBe(id);
  });
});
