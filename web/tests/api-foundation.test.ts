// MOCKED unit tests for the small API building blocks.
import { describe, expect, it } from "vitest";
import { ApiError } from "@/lib/api/errors";
import { enforceRateLimit, resetRateLimits } from "@/lib/api/rate-limit";
import { phoneSchema, profileUpdateSchema, settingsUpdateSchema } from "@/lib/api/schemas";

describe("schemas", () => {
  it.each(["+27 82 123 4567", "082-123-4567", "(011) 555 0123", "0821234567"])("accepts phone %s", (phone) => {
    expect(phoneSchema.safeParse(phone).success).toBe(true);
  });

  it.each(["abc", "+27 82 123 4567 ext 9", "123", "++27821234567"])("rejects phone %s", (phone) => {
    expect(phoneSchema.safeParse(phone).success).toBe(false);
  });

  it("profile schema is strict and needs at least one field", () => {
    expect(profileUpdateSchema.safeParse({}).success).toBe(false);
    expect(profileUpdateSchema.safeParse({ fullName: "A", role: "admin" }).success).toBe(false);
    expect(profileUpdateSchema.parse({ fullName: "  A  " })).toEqual({ fullName: "A" });
  });

  it("settings enums come from the Prisma enums", () => {
    for (const language of ["en", "zu", "af", "st"]) {
      expect(settingsUpdateSchema.safeParse({ language }).success).toBe(true);
    }
    for (const theme of ["system", "light", "dark"]) {
      expect(settingsUpdateSchema.safeParse({ theme }).success).toBe(true);
    }
    expect(settingsUpdateSchema.safeParse({ language: "xh" }).success).toBe(false);
  });
});

describe("rate limiter (per instance)", () => {
  it("allows `limit` calls per window, then throws 429, then resets", () => {
    resetRateLimits();
    const opts = { limit: 2, windowMs: 1000 };
    enforceRateLimit("k", opts, 0);
    enforceRateLimit("k", opts, 10);
    expect(() => enforceRateLimit("k", opts, 20)).toThrow(ApiError);
    try {
      enforceRateLimit("k", opts, 500);
    } catch (error) {
      expect((error as ApiError).status).toBe(429);
      expect((error as ApiError).headers?.["Retry-After"]).toBe("1");
    }
    expect(() => enforceRateLimit("k", opts, 1000)).not.toThrow();
    expect(() => enforceRateLimit("other", opts, 20)).not.toThrow();
  });
});
