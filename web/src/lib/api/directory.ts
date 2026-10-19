// Public directory (facilities and practitioners): query schemas, Prisma selects and
// response DTOs.
//
// SECURITY: Prisma bypasses Row Level Security, so these explicit `select`s and the
// DTO mappers below ARE the data-exposure boundary. They mirror the database grants
// for the anon role: all facilities columns; practitioners only id, full_name,
// specialty, facility_id (+ timestamps). profile_id and license_number are
// RESTRICTED and must never be selected or returned.
import { FacilityType, type Prisma } from "@prisma/client";
import { z } from "zod";

/** Successful directory responses only; see withApi's cacheControl option. */
export const PUBLIC_CACHE_CONTROL = "public, max-age=60, s-maxage=300";

export const MAX_PAGE = 1000;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

const wholeNumber = (min: number, max: number) =>
  z
    .string()
    .regex(/^\d{1,6}$/, "Must be a whole number.")
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const nameSearch = z
  .string()
  .trim()
  .min(2, "Search text must be at least 2 characters.")
  .max(100, "Search text must be 100 characters or fewer.");

const paginationShape = {
  page: wholeNumber(1, MAX_PAGE).optional(),
  pageSize: wholeNumber(1, MAX_PAGE_SIZE).optional(),
};

export function pageWindow(query: { page?: number; pageSize?: number }) {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

/** Path-segment id (both detail routes). */
export const idParamsSchema = z.strictObject({ id: z.uuid("The id must be a UUID.") });

/** Detail routes take no query parameters. */
export const emptyQuerySchema = z.strictObject({});

/* ------------------------------- Facilities ------------------------------- */

export const facilityListQuerySchema = z.strictObject({
  ...paginationShape,
  type: z.enum(FacilityType).optional(),
  province: z.string().trim().min(1).max(50).optional(),
  city: z.string().trim().min(1).max(100).optional(),
  q: nameSearch.optional(),
});

export type FacilityListQuery = z.infer<typeof facilityListQuerySchema>;

export function facilityWhere(query: FacilityListQuery): Prisma.FacilityWhereInput {
  return {
    // type and province: exact match, served by facilities_type_idx / facilities_province_idx.
    ...(query.type ? { type: query.type } : {}),
    ...(query.province ? { province: query.province } : {}),
    // city and q: case-insensitive (ILIKE); no index, bounded by the other filters.
    ...(query.city ? { city: { equals: query.city, mode: "insensitive" as const } } : {}),
    ...(query.q ? { name: { contains: query.q, mode: "insensitive" as const } } : {}),
  };
}

export const FACILITY_ORDER_BY = [
  { name: "asc" },
  { id: "asc" },
] satisfies Prisma.FacilityOrderByWithRelationInput[];

export const FACILITY_SELECT = {
  id: true,
  name: true,
  type: true,
  province: true,
  city: true,
  address: true,
  phone: true,
  latitude: true,
  longitude: true,
} satisfies Prisma.FacilitySelect;

type FacilityRow = Prisma.FacilityGetPayload<{ select: typeof FACILITY_SELECT }>;

export type FacilityDto = {
  id: string;
  name: string;
  type: FacilityType;
  province: string;
  city: string;
  address: string | null;
  phone: string | null;
  /** Decimal(9,6) in the database; returned as a JSON number rounded to 6 dp. */
  latitude: number | null;
  longitude: number | null;
};

function coordinate(value: Prisma.Decimal | null): number | null {
  return value === null ? null : Number(value.toFixed(6));
}

/** Explicit mapping: anything not listed here is dropped, even if selected by mistake. */
export function toFacilityDto(row: FacilityRow): FacilityDto {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    province: row.province,
    city: row.city,
    address: row.address,
    phone: row.phone,
    latitude: coordinate(row.latitude),
    longitude: coordinate(row.longitude),
  };
}

/* ------------------------------ Practitioners ----------------------------- */

export const practitionerListQuerySchema = z.strictObject({
  ...paginationShape,
  facilityId: z.uuid("facilityId must be a UUID.").optional(),
  specialty: z.string().trim().min(1).max(100).optional(),
  q: nameSearch.optional(),
});

export type PractitionerListQuery = z.infer<typeof practitionerListQuerySchema>;

export function practitionerWhere(query: PractitionerListQuery): Prisma.PractitionerWhereInput {
  return {
    // facilityId: exact, served by practitioners_facility_id_idx.
    ...(query.facilityId ? { facilityId: query.facilityId } : {}),
    // specialty: case-insensitive equals (ILIKE), so practitioners_specialty_idx isn't used.
    ...(query.specialty
      ? { specialty: { equals: query.specialty, mode: "insensitive" as const } }
      : {}),
    ...(query.q ? { fullName: { contains: query.q, mode: "insensitive" as const } } : {}),
  };
}

export const PRACTITIONER_ORDER_BY = [
  { fullName: "asc" },
  { id: "asc" },
] satisfies Prisma.PractitionerOrderByWithRelationInput[];

/** NEVER add profileId, licenseNumber or the profile relation here. */
export const PRACTITIONER_SELECT = {
  id: true,
  fullName: true,
  specialty: true,
  facilityId: true,
  // Same query (SQL join), no N+1. Facility data is public.
  facility: { select: { id: true, name: true } },
} satisfies Prisma.PractitionerSelect;

/** Fields that must never leave the database through this API. */
export type RestrictedPractitionerField = "profileId" | "licenseNumber" | "profile";

// Compile-time guard: fails `tsc` if a restricted field is added to the select.
type AssertNever<T extends never> = T;
export type _PractitionerSelectHasNoRestrictedFields = AssertNever<
  Extract<keyof typeof PRACTITIONER_SELECT, RestrictedPractitionerField>
>;

type PractitionerRow = Prisma.PractitionerGetPayload<{ select: typeof PRACTITIONER_SELECT }>;

export type PractitionerDto = {
  id: string;
  fullName: string;
  specialty: string;
  facilityId: string | null;
  facility: { id: string; name: string } | null;
};

/** Explicit mapping: restricted fields are dropped even if a bad select returned them. */
export function toPractitionerDto(row: PractitionerRow): PractitionerDto {
  return {
    id: row.id,
    fullName: row.fullName,
    specialty: row.specialty,
    facilityId: row.facilityId,
    facility: row.facility ? { id: row.facility.id, name: row.facility.name } : null,
  };
}
