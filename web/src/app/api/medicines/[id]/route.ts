// GET /api/medicines/{id}: PUBLIC. Active medicines only (an inactive one is a 404).
import { PUBLIC_CACHE_CONTROL, emptyQuerySchema, idParamsSchema } from "@/lib/api/directory";
import { medicineNotFound } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import { MEDICINE_SELECT, toMedicineDto } from "@/lib/api/medicines";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApiParams<{ id: string }>(
  "GET /api/medicines/[id]",
  async (request, { params }) => {
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);

    const row = await db.medicine.findFirst({ where: { id, active: true }, select: MEDICINE_SELECT });
    if (!row) throw medicineNotFound();
    return json(toMedicineDto(row));
  },
  { cacheControl: PUBLIC_CACHE_CONTROL }
);
