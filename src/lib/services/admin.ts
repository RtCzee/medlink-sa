/**
 * Admin domain server services.
 * ponytail: no pagination/sorting; add when UI needs it.
 */
import { db } from "../db";
import type { UserRole } from "@prisma/client";

export async function getAdminStats() {
  const [totalUsers, pendingVerifications, totalHospitals] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { verified: false } }),
    db.hospital.count(),
  ]);
  return { totalUsers, pendingVerifications, totalHospitals };
}

export async function getUsers(role?: UserRole) {
  return db.user.findMany({
    where: role ? { role } : undefined,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      verified: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function verifyUser(id: string, verified: boolean) {
  return db.user.update({ where: { id }, data: { verified } });
}
