// INTEGRATION (opt-in, real PostgreSQL, READ-ONLY): proves the booking lock used by
// the appointment routes actually serialises transactions in PostgreSQL. It takes
// advisory locks and sleeps; it reads and writes NO table rows.
//
// Skipped unless MEDLINK_DB_INTEGRATION=1. Needs DATABASE_URL in the environment
// (Vitest doesn't load web/.env; Node's --env-file does). Run from web/:
//   PowerShell: $env:MEDLINK_DB_INTEGRATION="1"; node --env-file=.env node_modules/vitest/vitest.mjs run tests/appointments-locking.integration.test.ts
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { lockBookingSlots } from "@/lib/api/appointments";

const enabled = process.env.MEDLINK_DB_INTEGRATION === "1";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TX = { maxWait: 10_000, timeout: 20_000 } as const;

describe.skipIf(!enabled)("booking lock (INTEGRATION: real PostgreSQL, read-only)", () => {
  // Two clients = two separate database connections (sessions).
  async function withClients(run: (a: PrismaClient, b: PrismaClient) => Promise<void>) {
    const a = new PrismaClient({ log: ["error"] });
    const b = new PrismaClient({ log: ["error"] });
    try {
      await Promise.all([a.$connect(), b.$connect()]);
      await run(a, b);
    } finally {
      await Promise.all([a.$disconnect(), b.$disconnect()]);
    }
  }

  it("a second booking for the same practitioner waits until the first commits", async () => {
    await withClients(async (a, b) => {
      const practitionerId = randomUUID();
      let firstDoneAt = 0;
      let secondLockedAt = 0;

      const first = a.$transaction(async (tx) => {
        await lockBookingSlots(tx, { practitionerId, patientId: randomUUID() });
        await tx.$executeRaw`SELECT pg_sleep(1.5)`;
        firstDoneAt = Date.now();
      }, TX);
      await sleep(400); // let the first transaction take the lock
      const startedAt = Date.now();
      const second = b.$transaction(async (tx) => {
        await lockBookingSlots(tx, { practitionerId, patientId: randomUUID() });
        secondLockedAt = Date.now();
      }, TX);
      await Promise.all([first, second]);

      expect(secondLockedAt).toBeGreaterThanOrEqual(firstDoneAt);
      expect(secondLockedAt - startedAt).toBeGreaterThan(800);
    });
  }, 30_000);

  it("the same patient booking two practitioners also waits", async () => {
    await withClients(async (a, b) => {
      const patientId = randomUUID();
      let firstDoneAt = 0;
      let secondLockedAt = 0;

      const first = a.$transaction(async (tx) => {
        await lockBookingSlots(tx, { practitionerId: randomUUID(), patientId });
        await tx.$executeRaw`SELECT pg_sleep(1.5)`;
        firstDoneAt = Date.now();
      }, TX);
      await sleep(400);
      const second = b.$transaction(async (tx) => {
        await lockBookingSlots(tx, { practitionerId: randomUUID(), patientId });
        secondLockedAt = Date.now();
      }, TX);
      await Promise.all([first, second]);

      expect(secondLockedAt).toBeGreaterThanOrEqual(firstDoneAt);
    });
  }, 30_000);

  it("unrelated practitioners and patients don't block each other", async () => {
    await withClients(async (a, b) => {
      let secondLockedAfterMs = 0;
      const first = a.$transaction(async (tx) => {
        await lockBookingSlots(tx, { practitionerId: randomUUID(), patientId: randomUUID() });
        await tx.$executeRaw`SELECT pg_sleep(1.5)`;
      }, TX);
      await sleep(400);
      const startedAt = Date.now();
      const second = b.$transaction(async (tx) => {
        await lockBookingSlots(tx, { practitionerId: randomUUID(), patientId: randomUUID() });
        secondLockedAfterMs = Date.now() - startedAt;
      }, TX);
      await Promise.all([first, second]);

      expect(secondLockedAfterMs).toBeLessThan(1_000);
    });
  }, 30_000);
});
