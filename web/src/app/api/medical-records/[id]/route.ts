// GET /api/medical-records/{id}: one of the signed-in patient's own records.
//
// SECURITY: Prisma BYPASSES Row Level Security. The query filters on BOTH the id and
// patientId = session user, so another patient's record is indistinguishable from a
// missing one (404 MEDICAL_RECORD_NOT_FOUND). Response is no-store.
import { getApiUser } from "@/lib/api/auth";
import { emptyQuerySchema, idParamsSchema } from "@/lib/api/directory";
import { medicalRecordNotFound } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import { MEDICAL_RECORD_SELECT, toMedicalRecordDto } from "@/lib/api/medical-records";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApiParams<{ id: string }>(
  "GET /api/medical-records/[id]",
  async (request, { params }) => {
    const user = await getApiUser(request);
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);

    const row = await db.medicalRecord.findFirst({
      where: { id, patientId: user.id },
      select: MEDICAL_RECORD_SELECT,
    });
    if (!row) throw medicalRecordNotFound();
    return json(toMedicalRecordDto(row));
  }
);
