// GET /api/facilities: PUBLIC facility directory (no sign-in; matches the database's
// anon SELECT grant). Never reads the session. See lib/api/directory.ts.
import {
  FACILITY_ORDER_BY,
  FACILITY_SELECT,
  PUBLIC_CACHE_CONTROL,
  facilityListQuerySchema,
  facilityWhere,
  pageWindow,
  toFacilityDto,
} from "@/lib/api/directory";
import { jsonPage, withApi } from "@/lib/api/handler";
import { parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApi(
  "GET /api/facilities",
  async (request) => {
    const query = parseQuery(request, facilityListQuerySchema);
    const { page, pageSize, skip, take } = pageWindow(query);
    const where = facilityWhere(query);

    const [rows, total] = await db.$transaction([
      db.facility.findMany({ where, select: FACILITY_SELECT, orderBy: FACILITY_ORDER_BY, skip, take }),
      db.facility.count({ where }),
    ]);

    return jsonPage(rows.map(toFacilityDto), { page, pageSize, total });
  },
  { cacheControl: PUBLIC_CACHE_CONTROL }
);
