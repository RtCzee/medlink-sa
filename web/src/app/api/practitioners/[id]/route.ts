// GET /api/practitioners/{id}: PUBLIC. Restricted fields are never selected.
import {
  PRACTITIONER_SELECT,
  PUBLIC_CACHE_CONTROL,
  emptyQuerySchema,
  idParamsSchema,
  toPractitionerDto,
} from "@/lib/api/directory";
import { practitionerNotFound } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApiParams<{ id: string }>(
  "GET /api/practitioners/[id]",
  async (request, { params }) => {
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);

    const row = await db.practitioner.findUnique({ where: { id }, select: PRACTITIONER_SELECT });
    if (!row) throw practitionerNotFound();
    return json(toPractitionerDto(row));
  },
  { cacheControl: PUBLIC_CACHE_CONTROL }
);
