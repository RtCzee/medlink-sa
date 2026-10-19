// Patient appointments: request schemas, scheduling rules, Prisma selects, response
// DTO, status transitions and the booking lock.
//
// SECURITY: Prisma bypasses Row Level Security. Every query in the appointment routes
// is scoped to the verified session user (`patientId: user.id`), and the explicit
// `select` + DTO below are the data-exposure boundary.
//
// TIME: `scheduled_at` is timestamptz. Clients send ISO 8601 instants WITH an offset
// (e.g. "2026-10-20T09:30:00+02:00" for SAST, or "...Z"); responses are always UTC
// ("...Z"). South Africa (Africa/Johannesburg) is UTC+2 all year (no DST). All
// comparisons ("in the future", conflicts, filters) are done on UTC instants.
import { AppointmentStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import { paginationShape } from "./directory";
import { ApiError, appointmentNotEditable } from "./errors";

/** Latest bookable time, relative to now. An API sanity bound, not a clinic rule. */
export const MAX_BOOKING_HORIZON_DAYS = 365;

/** Statuses that hold a practitioner's time slot (used for conflict checks). */
export const ACTIVE_STATUSES = [AppointmentStatus.requested, AppointmentStatus.confirmed] as const;

/* --------------------------------- Inputs --------------------------------- */

const instant = (label: string) =>
  z.iso
    .datetime({
      offset: true,
      error: `${label} must be an ISO 8601 date-time with a UTC offset, e.g. 2026-10-20T09:30:00+02:00.`,
    })
    .transform((value) => new Date(value));

/**
 * Appointment start time: a whole minute (seconds and milliseconds zero), strictly in
 * the future and at most MAX_BOOKING_HORIZON_DAYS ahead. Checked against the clock at
 * request time.
 */
export const scheduledAtSchema = instant("scheduledAt").superRefine((date, ctx) => {
  if (date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) {
    ctx.addIssue({ code: "custom", message: "scheduledAt must be on a whole minute (seconds = 00)." });
    return;
  }
  const now = Date.now();
  if (date.getTime() <= now) {
    ctx.addIssue({ code: "custom", message: "scheduledAt must be in the future." });
  } else if (date.getTime() > now + MAX_BOOKING_HORIZON_DAYS * 86_400_000) {
    ctx.addIssue({
      code: "custom",
      message: `scheduledAt must be within ${MAX_BOOKING_HORIZON_DAYS} days.`,
    });
  }
});

const reasonSchema = z
  .string()
  .trim()
  .min(1, "reason must not be empty; send null to clear it.")
  .max(500, "reason must be 500 characters or fewer.");

/**
 * POST /api/appointments. Strict: patientId, status, practitionerName, facilityName,
 * specialty, timestamps or any other field is rejected (400).
 */
export const appointmentCreateSchema = z.strictObject({
  practitionerId: z.uuid("practitionerId must be a UUID."),
  facilityId: z.uuid("facilityId must be a UUID.").optional(),
  scheduledAt: scheduledAtSchema,
  reason: reasonSchema.nullable().optional(),
});
export type AppointmentCreate = z.infer<typeof appointmentCreateSchema>;

/** PATCH /api/appointments/{id}: only the reason and (while requested) the time. */
export const appointmentUpdateSchema = z
  .strictObject({
    scheduledAt: scheduledAtSchema.optional(),
    reason: reasonSchema.nullable().optional(),
  })
  .refine((value) => value.scheduledAt !== undefined || value.reason !== undefined, {
    message: "Provide at least one of: scheduledAt, reason.",
  });
export type AppointmentUpdate = z.infer<typeof appointmentUpdateSchema>;

/** GET /api/appointments. `from` is inclusive, `to` exclusive (UTC instants). */
export const appointmentListQuerySchema = z
  .strictObject({
    ...paginationShape,
    status: z.enum(AppointmentStatus).optional(),
    from: instant("from").optional(),
    to: instant("to").optional(),
  })
  .superRefine((query, ctx) => {
    if (query.from && query.to && query.from.getTime() >= query.to.getTime()) {
      ctx.addIssue({ code: "custom", path: ["to"], message: "to must be after from." });
    }
  });
export type AppointmentListQuery = z.infer<typeof appointmentListQuerySchema>;

/** POST /api/appointments/{id}/cancel takes no fields (an empty body or {}). */
export const cancelBodySchema = z.strictObject({});

export function appointmentWhere(
  patientId: string,
  query: AppointmentListQuery
): Prisma.AppointmentWhereInput {
  return {
    patientId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.from || query.to
      ? {
          scheduledAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lt: query.to } : {}),
          },
        }
      : {}),
  };
}

/* -------------------------------- Outputs --------------------------------- */

// Deterministic: by time, then id (index appointments(patient_id, scheduled_at)).
export const APPOINTMENT_ORDER_BY = [
  { scheduledAt: "asc" },
  { id: "asc" },
] satisfies Prisma.AppointmentOrderByWithRelationInput[];

