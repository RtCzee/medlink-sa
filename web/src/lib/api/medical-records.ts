// Patient medical records: request schemas, Prisma select and response DTO.
//
// Records are PATIENT-AUTHORED (the Android Records screen; see the supabase_auth_rls
// migration header): a patient adds their own entries. There are no clinician-authored
// records, author columns or file/storage references in the schema. `provider` is
// free text typed by the patient, not a verified practitioner link, and grants nothing.
//
// SECURITY: Prisma bypasses Row Level Security. Every query in the medical-record
// routes is scoped to the verified session user (`patientId: user.id`); this select and
// DTO are the exposure boundary (patientId is never returned).
//
// DATES: `recorded_on` is a calendar DATE (no time or zone): "YYYY-MM-DD" in and out.
// "Today" for the not-in-the-future rule is the date in Africa/Johannesburg (UTC+2).
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { paginationShape } from "./directory";

export const EARLIEST_RECORD_DATE = "1900-01-01";

/** Today's calendar date in South Africa, as YYYY-MM-DD. */
export function todayInJohannesburg(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Johannesburg",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** YYYY-MM-DD (a real calendar date) -> Date at UTC midnight, as Prisma expects for @db.Date. */
const calendarDate = (label: string) =>
  z.iso
    .date({ error: `${label} must be a date in the format YYYY-MM-DD.` })
    .refine((value) => value >= EARLIEST_RECORD_DATE, {
      message: `${label} must be on or after ${EARLIEST_RECORD_DATE}.`,
    });

const toUtcMidnight = (value: string) => new Date(`${value}T00:00:00.000Z`);

const text = (label: string, max: number) =>
  z
    .string()
    .trim()
    .min(1, `${label} must not be empty.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

/**
 * POST /api/medical-records. Strict: patientId, id, timestamps and anything else are
 * rejected (400). The patient always comes from the session.
 */
export const medicalRecordCreateSchema = z.strictObject({
  title: text("title", 120),
  category: text("category", 80),
  provider: text("provider", 150).nullable().optional(),
  recordedOn: calendarDate("recordedOn")
    .refine((value) => value <= todayInJohannesburg(), {
      message: "recordedOn can't be in the future (South African date).",
    })
    .transform(toUtcMidnight),
  notes: text("notes", 2000).nullable().optional(),
});
export type MedicalRecordCreate = z.infer<typeof medicalRecordCreateSchema>;

/** GET /api/medical-records. `from` and `to` are inclusive calendar dates. */
export const medicalRecordListQuerySchema = z
  .strictObject({
    ...paginationShape,
    category: text("category", 80).optional(),
    from: calendarDate("from").optional(),
    to: calendarDate("to").optional(),
  })
  .superRefine((query, ctx) => {
    if (query.from && query.to && query.from > query.to) {
      ctx.addIssue({ code: "custom", path: ["to"], message: "to must be on or after from." });
    }
  });
export type MedicalRecordListQuery = z.infer<typeof medicalRecordListQuerySchema>;

export function medicalRecordWhere(
  patientId: string,
  query: MedicalRecordListQuery
): Prisma.MedicalRecordWhereInput {
  return {
    patientId,
    ...(query.category ? { category: { equals: query.category, mode: "insensitive" } } : {}),
    ...(query.from || query.to
      ? {
          recordedOn: {
            ...(query.from ? { gte: toUtcMidnight(query.from) } : {}),
            ...(query.to ? { lte: toUtcMidnight(query.to) } : {}),
          },
        }
      : {}),
  };
}

// Newest first, like the Android Records screen; createdAt and id make it deterministic.
// Index: medical_records(patient_id, recorded_on).
export const MEDICAL_RECORD_ORDER_BY = [
  { recordedOn: "desc" },
  { createdAt: "desc" },
  { id: "desc" },
] satisfies Prisma.MedicalRecordOrderByWithRelationInput[];

export const MEDICAL_RECORD_SELECT = {
  id: true,
  title: true,
  category: true,
  provider: true,
  recordedOn: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MedicalRecordSelect;

type MedicalRecordRow = Prisma.MedicalRecordGetPayload<{ select: typeof MEDICAL_RECORD_SELECT }>;

export type MedicalRecordDto = {
  id: string;
  title: string;
  category: string;
  provider: string | null;
  recordedOn: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Explicit mapping: fields not listed here are never returned. */
export function toMedicalRecordDto(row: MedicalRecordRow): MedicalRecordDto {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    provider: row.provider,
    recordedOn: row.recordedOn.toISOString().slice(0, 10),
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
