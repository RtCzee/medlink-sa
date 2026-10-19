// INTEGRATION (opt-in, real PostgreSQL, READ-ONLY): proves the queue locks used by the
// join and leave routes serialise transactions in PostgreSQL. It takes advisory locks
// on random keys and sleeps; it reads and writes NO table rows.
//
// Skipped unless MEDLINK_DB_INTEGRATION=1. Needs DATABASE_URL (Vitest doesn't load
// web/.env; Node's --env-file does). Run from web/:
//   PowerShell: $env:MEDLINK_DB_INTEGRATION="1"; node --env-file=.env node_modules/vitest/vitest.mjs run tests/queues-locking.integration.test.ts
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { lockQueue, lockQueuePatient } from "@/lib/api/queues";

const enabled = process.env.MEDLINK_DB_INTEGRATION === "1";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const TX = { maxWait: 10_000, timeout: 20_000 } as const;
// Holding time for the first transaction; long enough to dominate pooler round trips.
const DAY = "2026-10-20";

describe.skipIf(!enabled)("queue locks (INTEGRATION: real PostgreSQL, read-only)", () => {
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

  /** Holds `first`'s locks for 3 s (the second starts once they're held), then measures when `second` gets its locks. */
  async function measure(
    first: (tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]) => Promise<void>,
    second: (tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0]) => Promise<void>
  ) {
    let firstDoneAt = 0;
    let secondLockedAt = 0;
    let startedAt = 0;
    await withClients(async (a, b) => {
      let firstLocked!: () => void;
      const firstHasLocks = new Promise<void>((resolve) => (firstLocked = resolve));
      const one = a.$transaction(async (tx) => {
        await first(tx);
        firstLocked(); // start the second only once the first really holds its locks
        await tx.$executeRaw`SELECT pg_sleep(3)`;
        firstDoneAt = Date.now();
      }, TX);
      await firstHasLocks;
      await sleep(200);
      startedAt = Date.now();
      const two = b.$transaction(async (tx) => {
        await second(tx);
        secondLockedAt = Date.now();
      }, TX);
      await Promise.all([one, two]);
    });
    return { firstDoneAt, secondLockedAt, waitedMs: secondLockedAt - startedAt };
  }

  it("two different patients joining the same queue are numbered one after the other", async () => {
    const facilityId = randomUUID();
    const r = await measure(
      async (tx) => {
        await lockQueue(tx, facilityId, DAY);
        await lockQueuePatient(tx, randomUUID());
      },
      async (tx) => {
        await lockQueue(tx, facilityId, DAY);
        await lockQueuePatient(tx, randomUUID());
      }
    );
    expect(r.secondLockedAt).toBeGreaterThanOrEqual(r.firstDoneAt);
    expect(r.waitedMs).toBeGreaterThan(800);
  }, 30_000);

  it("the same patient joining two queues at once is checked one after the other", async () => {
    const patientId = randomUUID();
    const r = await measure(
      async (tx) => {
        await lockQueue(tx, randomUUID(), DAY);
        await lockQueuePatient(tx, patientId);
      },
      async (tx) => {
        await lockQueue(tx, randomUUID(), DAY);
        await lockQueuePatient(tx, patientId);
      }
    );
    expect(r.secondLockedAt).toBeGreaterThanOrEqual(r.firstDoneAt);
  }, 30_000);

  it("a leave waits for a join by the same patient (double leave / join-leave race)", async () => {
    const patientId = randomUUID();
    const r = await measure(
      async (tx) => {
        await lockQueue(tx, randomUUID(), DAY);
        await lockQueuePatient(tx, patientId);
      },
      async (tx) => {
        await lockQueuePatient(tx, patientId);
      }
    );
    expect(r.secondLockedAt).toBeGreaterThanOrEqual(r.firstDoneAt);
  }, 30_000);

  it("the same facility on a different day, and unrelated patients, don't block", async () => {
    const facilityId = randomUUID();
    const r = await measure(
      async (tx) => {
        await lockQueue(tx, facilityId, DAY);
        await lockQueuePatient(tx, randomUUID());
      },
      async (tx) => {
        await lockQueue(tx, facilityId, "2026-10-21");
        await lockQueuePatient(tx, randomUUID());
      }
    );
    // Not blocked: the second gets its locks while the first is still holding (sleeping).
    // (Compared with the first's finish, not a fixed time, because pooler latency varies.)
    expect(r.secondLockedAt).toBeLessThan(r.firstDoneAt);
  }, 30_000);
});
