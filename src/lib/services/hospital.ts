/**
 * Hospital domain server services.
 */
import { db } from "../db";

export async function getHospitalStats(hospitalId: string) {
  const [staffCount, wardCount, equipmentCount] = await Promise.all([
    db.staffMember.count({ where: { hospitalId } }),
    db.ward.count({ where: { hospitalId } }),
    db.equipment.count({ where: { hospitalId } }),
  ]);
  return { staffCount, wardCount, equipmentCount };
}

export async function getStaff(hospitalId: string) {
  return db.staffMember.findMany({
    where: { hospitalId },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
}

export async function addStaff(data: {
  userId: string;
  hospitalId: string;
  position: string;
  shift?: string;
}) {
  return db.staffMember.create({ data });
}

export async function getEquipment(hospitalId: string) {
  return db.equipment.findMany({ where: { hospitalId }, orderBy: { name: "asc" } });
}

export async function getWards(hospitalId: string) {
  return db.ward.findMany({ where: { hospitalId }, orderBy: { name: "asc" } });
}

export async function addWard(data: {
  hospitalId: string;
  name: string;
  capacity: number;
  department: string;
}) {
  return db.ward.create({ data });
}
