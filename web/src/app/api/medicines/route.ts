// GET /api/medicines: PUBLIC medicine directory (no sign-in; matches the anon SELECT
// policy on active medicines). Never reads the session. See lib/api/medicines.ts.
import { PUBLIC_CACHE_CONTROL, pageWindow } from "@/lib/api/directory";
import { jsonPage, withApi } from "@/lib/api/handler";
import {
  MEDICINE_ORDER_BY,
  MEDICINE_SELECT,
  medicineListQuerySchema,
  medicineWhere,
  toMedicineDto,
} from "@/lib/api/medicines";
import { parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApi(
  "GET /api/medicines",
  async (request) => {
    const query = parseQuery(request, medicineListQuerySchema);
    const { page, pageSize, skip, take } = pageWindow(query);
    const where = medicineWhere(query);

    const [rows, total] = await db.$transaction([
      db.medicine.findMany({ where, select: MEDICINE_SELECT, orderBy: MEDICINE_ORDER_BY, skip, take }),
      db.medicine.count({ where }),
    ]);

    return jsonPage(rows.map(toMedicineDto), { page, pageSize, total });
  },
  { cacheControl: PUBLIC_CACHE_CONTROL }
);
