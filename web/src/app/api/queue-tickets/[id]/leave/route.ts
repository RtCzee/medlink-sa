// POST /api/queue-tickets/{id}/leave: the signed-in patient leaves a queue.
//
// Transitions: waiting|called (today) -> cancelled.
//   - Already cancelled: 200 with the ticket unchanged (safe to retry).
//   - served, or the ticket's service date has passed: 409 QUEUE_TICKET_NOT_LEAVABLE.
// Patients can't set any other status or change ticket numbers. Ticket numbers are
// never renumbered, so leaving keeps everyone else's number and order.
//
// Concurrency: runs under the patient lock with a guarded update (only an active
// ticket for today changes), so a double leave changes the row once and both calls
// return the cancelled ticket.
import { QueueTicketStatus } from "@prisma/client";
import { assertSameOrigin, getApiUser } from "@/lib/api/auth";
import { emptyQuerySchema, idParamsSchema } from "@/lib/api/directory";
import { queueTicketNotFound, queueTicketNotLeavable } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import {
  ACTIVE_TICKET_STATUSES,
  QUEUE_TX_OPTIONS,
  TICKET_SELECT,
  dayOf,
  lockQueuePatient,
  rejectBodyFields,
  runQueueWrite,
  serviceDateToday,
  toTicketDto,
} from "@/lib/api/queues";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const POST = withApiParams<{ id: string }>(
  "POST /api/queue-tickets/[id]/leave",
  async (request, { params }) => {
    const user = await getApiUser(request);
    assertSameOrigin(request, user);
    enforceRateLimit(`queues:${user.id}`);
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);
    await rejectBodyFields(request);
    const owned = { id, patientId: user.id };
    const today = serviceDateToday();

    const ticket = await runQueueWrite(() =>
      db.$transaction(async (tx) => {
        await lockQueuePatient(tx, user.id);
        const current = await tx.queueTicket.findFirst({ where: owned, select: TICKET_SELECT });
        if (!current) throw queueTicketNotFound();
        if (current.status === QueueTicketStatus.cancelled) return current;
        if (current.status === QueueTicketStatus.served) {
          throw queueTicketNotLeavable("This ticket has already been served.");
        }
        if (dayOf(current.serviceDate) !== today.day) {
          throw queueTicketNotLeavable("This ticket's day has passed, so it can't be changed.");
        }

        const { count } = await tx.queueTicket.updateMany({
          where: { ...owned, serviceDate: today.date, status: { in: [...ACTIVE_TICKET_STATUSES] } },
          data: { status: QueueTicketStatus.cancelled },
        });
        const after = await tx.queueTicket.findFirst({ where: owned, select: TICKET_SELECT });
        if (!after) throw queueTicketNotFound();
        if (count !== 1 && after.status !== QueueTicketStatus.cancelled) {
          throw queueTicketNotLeavable("This ticket can no longer be left.");
        }
        return after;
      }, QUEUE_TX_OPTIONS)
    );

    return json(toTicketDto(ticket, null));
  }
);
