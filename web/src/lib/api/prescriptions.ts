// Prescriptions (read-only for patients): query schema, Prisma selects and DTOs.
//
// Prescriptions are written by prescribers; there is no prescriber workflow or write
// permission yet, so this API only lets a patient READ their own prescriptions. RLS
// (prescriptions migration) mirrors this for the Data API: SELECT own rows, items only
// through an owned prescription, no writes.
//
// SECURITY: Prisma bypasses RLS. Every query is scoped to patientId = session user, and
// items are only ever read through that scoped parent. These selects are the exposure
// boundary: no patientId, no practitioner profileId/licenseNumber/id, no appointment id.
//
// DATES: issued_on / expires_on are calendar DATEs, returned as "YYYY-MM-DD". `status` is
// the stored value; it is not recomputed from expires_on.
import { PrescriptionStatus, type Prisma } from "@prisma/client";
import { z } from "zod";
import { paginationShape } from "./directory";
import { calendarDate, toUtcMidnight } from "./medical-records";

export const prescriptionListQuerySchema = z
  .strictObject({
    ...paginationShape,
    status: z.enum(PrescriptionStatus).optional(),
    from: calendarDate("from").optional(),
    to: calendarDate("to").optional(),
  })
  .superRefine((query, ctx) => {
    if (query.from && query.to && query.from > query.to) {
      ctx.addIssue({ code: "custom", path: ["to"], message: "to must be on or after from." });
    }
  });
export type PrescriptionListQuery = z.infer<typeof prescriptionListQuerySchema>;

export function prescriptionWhere(
  patientId: string,
  query: PrescriptionListQuery
): Prisma.PrescriptionWhereInput {
  return {
    patientId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.from || query.to
      ? {
          issuedOn: {
            ...(query.from ? { gte: toUtcMidnight(query.from) } : {}),
            ...(query.to ? { lte: toUtcMidnight(query.to) } : {}),
          },
        }
      : {}),
  };
}

// Index: prescriptions(patient_id, issued_on).
export const PRESCRIPTION_ORDER_BY = [
  { issuedOn: "desc" },
  { createdAt: "desc" },
  { id: "desc" },
] satisfies Prisma.PrescriptionOrderByWithRelationInput[];

export const PRESCRIPTION_SUMMARY_SELECT = {
  id: true,
  status: true,
  issuedOn: true,
  expiresOn: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  practitioner: { select: { fullName: true, specialty: true } },
  facility: { select: { id: true, name: true } },
  _count: { select: { items: true } },
} satisfies Prisma.PrescriptionSelect;

export const PRESCRIPTION_ITEM_SELECT = {
  id: true,
  medicineName: true,
  dosage: true,
  quantity: true,
  instructions: true,
  refills: true,
} satisfies Prisma.PrescriptionItemSelect;

export const PRESCRIPTION_ITEM_ORDER_BY = [
  { createdAt: "asc" },
  { id: "asc" },
] satisfies Prisma.PrescriptionItemOrderByWithRelationInput[];

export const PRESCRIPTION_DETAIL_SELECT = {
  ...PRESCRIPTION_SUMMARY_SELECT,
  items: { select: PRESCRIPTION_ITEM_SELECT, orderBy: PRESCRIPTION_ITEM_ORDER_BY },
} satisfies Prisma.PrescriptionSelect;

type SummaryRow = Prisma.PrescriptionGetPayload<{ select: typeof PRESCRIPTION_SUMMARY_SELECT }>;
type DetailRow = Prisma.PrescriptionGetPayload<{ select: typeof PRESCRIPTION_DETAIL_SELECT }>;
type ItemRow = Prisma.PrescriptionItemGetPayload<{ select: typeof PRESCRIPTION_ITEM_SELECT }>;

export type PrescriptionSummaryDto = {
  id: string;
  status: PrescriptionStatus;
  issuedOn: string;
  expiresOn: string | null;
  notes: string | null;
  /** Display only; null if no practitioner is linked (or it was removed). */
  practitioner: { fullName: string; specialty: string } | null;
  facility: { id: string; name: string } | null;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type PrescriptionItemDto = {
  id: string;
  medicineName: string;
  dosage: string;
  quantity: number | null;
  instructions: string | null;
  refills: number;
};

export type PrescriptionDetailDto = PrescriptionSummaryDto & { items: PrescriptionItemDto[] };

const day = (date: Date) => date.toISOString().slice(0, 10);

/** Explicit mapping: fields not listed here are never returned. */
export function toPrescriptionSummaryDto(row: SummaryRow): PrescriptionSummaryDto {
  return {
    id: row.id,
    status: row.status,
    issuedOn: day(row.issuedOn),
    expiresOn: row.expiresOn ? day(row.expiresOn) : null,
    notes: row.notes,
    practitioner: row.practitioner
      ? { fullName: row.practitioner.fullName, specialty: row.practitioner.specialty }
      : null,
    facility: row.facility ? { id: row.facility.id, name: row.facility.name } : null,
    itemCount: row._count.items,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toPrescriptionItemDto(row: ItemRow): PrescriptionItemDto {
  return {
    id: row.id,
    medicineName: row.medicineName,
    dosage: row.dosage,
    quantity: row.quantity,
    instructions: row.instructions,
    refills: row.refills,
  };
}

export function toPrescriptionDetailDto(row: DetailRow): PrescriptionDetailDto {
  return { ...toPrescriptionSummaryDto(row), items: row.items.map(toPrescriptionItemDto) };
}
