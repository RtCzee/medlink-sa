// Public medicine directory: query schemas, Prisma selects and DTOs.
//
// Data: the `medicines` and `medicine_prices` tables (medicines migration), seeded
// from the demo products with source = 'demo'. Prices are listed per named pharmacy
// from an effective date; demo prices are illustrative, NOT current. Only real columns
// are returned: there is no description, indication, dosage guidance, stock or
// availability data.
//
// SECURITY: public (like facilities). Prisma bypasses RLS, so these routes filter
// active = true in code (RLS does the same for the Data API), and the explicit selects
// are the exposure boundary. No user, patient or prescription data is involved.
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { nameSearch, paginationShape } from "./directory";

export const medicineListQuerySchema = z.strictObject({
  ...paginationShape,
  q: nameSearch.optional(),
  category: z.string().trim().min(1).max(80).optional(),
  requiresPrescription: z
    .enum(["true", "false"], { error: "Must be true or false." })
    .transform((value) => value === "true")
    .optional(),
});
export type MedicineListQuery = z.infer<typeof medicineListQuerySchema>;

export function medicineWhere(query: MedicineListQuery): Prisma.MedicineWhereInput {
  return {
    active: true,
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" as const } } : {}),
    ...(query.category ? { category: { equals: query.category, mode: "insensitive" as const } } : {}),
    ...(query.requiresPrescription !== undefined ? { requiresPrescription: query.requiresPrescription } : {}),
  };
}

export const MEDICINE_ORDER_BY = [
  { name: "asc" },
  { id: "asc" },
] satisfies Prisma.MedicineOrderByWithRelationInput[];

export const MEDICINE_SELECT = {
  id: true,
  name: true,
  genericName: true,
  strength: true,
  form: true,
  category: true,
  requiresPrescription: true,
  source: true,
} satisfies Prisma.MedicineSelect;

type MedicineRow = Prisma.MedicineGetPayload<{ select: typeof MEDICINE_SELECT }>;

export type MedicineDto = {
  id: string;
  name: string;
  genericName: string | null;
  strength: string | null;
  form: string | null;
  category: string | null;
  requiresPrescription: boolean;
  /** Where the row came from; 'demo' for the seeded demo data. */
  source: string;
};

export function toMedicineDto(row: MedicineRow): MedicineDto {
  return {
    id: row.id,
    name: row.name,
    genericName: row.genericName,
    strength: row.strength,
    form: row.form,
    category: row.category,
    requiresPrescription: row.requiresPrescription,
    source: row.source,
  };
}

/* --------------------------------- Prices --------------------------------- */

export const priceListQuerySchema = z.strictObject({ ...paginationShape });

/** Newest effective date first; pharmacy name and id make it deterministic. */
export const PRICE_ORDER_BY = [
  { effectiveFrom: "desc" },
  { pharmacyName: "asc" },
  { id: "asc" },
] satisfies Prisma.MedicinePriceOrderByWithRelationInput[];

export const PRICE_SELECT = {
  id: true,
  pharmacyName: true,
  amount: true,
  currency: true,
  effectiveFrom: true,
  source: true,
} satisfies Prisma.MedicinePriceSelect;

type PriceRow = Prisma.MedicinePriceGetPayload<{ select: typeof PRICE_SELECT }>;

export type MedicinePriceDto = {
  id: string;
  pharmacyName: string;
  /** Decimal(10,2) as a string, e.g. "24.99" (no floating-point rounding). */
  amount: string;
  currency: string;
  effectiveFrom: string;
  source: string;
};

export function toMedicinePriceDto(row: PriceRow): MedicinePriceDto {
  return {
    id: row.id,
    pharmacyName: row.pharmacyName,
    amount: row.amount.toFixed(2),
    currency: row.currency,
    effectiveFrom: row.effectiveFrom.toISOString().slice(0, 10),
    source: row.source,
  };
}
