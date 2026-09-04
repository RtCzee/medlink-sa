/**
 * Patient domain server services.
 */
import type { Prisma } from "@prisma/client";
import { db } from "../db";

export async function getAppointments(patientId: string) {
  return db.appointment.findMany({
    where: { patientId },
    include: { doctor: { select: { id: true, name: true } } },
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

export async function getRecords(patientId: string) {
  return db.healthRecord.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrders(patientId: string) {
  return db.order.findMany({
    where: { patientId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOrder(data: {
  patientId: string;
  pharmacistId?: string;
  items: Prisma.InputJsonValue[];
  total: number;
  deliveryAddress: string;
}) {
  return db.order.create({ data: { ...data, status: "pending" } });
}
