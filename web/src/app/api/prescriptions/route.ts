// GET /api/prescriptions: the signed-in patient's own prescriptions (read-only).
// SECURITY: Prisma bypasses RLS; the query is scoped to patientId = session user.
// Responses are no-store; withApi logs only route, method, status and timing.
import { getApiUser } from "@/lib/api/auth";
import { pageWindow } from "@/lib/api/directory";
import { jsonPage, withApi } from "@/lib/api/handler";
import {
  PRESCRIPTION_ORDER_BY,
  PRESCRIPTION_SUMMARY_SELECT,
  prescriptionListQuerySchema,
  prescriptionWhere,
  toPrescriptionSummaryDto,
} from "@/lib/api/prescriptions";
import { parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApi("GET /api/prescriptions", async (request) => {
  const user = await getApiUser(request);
  const query = parseQuery(request, prescriptionListQuerySchema);
  const { page, pageSize, skip, take } = pageWindow(query);
  const where = prescriptionWhere(user.id, query);

  const [rows, total] = await db.$transaction([
    db.prescription.findMany({
      where,
      select: PRESCRIPTION_SUMMARY_SELECT,
      orderBy: PRESCRIPTION_ORDER_BY,
      skip,
      take,
    }),
    db.prescription.count({ where }),
  ]);

  return jsonPage(rows.map(toPrescriptionSummaryDto), { page, pageSize, total });
});
