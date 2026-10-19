// GET/POST /api/medical-records: the signed-in patient's own (patient-authored) records.
//
// SECURITY: Prisma BYPASSES Row Level Security. Every query is scoped to the verified
// session user (patientId = user.id); the patient is never taken from the request.
// Responses are private (Cache-Control: no-store, set by withApi). Record contents and
// ids are never logged (withApi logs only route, method, status and timing).
import { Prisma } from "@prisma/client";
import { assertSameOrigin, getApiUser, requireRole } from "@/lib/api/auth";
import { emptyQuerySchema, pageWindow } from "@/lib/api/directory";
import { profileNotFound } from "@/lib/api/errors";
import { json, jsonPage, withApi } from "@/lib/api/handler";
import {
  MEDICAL_RECORD_ORDER_BY,
  MEDICAL_RECORD_SELECT,
  medicalRecordCreateSchema,
  medicalRecordListQuerySchema,
  medicalRecordWhere,
  toMedicalRecordDto,
} from "@/lib/api/medical-records";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { parseJson, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApi("GET /api/medical-records", async (request) => {
  const user = await getApiUser(request);
  const query = parseQuery(request, medicalRecordListQuerySchema);
  const { page, pageSize, skip, take } = pageWindow(query);
  const where = medicalRecordWhere(user.id, query);

  const [rows, total] = await db.$transaction([
    db.medicalRecord.findMany({
      where,
      select: MEDICAL_RECORD_SELECT,
      orderBy: MEDICAL_RECORD_ORDER_BY,
      skip,
      take,
    }),
    db.medicalRecord.count({ where }),
  ]);

  return jsonPage(rows.map(toMedicalRecordDto), { page, pageSize, total });
});

// Patients add their own records (the existing permission model: the Data API lets an
// authenticated user insert their own rows, content columns only). This endpoint is
// stricter: the caller's role in the database must be `patient`.
export const POST = withApi("POST /api/medical-records", async (request) => {
  const user = await getApiUser(request);
  assertSameOrigin(request, user);
  enforceRateLimit(`medical-records:${user.id}`);
  parseQuery(request, emptyQuerySchema);
  const input = await parseJson(request, medicalRecordCreateSchema);
  await requireRole(user, ["patient"]);

  try {
    const record = await db.medicalRecord.create({
      data: {
        patientId: user.id,
        title: input.title,
        category: input.category,
        provider: input.provider ?? null,
        recordedOn: input.recordedOn,
        notes: input.notes ?? null,
        // id, createdAt and updatedAt come from the database.
      },
      select: MEDICAL_RECORD_SELECT,
    });
    return json(toMedicalRecordDto(record), 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      throw profileNotFound();
    }
    throw error;
  }
});
