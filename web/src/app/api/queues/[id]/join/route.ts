// POST /api/queues/{id}/join: the signed-in patient joins today's queue at facility {id}.
//
// The server decides everything: patient (session), facility (path), service date
// (today, Africa/Johannesburg), ticket number (next at that facility today) and status
// (database default `waiting`). Any body field is a 400.
//
// Concurrency: one transaction takes the queue lock (facility + day) then the patient
// lock, then checks and inserts. Simultaneous joins to the same queue get consecutive
// numbers; simultaneous joins by the same patient yield one ticket and one 409. The
// (facility_id, service_date, ticket_number) unique index backs the numbering.
import { Prisma } from "@prisma/client";
import { assertSameOrigin, getApiUser, requireRole } from "@/lib/api/auth";
import { emptyQuerySchema, idParamsSchema } from "@/lib/api/directory";
import { facilityNotFound, profileNotFound, queueTicketActive } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import {
  ACTIVE_TICKET_STATUSES,
  QUEUE_TX_OPTIONS,
  TICKET_SELECT,
  lockQueue,
  lockQueuePatient,
  rejectBodyFields,
  runQueueWrite,
  serviceDateToday,
  toTicketDto,
  waitingAheadOf,
} from "@/lib/api/queues";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const POST = withApiParams<{ id: string }>(
  "POST /api/queues/[id]/join",
  async (request, { params }) => {
    const user = await getApiUser(request);
    assertSameOrigin(request, user);
    enforceRateLimit(`queues:${user.id}`);
    const { id: facilityId } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);
    await rejectBodyFields(request);
    await requireRole(user, ["patient"]);
    const today = serviceDateToday();

    const result = await runQueueWrite(() =>
      db.$transaction(async (tx) => {
        await lockQueue(tx, facilityId, today.day);
        await lockQueuePatient(tx, user.id);

        const facility = await tx.facility.findUnique({ where: { id: facilityId }, select: { id: true } });
        if (!facility) throw facilityNotFound();

        const active = await tx.queueTicket.findFirst({
          where: { patientId: user.id, serviceDate: today.date, status: { in: [...ACTIVE_TICKET_STATUSES] } },
          select: { id: true },
        });
        if (active) throw queueTicketActive();

        const last = await tx.queueTicket.aggregate({
          where: { facilityId, serviceDate: today.date },
          _max: { ticketNumber: true },
        });

        try {
          const ticket = await tx.queueTicket.create({
            data: {
              patientId: user.id,
              facilityId,
              serviceDate: today.date,
              ticketNumber: (last._max.ticketNumber ?? 0) + 1,
              // status, issuedAt and timestamps: database defaults.
            },
            select: TICKET_SELECT,
          });
          return { ticket, waitingAhead: await waitingAheadOf(tx, ticket, today.day) };
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            throw profileNotFound();
          }
          throw error;
        }
      }, QUEUE_TX_OPTIONS)
    );

    return json(toTicketDto(result.ticket, result.waitingAhead), 201);
  }
);
