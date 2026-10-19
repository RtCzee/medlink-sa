// GET/PATCH /api/appointments/{id}: one of the signed-in patient's own appointments.
//
// SECURITY: Prisma BYPASSES Row Level Security. Every query filters on BOTH the id and
// patientId = session user, so another patient's appointment is indistinguishable
// from a missing one (404 APPOINTMENT_NOT_FOUND). Responses are no-store.
import type { Prisma } from "@prisma/client";
import {
  APPOINTMENT_SELECT,
  APPOINTMENT_STATE_SELECT,
  BOOKING_TX_OPTIONS,
  appointmentUpdateSchema,
  assertEditable,
  assertSlotFree,
  lockBookingSlots,
  runBooking,
  toAppointmentDto,
} from "@/lib/api/appointments";
import { assertSameOrigin, getApiUser } from "@/lib/api/auth";
import { emptyQuerySchema, idParamsSchema } from "@/lib/api/directory";
import { appointmentNotEditable, appointmentNotFound } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { parseJson, parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApiParams<{ id: string }>(
  "GET /api/appointments/[id]",
  async (request, { params }) => {
    const user = await getApiUser(request);
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);

    const row = await db.appointment.findFirst({
      where: { id, patientId: user.id },
      select: APPOINTMENT_SELECT,
    });
    if (!row) throw appointmentNotFound();
    return json(toAppointmentDto(row));
  }
);

export const PATCH = withApiParams<{ id: string }>(
  "PATCH /api/appointments/[id]",
  async (request, { params }) => {
    const user = await getApiUser(request);
    assertSameOrigin(request, user);
    enforceRateLimit(`appointments:${user.id}`);
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);
    // Only reason and scheduledAt. status, practitioner, facility, patient and
    // timestamps are rejected by the strict schema (400).
    const changes = await parseJson(request, appointmentUpdateSchema);
    const owned = { id, patientId: user.id };

    const row = await runBooking(() =>
      db.$transaction(async (tx) => {
        let current = await tx.appointment.findFirst({
          where: owned,
          select: APPOINTMENT_STATE_SELECT,
        });
        if (!current) throw appointmentNotFound();
        assertEditable(current, changes);

        const reschedule =
          changes.scheduledAt !== undefined &&
          changes.scheduledAt.getTime() !== current.scheduledAt.getTime();

        if (reschedule) {
          // Same lock order as booking (practitioner, then patient), then re-read and
          // re-check under the lock.
          await lockBookingSlots(tx, {
            practitionerId: current.practitionerId,
            patientId: user.id,
          });
          current = await tx.appointment.findFirst({
            where: owned,
            select: APPOINTMENT_STATE_SELECT,
          });
          if (!current) throw appointmentNotFound();
          assertEditable(current, changes);
          await assertSlotFree(tx, {
            practitionerId: current.practitionerId!, // non-null: checked by assertEditable
            patientId: user.id,
            scheduledAt: changes.scheduledAt!,
            excludeId: id,
          });
        }

        const data: Prisma.AppointmentUpdateManyMutationInput = {};
        if (changes.reason !== undefined) data.reason = changes.reason;
        if (reschedule) data.scheduledAt = changes.scheduledAt;

        if (Object.keys(data).length > 0) {
          // Guarded write: only applies if the appointment is still exactly in the
          // state that was checked (no concurrent cancel/reschedule in between).
          const { count } = await tx.appointment.updateMany({
            where: { ...owned, status: current.status, scheduledAt: current.scheduledAt },
            data,
          });
          if (count !== 1) {
            throw appointmentNotEditable(
              "This appointment changed while you were editing it. Reload and try again."
            );
          }
        }

        const updated = await tx.appointment.findFirst({
          where: owned,
          select: APPOINTMENT_SELECT,
        });
        if (!updated) throw appointmentNotFound();
        return updated;
      }, BOOKING_TX_OPTIONS)
    );

    return json(toAppointmentDto(row));
  }
);
