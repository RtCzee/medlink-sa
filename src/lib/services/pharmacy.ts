/**
 * Pharmacy domain server services.
 */
import type { Prisma, OrderStatus } from "@prisma/client";
import { db } from "../db";

export async function getMedicines() {
  return db.medicine.findMany({ orderBy: { name: "asc" } });
}

export async function createMedicine(data: Prisma.MedicineCreateInput) {
  return db.medicine.create({ data });
}

export async function getOrders(pharmacistId: string) {
  return db.order.findMany({
    where: { pharmacistId },
    include: { patient: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  return db.order.update({ where: { id }, data: { status } });
}

export async function getInventory(pharmacistId: string) {
  return db.medicinePrice.findMany({
    where: { pharmacistId },
    include: { medicine: true },
  });
}
