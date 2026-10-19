// GET /api/medicines/{id}/prices: PUBLIC. Listed prices of an active medicine, newest
// effective date first. Demo prices (source 'demo') are illustrative, not current.
import { PUBLIC_CACHE_CONTROL, idParamsSchema, pageWindow } from "@/lib/api/directory";
import { medicineNotFound } from "@/lib/api/errors";
import { jsonPage, withApiParams } from "@/lib/api/handler";
import { PRICE_ORDER_BY, PRICE_SELECT, priceListQuerySchema, toMedicinePriceDto } from "@/lib/api/medicines";
import { parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApiParams<{ id: string }>(
  "GET /api/medicines/[id]/prices",
  async (request, { params }) => {
    const { id } = parseParams(params, idParamsSchema);
    const query = parseQuery(request, priceListQuerySchema);
    const { page, pageSize, skip, take } = pageWindow(query);

    const medicine = await db.medicine.findFirst({ where: { id, active: true }, select: { id: true } });
    if (!medicine) throw medicineNotFound();

    // The price filter repeats the active check, so a medicine deactivated in between
    // returns no prices rather than a leak.
    const where = { medicineId: id, medicine: { active: true } };
    const [rows, total] = await db.$transaction([
      db.medicinePrice.findMany({ where, select: PRICE_SELECT, orderBy: PRICE_ORDER_BY, skip, take }),
      db.medicinePrice.count({ where }),
    ]);

    return jsonPage(rows.map(toMedicinePriceDto), { page, pageSize, total });
  },
  { cacheControl: PUBLIC_CACHE_CONTROL }
);
