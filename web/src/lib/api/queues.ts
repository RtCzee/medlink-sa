// Virtual queues: a queue is a facility's tickets for one calendar day (service_date,
// Africa/Johannesburg). There is no Queue table: queue_tickets belong to a facility and
// a day, and ticket_number is unique per (facility_id, service_date).
//
// Rules (README: "issuing queue tickets must go through the API, which must also enforce
// one active queue ticket per patient"; RLS lets patients only READ their own tickets):
//   * Active = status waiting or called for TODAY's service date. A patient may hold at
//     most one active ticket, across all facilities.
//   * ticket_number = highest number issued at that facility today + 1 (never reused,
//     so leaving doesn't renumber anyone). Status starts as the database default
//     (`waiting`). There is no stored position: `waitingAhead` is computed at read time.
//   * Patients may only leave (waiting|called -> cancelled). Calling, serving and
//     reordering are staff operations and are not implemented.
//
// SECURITY: Prisma bypasses RLS. Every ticket query is scoped to the session patient.
import { Prisma, QueueTicketStatus } from "@prisma/client";
import { z } from "zod";
import { paginationShape } from "./directory";
import { ApiError } from "./errors";
import { todayInJohannesburg } from "./medical-records";
import { parseJson } from "./validation";

export const ACTIVE_TICKET_STATUSES = [QueueTicketStatus.waiting, QueueTicketStatus.called] as const;

/** Today's service date in South Africa: the YYYY-MM-DD string and the @db.Date value. */
export function serviceDateToday(now: Date = new Date()): { day: string; date: Date } {
  const day = todayInJohannesburg(now);
  return { day, date: new Date(`${day}T00:00:00.000Z`) };
}

export const dayOf = (date: Date) => date.toISOString().slice(0, 10);

/* --------------------------------- Requests -------------------------------- */

/** Join and leave take no body, or an empty JSON object. */
export const emptyBodySchema = z.strictObject({});

export const ticketListQuerySchema = z.strictObject({
  ...paginationShape,
  status: z.enum(QueueTicketStatus).optional(),
});
export type TicketListQuery = z.infer<typeof ticketListQuerySchema>;

/* ------------------------------ Queue listing ------------------------------ */

export const QUEUE_FACILITY_SELECT = {
  id: true,
  name: true,
  type: true,
  province: true,
  city: true,
} satisfies Prisma.FacilitySelect;

type QueueFacilityRow = Prisma.FacilityGetPayload<{ select: typeof QUEUE_FACILITY_SELECT }>;

export type QueueDto = {
  /** The facility id; join with POST /api/queues/{id}/join. */
  id: string;
  name: string;
  type: QueueFacilityRow["type"];
  province: string;
  city: string;
  /** The day a ticket joined now is issued for (YYYY-MM-DD, South African date). */
  serviceDate: string;
};

export function toQueueDto(row: QueueFacilityRow, serviceDate: string): QueueDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    province: row.province,
    city: row.city,
    serviceDate,
  };
}

/* --------------------------------- Tickets --------------------------------- */

export const TICKET_SELECT = {
  id: true,
  facilityId: true,
  serviceDate: true,
  ticketNumber: true,
  status: true,
  issuedAt: true,
  createdAt: true,
  updatedAt: true,
  facility: { select: { name: true } },
} satisfies Prisma.QueueTicketSelect;

export type TicketRow = Prisma.QueueTicketGetPayload<{ select: typeof TICKET_SELECT }>;

export const TICKET_ORDER_BY = [
  { serviceDate: "desc" },
  { issuedAt: "desc" },
  { id: "desc" },
] satisfies Prisma.QueueTicketOrderByWithRelationInput[];

export type TicketDto = {
  id: string;
  facilityId: string;
  facilityName: string;
  serviceDate: string;
  ticketNumber: number;
  status: QueueTicketStatus;
  /** Waiting tickets with a lower number at the same facility today; null unless this ticket is waiting today. */
  waitingAhead: number | null;
  issuedAt: string;
  createdAt: string;
  updatedAt: string;
};

export function toTicketDto(row: TicketRow, waitingAhead: number | null): TicketDto {
  return {
    id: row.id,
    facilityId: row.facilityId,
    facilityName: row.facility.name,
    serviceDate: dayOf(row.serviceDate),
    ticketNumber: row.ticketNumber,
    status: row.status,
    waitingAhead,
    issuedAt: row.issuedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

type CountClient = { queueTicket: Pick<Prisma.TransactionClient["queueTicket"], "count"> };

/**
 * Number of waiting tickets ahead of this one, computed now (not stored). Only for a
 * ticket that is itself waiting today; otherwise null. Counts other patients' tickets
 * but returns only the number.
 */
export async function waitingAheadOf(
  client: CountClient,
  row: Pick<TicketRow, "facilityId" | "serviceDate" | "ticketNumber" | "status">,
  today: string
): Promise<number | null> {
  if (row.status !== QueueTicketStatus.waiting || dayOf(row.serviceDate) !== today) return null;
  return client.queueTicket.count({
    where: {
      facilityId: row.facilityId,
      serviceDate: row.serviceDate,
      status: QueueTicketStatus.waiting,
      ticketNumber: { lt: row.ticketNumber },
    },
  });
}

/* ---------------------------------- Locks ---------------------------------- */

type LockClient = Pick<Prisma.TransactionClient, "$executeRaw">;

/**
 * Transaction-scoped advisory locks (pg_advisory_xact_lock; released on commit or
 * rollback, safe with the transaction-mode pooler).
 *   * queue lock (facility + day): serialises ticket numbering for that queue.
 *   * patient lock: serialises the one-active-ticket check and leave for a patient.
 * Join takes queue then patient; leave takes only the patient lock. No operation takes
 * them in the opposite order, so they can't deadlock.
 * Only writers that take these locks (this API) are covered. The Data API can't write
 * tickets (SELECT-only grant); direct database writes are not covered.
 */
export async function lockQueue(tx: LockClient, facilityId: string, day: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`queues:facility:${facilityId}:${day}`}, 0))`;
}

export async function lockQueuePatient(tx: LockClient, patientId: string): Promise<void> {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`queues:patient:${patientId}`}, 0))`;
}

export const QUEUE_TX_OPTIONS = { maxWait: 5_000, timeout: 10_000 } as const;

/** Runs a queue write, mapping lock/transaction timeouts to a retryable 503. */
export async function runQueueWrite<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2028" || error.code === "P2034")
    ) {
      throw new ApiError(503, "SERVICE_UNAVAILABLE", "The queue service is busy. Please try again shortly.");
    }
    throw error;
  }
}

/** No body, or `{}`. Any field (patientId, status, ticketNumber, ...) is a 400. */
export async function rejectBodyFields(request: Request): Promise<void> {
  const text = await request.clone().text();
  if (text.length === 0) return;
  await parseJson(request, emptyBodySchema);
}
