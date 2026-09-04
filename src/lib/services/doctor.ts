/**
 * Doctor domain server services.
 */
import { db } from "../db";

export async function getAppointments(doctorId: string) {
  return db.appointment.findMany({
    where: { doctorId },
    include: { patient: { select: { id: true, name: true, email: true } } },
    orderBy: { datetime: "desc" },
  });
}

export async function createAppointment(data: {
  patientId: string;
  doctorId: string;
  hospitalId: string;
  datetime: Date;
  type: string;
  notes?: string;
}) {
  return db.appointment.create({
    data: { ...data, status: "scheduled", type: data.type as "in_person" | "teleconsultation" },
  });
}

export async function getPatients(doctorId: string) {
  const appointments = await db.appointment.findMany({
    where: { doctorId },
    select: { patientId: true },
    distinct: ["patientId"],
  });
  const ids = appointments.map((a) => a.patientId);
  return db.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, email: true, role: true },
  });
}

export async function getRecords(doctorId: string) {
  return db.healthRecord.findMany({
    where: { doctorId },
    include: { patient: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRecord(data: {
  patientId: string;
  doctorId: string;
  type: string;
  title: string;
  content: string;
}) {
  return db.healthRecord.create({ data: data as any });
}
