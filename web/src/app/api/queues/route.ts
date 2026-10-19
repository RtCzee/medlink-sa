// GET /api/queues: the queues a signed-in patient can join today. A queue is a
// facility's tickets for one day, so this lists facilities (same filters and order as
// the public directory) with today's South African service date.
//
// No patient data, no queue length and no wait estimate are returned: the schema has
// no service times or staff-maintained estimates to compute an accurate wait from.
// Private (no-store): the queue feature is for signed-in patients.
import { getApiUser } from "@/lib/api/auth";
import { FACILITY_ORDER_BY, facilityListQuerySchema, facilityWhere, pageWindow } from "@/lib/api/directory";
import { jsonPage, withApi } from "@/lib/api/handler";
import { QUEUE_FACILITY_SELECT, serviceDateToday, toQueueDto } from "@/lib/api/queues";
import { parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApi("GET /api/queues", async (request) => {
  await getApiUser(request);
  const query = parseQuery(request, facilityListQuerySchema);
  const { page, pageSize, skip, take } = pageWindow(query);
  const where = facilityWhere(query);
  const { day } = serviceDateToday();

  const [rows, total] = await db.$transaction([
    db.facility.findMany({ where, select: QUEUE_FACILITY_SELECT, orderBy: FACILITY_ORDER_BY, skip, take }),
    db.facility.count({ where }),
  ]);

  return jsonPage(
    rows.map((row) => toQueueDto(row, day)),
    { page, pageSize, total }
  );
});
