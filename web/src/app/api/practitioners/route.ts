// GET /api/practitioners: PUBLIC practitioner directory (no sign-in). Only the
// columns the database grants to anon are returned; profile_id and license_number
// are never selected. Never reads the session. See lib/api/directory.ts.
import {
  PRACTITIONER_ORDER_BY,
  PRACTITIONER_SELECT,
  PUBLIC_CACHE_CONTROL,
  pageWindow,
  practitionerListQuerySchema,
  practitionerWhere,
  toPractitionerDto,
} from "@/lib/api/directory";
import { jsonPage, withApi } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApi(
  "GET /api/practitioners",
  async (request) => {
    const query = parseQuery(request, practitionerListQuerySchema);
    const { page, pageSize, skip, take } = pageWindow(query);
    const where = practitionerWhere(query);

    const [rows, total] = await db.$transaction([
      db.practitioner.findMany({
        where,
        select: PRACTITIONER_SELECT,
        orderBy: PRACTITIONER_ORDER_BY,
        skip,
        take,
      }),
      db.practitioner.count({ where }),
    ]);

    return jsonPage(rows.map(toPractitionerDto), { page, pageSize, total });
  },
  { cacheControl: PUBLIC_CACHE_CONTROL }
);
