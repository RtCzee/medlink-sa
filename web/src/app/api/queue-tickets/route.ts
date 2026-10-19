// GET /api/queue-tickets: the signed-in patient's own queue tickets.
// SECURITY: Prisma bypasses RLS; the query is scoped to patientId = session user.
import { getApiUser } from "@/lib/api/auth";
import { pageWindow } from "@/lib/api/directory";
import { jsonPage, withApi } from "@/lib/api/handler";
import {
  TICKET_ORDER_BY,
  TICKET_SELECT,
  serviceDateToday,
  ticketListQuerySchema,
  toTicketDto,
  waitingAheadOf,
} from "@/lib/api/queues";
import { parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApi("GET /api/queue-tickets", async (request) => {
  const user = await getApiUser(request);
  const query = parseQuery(request, ticketListQuerySchema);
  const { page, pageSize, skip, take } = pageWindow(query);
  const where = { patientId: user.id, ...(query.status ? { status: query.status } : {}) };
  const { day } = serviceDateToday();

  const [rows, total] = await db.$transaction([
    db.queueTicket.findMany({ where, select: TICKET_SELECT, orderBy: TICKET_ORDER_BY, skip, take }),
    db.queueTicket.count({ where }),
  ]);

  // At most one ticket is waiting today (one active ticket per patient), so this adds
  // at most one count query.
  const data = await Promise.all(rows.map(async (row) => toTicketDto(row, await waitingAheadOf(db, row, day))));
  return jsonPage(data, { page, pageSize, total });
});
