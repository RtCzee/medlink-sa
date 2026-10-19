import { describe, expect, it, vi } from "vitest";

import {
  ApiRequestError,
  apiFetch,
  formatPrice,
  priceLabel,
  sastParts,
  sastSlotToUtc,
  sessionExpiredUrl,
} from "@/lib/client/api";

function respond(status: number, body: unknown) {
  return vi.fn(async () =>
    new Response(typeof body === "string" ? body : JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    })
  );
}

async function failure(promise: Promise<unknown>): Promise<ApiRequestError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof ApiRequestError) return error;
    throw error;
  }
  throw new Error("expected the call to fail");
}

describe("apiFetch (browser API client)", () => {
  it("unwraps {data, meta} and sends a same-origin, uncached GET", async () => {
    const fetcher = respond(200, { data: [{ id: "a" }], meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 } });
    const result = await apiFetch<{ id: string }[]>("/api/appointments", {}, fetcher);
    expect(result.data).toEqual([{ id: "a" }]);
    expect(result.meta?.total).toBe(1);
    const [path, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(path).toBe("/api/appointments");
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("same-origin");
    expect(init.cache).toBe("no-store");
    expect(init.body).toBeUndefined();
    // The browser never attaches a token itself: the session cookie authenticates.
    expect(new Headers(init.headers).has("authorization")).toBe(false);
  });

  it("sends JSON bodies for writes (an empty object when none is given)", async () => {
    const fetcher = respond(201, { data: { id: "t" } });
    await apiFetch("/api/queues/q/join", { method: "POST" }, fetcher);
    const [, init] = fetcher.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe("{}");
    expect(new Headers(init.headers).get("content-type")).toBe("application/json");
  });

  it("turns the error envelope into ApiRequestError with code, message and requestId", async () => {
    const fetcher = respond(409, { error: { code: "SLOT_TAKEN", message: "That time is no longer available." }, requestId: "req-9" });
    const error = await failure(apiFetch("/api/appointments", { method: "POST", body: {} }, fetcher));
    expect(error.status).toBe(409);
    expect(error.code).toBe("SLOT_TAKEN");
    expect(error.message).toBe("That time is no longer available.");
    expect(error.requestId).toBe("req-9");
    expect(error.isSessionExpired).toBe(false);
  });

  it("flags 401 as an expired session, even without an envelope", async () => {
    const error = await failure(apiFetch("/api/profile", {}, respond(401, "")));
    expect(error.isSessionExpired).toBe(true);
    expect(error.message).toMatch(/session has expired/i);
  });

  it("reports network failures as status 0", async () => {
    const fetcher = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const error = await failure(apiFetch("/api/queues", {}, fetcher));
    expect(error.status).toBe(0);
    expect(error.code).toBe("NETWORK_ERROR");
  });

  it("rejects a 200 that is not the documented envelope", async () => {
    const error = await failure(apiFetch("/api/queues", {}, respond(200, "<html>proxy</html>")));
    expect(error.code).toBe("MALFORMED_RESPONSE");
  });

  it("gives non-JSON server errors a readable message", async () => {
    const error = await failure(apiFetch("/api/queues", {}, respond(502, "Bad gateway")));
    expect(error.code).toBe("HTTP_502");
    expect(error.message).toMatch(/502/);
  });

  it("sends the user back to the dashboard after signing in again", () => {
    expect(sessionExpiredUrl("/dashboard/patient")).toBe("/sign-in?redirect=%2Fdashboard%2Fpatient");
  });
});

describe("time helpers (SAST)", () => {
  it("converts a SAST day + slot to a UTC instant", () => {
    expect(sastSlotToUtc(new Date(2026, 9, 21), "09:30")).toBe("2026-10-21T07:30:00.000Z");
    expect(sastSlotToUtc(new Date(2026, 9, 21), "01:00")).toBe("2026-10-20T23:00:00.000Z");
    expect(sastSlotToUtc(new Date(2026, 9, 21), "9:30")).toBeNull();
    expect(sastSlotToUtc(new Date(2026, 9, 21), "25:00")).toBeNull();
  });

  it("shows UTC instants in SAST", () => {
    const parts = sastParts("2026-10-21T07:30:00.000Z");
    expect(parts.time).toBe("09:30");
    expect(parts.date).toMatch(/21/);
    expect(sastParts("nonsense")).toEqual({ date: "nonsense", time: "" });
  });
});

describe("medicine price display", () => {
  it("keeps the exact decimal amount", () => {
    expect(formatPrice("24.99", "ZAR")).toBe("R24.99");
    expect(formatPrice("5.00", "USD")).toBe("USD 5.00");
  });

  it("always labels demo prices as demo, not current", () => {
    const label = priceLabel({ source: "demo", effectiveFrom: "2026-10-19" });
    expect(label).toMatch(/demo/i);
    expect(label).toMatch(/not a current price/i);
    expect(priceLabel({ source: "sepa", effectiveFrom: "2026-11-01" })).toBe("Price from 2026-11-01 (sepa)");
  });
});
