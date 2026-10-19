// GET/POST /api/appointments: the signed-in patient's own appointments.
//
// SECURITY: Prisma BYPASSES Row Level Security. Every query is scoped to the verified
// session user (patientId = user.id); the patient is never taken from the request.
// Responses are private (Cache-Control: no-store, set by withApi).
import { Prisma } from "@prisma/client";
import {
  APPOINTMENT_ORDER_BY,
  APPOINTMENT_SELECT,
  BOOKING_PRACTITIONER_SELECT,
  BOOKING_TX_OPTIONS,
  appointmentCreateSchema,
  appointmentListQuerySchema,
  appointmentWhere,
  assertSlotFree,
  lockBookingSlots,
  runBooking,
  toAppointmentDto,
} from "@/lib/api/appointments";
import { assertSameOrigin, getApiUser } from "@/lib/api/auth";
import { emptyQuerySchema, pageWindow } from "@/lib/api/directory";
import {
  ApiError,
  facilityNotFound,
  practitionerNotFound,
  profileNotFound,
} from "@/lib/api/errors";
import { json, jsonPage, withApi } from "@/lib/api/handler";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { parseJson, parseQuery } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const GET = withApi("GET /api/appointments", async (request) => {
  const user = await getApiUser(request);
  const query = parseQuery(request, appointmentListQuerySchema);
  const { page, pageSize, skip, take } = pageWindow(query);
  const where = appointmentWhere(user.id, query);

  const [rows, total] = await db.$transaction([
    db.appointment.findMany({
      where,
      select: APPOINTMENT_SELECT,
      orderBy: APPOINTMENT_ORDER_BY,
      skip,
      take,
    }),
    db.appointment.count({ where }),
  ]);

  return jsonPage(rows.map(toAppointmentDto), { page, pageSize, total });
});

function invalidField(path: string, message: string) {
  return new ApiError(400, "VALIDATION_FAILED", "The request body is invalid.", {
    details: [{ path, code: "invalid_reference", message }],
  });
}

export const POST = withApi("POST /api/appointments", async (request) => {
  const user = await getApiUser(request);
  assertSameOrigin(request, user);
  enforceRateLimit(`appointments:${user.id}`);
  parseQuery(request, emptyQuerySchema);
  const input = await parseJson(request, appointmentCreateSchema);

  const created = await runBooking(() =>
    db.$transaction(async (tx) => {
      // Lock first, then read and check, so two concurrent requests for the same
      // practitioner (or the same patient) are checked one after the other.
      await lockBookingSlots(tx, { practitionerId: input.practitionerId, patientId: user.id });

      const practitioner = await tx.practitioner.findUnique({
        where: { id: input.practitionerId },
        select: BOOKING_PRACTITIONER_SELECT,
      });
      if (!practitioner) throw practitionerNotFound();
      if (practitioner.profileId !== null && practitioner.profileId === user.id) {
        throw invalidField("practitionerId", "You can't book an appointment with yourself.");
      }
      if (!practitioner.facility) {
        throw invalidField(
          "practitionerId",
          "This practitioner isn't linked to a facility, so they can't be booked yet."
        );
      }
      if (input.facilityId !== undefined && input.facilityId !== practitioner.facility.id) {
        const facility = await tx.facility.findUnique({
          where: { id: input.facilityId },
          select: { id: true },
        });
        if (!facility) throw facilityNotFound();
        throw invalidField("facilityId", "The practitioner doesn't practise at that facility.");
      }

      await assertSlotFree(tx, {
        practitionerId: practitioner.id,
        patientId: user.id,
        scheduledAt: input.scheduledAt,
      });

      try {
        return await tx.appointment.create({
          data: {
            patientId: user.id,
            practitionerId: practitioner.id,
            // Copied so the history survives if the directory entry changes or is removed.
            practitionerName: practitioner.fullName,
            specialty: practitioner.specialty,
            facilityId: practitioner.facility.id,
            facilityName: practitioner.facility.name,
            scheduledAt: input.scheduledAt,
            reason: input.reason ?? null,
            // status is NOT set: the database default ("requested") applies.
          },
          select: APPOINTMENT_SELECT,
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
          // The patient's profile row is missing (signup trigger didn't run).
          throw profileNotFound();
        }
        throw error;
      }
    }, BOOKING_TX_OPTIONS)
  );

  return json(toAppointmentDto(created), 201);
});
