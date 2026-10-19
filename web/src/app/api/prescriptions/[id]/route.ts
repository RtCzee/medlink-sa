// GET /api/prescriptions/{id}: one of the signed-in patient's prescriptions, with its
// items. The lookup filters on id AND patientId, and items are read only through that
// parent, so another patient's prescription (or its items) is a 404 like a missing one.
import { getApiUser } from "@/lib/api/auth";
import { emptyQuerySchema, idParamsSchema } from "@/lib/api/directory";
import { prescriptionNotFound } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import { PRESCRIPTION_DETAIL_SELECT, toPrescriptionDetailDto } from "@/lib/api/prescriptions";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApiParams<{ id: string }>(
  "GET /api/prescriptions/[id]",
  async (request, { params }) => {
    const user = await getApiUser(request);
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);

    const row = await db.prescription.findFirst({
      where: { id, patientId: user.id },
      select: PRESCRIPTION_DETAIL_SELECT,
    });
    if (!row) throw prescriptionNotFound();
    return json(toPrescriptionDetailDto(row));
  }
);