export const APPOINTMENT_SELECT = {
  id: true,
  practitionerId: true,
  practitionerName: true,
  specialty: true,
  facilityId: true,
  facilityName: true,
  scheduledAt: true,
  reason: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.AppointmentSelect;

type AppointmentRow = Prisma.AppointmentGetPayload<{ select: typeof APPOINTMENT_SELECT }>;

export type AppointmentDto = {
  id: string;
  practitionerId: string | null;
  practitionerName: string;
  specialty: string;
  facilityId: string | null;
  facilityName: string;
  scheduledAt: string;
  reason: string | null;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt: string;
};

/** Explicit mapping: fields not listed here are never returned. Times are UTC ISO. */
export function toAppointmentDto(row: AppointmentRow): AppointmentDto {
  return {
    id: row.id,
    practitionerId: row.practitionerId,
    practitionerName: row.practitionerName,
    specialty: row.specialty,
    facilityId: row.facilityId,
    facilityName: row.facilityName,
    scheduledAt: row.scheduledAt.toISOString(),
    reason: row.reason,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Practitioner fields read when BOOKING (server-side only). profileId is used solely
 * to stop a practitioner booking themselves and is never returned; licenseNumber is
 * never read.
 */
export const BOOKING_PRACTITIONER_SELECT = {
  id: true,
  fullName: true,
  specialty: true,
  facilityId: true,
  profileId: true,
  facility: { select: { id: true, name: true } },
} satisfies Prisma.PractitionerSelect;

/** Fields needed to decide whether an appointment may change. */
export const APPOINTMENT_STATE_SELECT = {
  id: true,
  status: true,
  scheduledAt: true,
  practitionerId: true,
} satisfies Prisma.AppointmentSelect;

/* --------------------------- Status transitions ---------------------------- */
//
// Patients can only cancel. requested|confirmed -> cancelled, while the appointment
// is still upcoming. cancelled -> cancel again is a no-op (200, unchanged).
// completed, or an appointment whose time has passed, cannot be cancelled (409).
// Confirming and completing are staff actions that this API does not implement.

type AppointmentState = { status: AppointmentStatus; scheduledAt: Date };

export function isUpcoming(appointment: AppointmentState, now = Date.now()): boolean {
  return appointment.scheduledAt.getTime() > now;
}

/** Throws 409 unless the patient may still edit this appointment (reason/time). */
export function assertEditable(
  appointment: AppointmentState & { practitionerId: string | null },
  changes: AppointmentUpdate
): void {
  if (
    !(ACTIVE_STATUSES as readonly AppointmentStatus[]).includes(appointment.status) ||
    !isUpcoming(appointment)
  ) {
    throw appointmentNotEditable(
      "Only upcoming requested or confirmed appointments can be changed."
    );
  }
  if (changes.scheduledAt !== undefined) {
    if (appointment.status !== AppointmentStatus.requested) {
      throw appointmentNotEditable(
        "A confirmed appointment can't be rescheduled. Cancel it and request a new one."
      );
    }
    if (appointment.practitionerId === null) {
      throw appointmentNotEditable(
        "This appointment's practitioner is no longer listed, so it can't be rescheduled."
      );
    }
  }
}

/* ------------------------------ Booking lock ------------------------------- */

type LockClient = Pick<Prisma.TransactionClient, "$executeRaw">;

/**
 * Serialises bookings per practitioner and per patient for the rest of the current
 * transaction (pg_advisory_xact_lock; released on commit/rollback, so it is safe with
 * the transaction-mode connection pooler). Always practitioner first, then patient,
 * so two booking transactions can never wait on each other in a cycle.
 *
 * This only protects writers that take the same locks, i.e. this API. The Data API
 * cannot write appointments (SELECT-only grant); direct database writes are not
 * covered.
 */
export async function lockBookingSlots(
  tx: LockClient,
  keys: { practitionerId: string | null; patientId: string }
): Promise<void> {
  if (keys.practitionerId) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`appointments:practitioner:${keys.practitionerId}`}, 0))`;
  }
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`appointments:patient:${keys.patientId}`}, 0))`;
}

/**
 * Throws 409 if the practitioner or the patient already has an active appointment
 * starting at exactly `scheduledAt`. The schema has no duration, so only identical
 * start times are detected; overlapping appointments with different start times are
 * not. Call inside the transaction, after lockBookingSlots.
 */
export async function assertSlotFree(
  tx: Pick<Prisma.TransactionClient, "appointment">,
  slot: { practitionerId: string; patientId: string; scheduledAt: Date; excludeId?: string }
): Promise<void> {
  const clash = await tx.appointment.findFirst({
    where: {
      scheduledAt: slot.scheduledAt,
      status: { in: [...ACTIVE_STATUSES] },
      OR: [{ practitionerId: slot.practitionerId }, { patientId: slot.patientId }],
      ...(slot.excludeId ? { NOT: { id: slot.excludeId } } : {}),
    },
    select: { patientId: true },
  });
  if (!clash) return;
  throw new ApiError(
    409,
    "APPOINTMENT_CONFLICT",
    clash.patientId === slot.patientId
      ? "You already have an appointment at that time."
      : "That time is not available with this practitioner. Choose another time.",
    { details: [{ path: "scheduledAt", code: "conflict", message: "Time slot unavailable." }] }
  );
}

/** Interactive-transaction failures that mean "busy, try again", not a bug. */
export function toBusyError(error: unknown): ApiError | null {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === "P2028" || error.code === "P2034")
  ) {
    return new ApiError(
      503,
      "SERVICE_UNAVAILABLE",
      "The booking service is busy. Please try again shortly."
    );
  }
  return null;
}

/** Runs a booking write, mapping lock/transaction timeouts to a retryable 503. */
export async function runBooking<T>(write: () => Promise<T>): Promise<T> {
  try {
    return await write();
  } catch (error) {
    throw toBusyError(error) ?? error;
  }
}

/** Interactive transaction options for booking writes (lock waits are bounded). */
export const BOOKING_TX_OPTIONS = { maxWait: 5_000, timeout: 10_000 } as const;
