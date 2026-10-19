// GET /api/queue-tickets/{id}: one of the signed-in patient's own tickets.
// Another patient's ticket returns the same 404 as a missing one.
import { getApiUser } from "@/lib/api/auth";
import { emptyQuerySchema, idParamsSchema } from "@/lib/api/directory";
import { queueTicketNotFound } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import { TICKET_SELECT, serviceDateToday, toTicketDto, waitingAheadOf } from "@/lib/api/queues";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApiParams<{ id: string }>(
  "GET /api/queue-tickets/[id]",
  async (request, { params }) => {
    const user = await getApiUser(request);
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);

    const row = await db.queueTicket.findFirst({ where: { id, patientId: user.id }, select: TICKET_SELECT });
    if (!row) throw queueTicketNotFound();
    return json(toTicketDto(row, await waitingAheadOf(db, row, serviceDateToday().day)));
  }
);
