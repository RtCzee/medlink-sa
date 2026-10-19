import { describe, expect, it, vi } from "vitest";

import * as seed from "../prisma/seed-demo.mjs";

const { DEMO_FACILITIES, DEMO_PRACTITIONERS, assertMedLinkTarget, seedDemo } = seed as {
  DEMO_FACILITIES: Array<Record<string, unknown> & { id: string; name: string }>;
  DEMO_PRACTITIONERS: Array<Record<string, unknown> & { id: string; fullName: string; facilityId: string; licenseNumber: string; profileId: null }>;
  assertMedLinkTarget: (url: unknown) => void;
  seedDemo: (db: unknown) => Promise<{ inserted: { facilities: number; practitioners: number }; present: { facilities: number; practitioners: number } }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("demo seed target guard", () => {
  it("accepts the MedLink-SA pooler and direct hosts", () => {
    expect(() => assertMedLinkTarget("postgresql://postgres.rjcuiadcsvlxfbplcihl:x@aws-0-eu-west-1.pooler.supabase.com:6543/postgres")).not.toThrow();
    expect(() => assertMedLinkTarget("postgresql://postgres:x@db.rjcuiadcsvlxfbplcihl.supabase.co:5432/postgres")).not.toThrow();
  });

  it("refuses any other project, a missing URL or a lookalike, without echoing the URL", () => {
    const tmf = "postgresql://postgres.otherprojectref00000:secret@aws-0-eu-west-1.pooler.supabase.com:6543/postgres";
    expect(() => assertMedLinkTarget(tmf)).toThrow(/does not point at the MedLink-SA project/);
    try {
      assertMedLinkTarget(tmf);
    } catch (error) {
      expect(String(error)).not.toContain("secret");
      expect(String(error)).not.toContain("otherprojectref00000");
    }
    expect(() => assertMedLinkTarget(undefined)).toThrow(/not set/);
    expect(() => assertMedLinkTarget("not a url")).toThrow(/not a valid URL/);
    expect(() => assertMedLinkTarget("postgresql://postgres.rjcuiadcsvlxfbplcihl:x@evil.example.com:5432/postgres")).toThrow();
    expect(() => assertMedLinkTarget("postgresql://postgres:x@db.rjcuiadcsvlxfbplcihl.supabase.co.evil.com:5432/postgres")).toThrow();
  });
});

describe("demo seed data", () => {
  it("is clearly fictional, uses fixed UUIDs and links every practitioner to a demo facility", () => {
    expect(DEMO_FACILITIES).toHaveLength(2);
    expect(DEMO_PRACTITIONERS).toHaveLength(3);
    const facilityIds = new Set(DEMO_FACILITIES.map((f) => f.id));
    for (const f of DEMO_FACILITIES) {
      expect(f.id).toMatch(UUID);
      expect(f.name.startsWith("DEMO - ")).toBe(true);
      expect(f.province).toBe("Gauteng");
      expect(String(f.address)).toContain("(fictional)");
    }
    for (const p of DEMO_PRACTITIONERS) {
      expect(p.id).toMatch(UUID);
      expect(p.fullName.startsWith("DEMO - ")).toBe(true);
      expect(p.licenseNumber).toMatch(/^DEMO-\d{4}$/);
      expect(p.profileId).toBeNull();
      expect(facilityIds.has(p.facilityId)).toBe(true);
    }
    const ids = [...DEMO_FACILITIES, ...DEMO_PRACTITIONERS].map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(DEMO_PRACTITIONERS.map((p) => p.licenseNumber)).size).toBe(3);
  });

  it("only inserts with skipDuplicates and never updates or deletes", async () => {
    const db = {
      facility: { createMany: vi.fn(async () => ({ count: 0 })), count: vi.fn(async () => 2), update: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
      practitioner: { createMany: vi.fn(async () => ({ count: 0 })), count: vi.fn(async () => 3), update: vi.fn(), upsert: vi.fn(), deleteMany: vi.fn() },
    };
    const result = await seedDemo(db);
    expect(result).toEqual({ inserted: { facilities: 0, practitioners: 0 }, present: { facilities: 2, practitioners: 3 } });
    expect(db.facility.createMany).toHaveBeenCalledWith({ data: DEMO_FACILITIES, skipDuplicates: true });
    expect(db.practitioner.createMany).toHaveBeenCalledWith({ data: DEMO_PRACTITIONERS, skipDuplicates: true });
    for (const model of [db.facility, db.practitioner]) {
      expect(model.update).not.toHaveBeenCalled();
      expect(model.upsert).not.toHaveBeenCalled();
      expect(model.deleteMany).not.toHaveBeenCalled();
    }
    // Facilities are inserted before the practitioners that reference them.
    expect(db.facility.createMany.mock.invocationCallOrder[0]).toBeLessThan(db.practitioner.createMany.mock.invocationCallOrder[0]);
  });
});
