// POST /api/appointments/{id}/cancel: the signed-in patient cancels their own
// appointment.
//
// Transitions: requested|confirmed (still upcoming) -> cancelled.
//   - Already cancelled: 200 with the appointment unchanged (safe to retry).
//   - completed, or the appointment time has passed: 409 APPOINTMENT_NOT_CANCELLABLE.
// Patients can never set any other status. A dedicated action (instead of PATCH
// {status}) keeps status out of the editable fields entirely.
//
// SECURITY: scoped to patientId = session user (another patient's id -> 404).
import { AppointmentStatus } from "@prisma/client";
import {
  ACTIVE_STATUSES,
  APPOINTMENT_SELECT,
  cancelBodySchema,
  isUpcoming,
  toAppointmentDto,
} from "@/lib/api/appointments";
import { assertSameOrigin, getApiUser } from "@/lib/api/auth";
import { emptyQuerySchema, idParamsSchema } from "@/lib/api/directory";
import { appointmentNotCancellable, appointmentNotFound } from "@/lib/api/errors";
import { json, withApiParams } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { parseJson, parseParams, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** No body, or an empty JSON object. Anything else (e.g. {"status": ...}) is a 400. */
async function rejectBodyFields(request: Request) {
  const text = await request.clone().text();
  if (text.length === 0) return;
  await parseJson(request, cancelBodySchema);
}

export const POST = withApiParams<{ id: string }>(
  "POST /api/appointments/[id]/cancel",
  async (request, { params }) => {
    const user = await getApiUser(request);
    assertSameOrigin(request, user);
    enforceRateLimit(`appointments:${user.id}`);
    const { id } = parseParams(params, idParamsSchema);
    parseQuery(request, emptyQuerySchema);
    await rejectBodyFields(request);
    const owned = { id, patientId: user.id };

    const current = await db.appointment.findFirst({ where: owned, select: APPOINTMENT_SELECT });
    if (!current) throw appointmentNotFound();
    if (current.status === AppointmentStatus.cancelled) return json(toAppointmentDto(current));
    if (current.status === AppointmentStatus.completed) {
      throw appointmentNotCancellable("A completed appointment can't be cancelled.");
    }
    if (!isUpcoming(current)) {
      throw appointmentNotCancellable("This appointment's time has passed, so it can't be cancelled.");
    }

    // Guarded transition: only an active appointment becomes cancelled.
    const { count } = await db.appointment.updateMany({
      where: { ...owned, status: { in: [...ACTIVE_STATUSES] } },
      data: { status: AppointmentStatus.cancelled },
    });

    const after = await db.appointment.findFirst({ where: owned, select: APPOINTMENT_SELECT });
    if (!after) throw appointmentNotFound();
    if (count !== 1 && after.status !== AppointmentStatus.cancelled) {
      // Changed concurrently (e.g. completed) between the read and the write.
      throw appointmentNotCancellable("This appointment can no longer be cancelled.");
    }
    return json(toAppointmentDto(after));
  }
);
