/**
 * Explore/directory domain server services.
 */
import { db } from "../db";

export async function searchHospitals(query?: string) {
  if (!query) return db.hospital.findMany({ orderBy: { name: "asc" } });
  return db.hospital.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { province: { contains: query, mode: "insensitive" } },
      ],
    },
    orderBy: { name: "asc" },
  });
}

export async function searchDoctors(query?: string) {
  const users = await db.user.findMany({
    where: { role: "doctor" },
    include: { doctorProfile: true },
  });
  if (!query) return users;
  const q = query.toLowerCase();
  return users.filter(
    (u) =>
      u.name?.toLowerCase().includes(q) ||
      u.doctorProfile?.specialty?.toLowerCase().includes(q) ||
      u.doctorProfile?.facility?.toLowerCase().includes(q)
  );
}
