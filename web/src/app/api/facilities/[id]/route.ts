// GET /api/facilities/{id}: PUBLIC. Never reads the session.
import {
  FACILITY_SELECT,
  PUBLIC_CACHE_CONTROL,
  emptyQuerySchema,
  idParamsSchema,
  toFacilityDto,
} from "@/lib/api/directory";
import { facilityNotFound } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApiParams<{ id: string }>(
  "GET /api/facilities/[id]",
  async (request, { params }) => {
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);

    const row = await db.facility.findUnique({ where: { id }, select: FACILITY_SELECT });
    if (!row) throw facilityNotFound();
    return json(toFacilityDto(row));
  },
  { cacheControl: PUBLIC_CACHE_CONTROL }
);
