// Idempotent DEMO seed: 2 fictional facilities and 3 fictional practitioners for
// MedLink-SA demos. Run from web/ with `npm run db:seed:demo` (reads web/.env).
//
// Safety:
// - Refuses to run unless DATABASE_URL points at the MedLink-SA project
//   (ref rjcuiadcsvlxfbplcihl). The URL itself is never printed.
// - Inserts only rows with these fixed ids and skips any that already exist
//   (createMany + skipDuplicates). It never updates or deletes anything.
// - Everything is fictional: names start with "DEMO -", phones and addresses are
//   made up, licence numbers are "DEMO-000x" and no practitioner has a login
//   account (profile_id stays null).

import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

export const MEDLINK_PROJECT_REF = "rjcuiadcsvlxfbplcihl";

export const DEMO_FACILITIES = [
  {
    id: "0d3e0000-0000-4000-8000-00000000f001",
    name: "DEMO - Soweto Community Clinic",
    type: "clinic",
    province: "Gauteng",
    city: "Soweto",
    address: "1 Demo Street, Orlando West, Soweto, 1804 (fictional)",
    phone: "+27 11 000 0001",
    latitude: "-26.248500",
    longitude: "27.854000",
  },
  {
    id: "0d3e0000-0000-4000-8000-00000000f002",
    name: "DEMO - Johannesburg Family Practice",
    type: "clinic",
    province: "Gauteng",
    city: "Johannesburg",
    address: "2 Demo Avenue, Braamfontein, Johannesburg, 2001 (fictional)",
    phone: "+27 11 000 0002",
    latitude: "-26.192900",
    longitude: "28.034400",
  },
];

export const DEMO_PRACTITIONERS = [
  {
    id: "0d3e0000-0000-4000-8000-00000000a001",
    fullName: "DEMO - Dr Thandi Mokoena",
    specialty: "General Practitioner",
    facilityId: DEMO_FACILITIES[0].id,
    licenseNumber: "DEMO-0001",
    profileId: null,
  },
  {
    id: "0d3e0000-0000-4000-8000-00000000a002",
    fullName: "DEMO - Dr Pieter Naidoo",
    specialty: "Family Medicine",
    facilityId: DEMO_FACILITIES[1].id,
    licenseNumber: "DEMO-0002",
    profileId: null,
  },
  {
    id: "0d3e0000-0000-4000-8000-00000000a003",
    fullName: "DEMO - Dr Lerato Dube",
    specialty: "Paediatrics",
    facilityId: DEMO_FACILITIES[0].id,
    licenseNumber: "DEMO-0003",
    profileId: null,
  },
];

/** Throws unless the connection string targets the MedLink-SA project. Never echoes the URL. */
export function assertMedLinkTarget(url) {
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("DATABASE_URL is not set. Refusing to seed.");
  }
  let host;
  let user;
  try {
    const parsed = new URL(url);
    host = parsed.hostname;
    user = decodeURIComponent(parsed.username);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL. Refusing to seed.");
  }
  // Direct host: db.<ref>.supabase.co. Pooler: user postgres.<ref> on *.pooler.supabase.com.
  const direct = host === `db.${MEDLINK_PROJECT_REF}.supabase.co`;
  const pooler = user === `postgres.${MEDLINK_PROJECT_REF}` && host.endsWith(".pooler.supabase.com");
  if (!direct && !pooler) {
    throw new Error("DATABASE_URL does not point at the MedLink-SA project. Refusing to seed.");
  }
}

/** Inserts the demo rows that are missing; returns how many were inserted and how many now exist. */
export async function seedDemo(db) {
  const facilities = await db.facility.createMany({ data: DEMO_FACILITIES, skipDuplicates: true });
  const practitioners = await db.practitioner.createMany({ data: DEMO_PRACTITIONERS, skipDuplicates: true });
  const present = {
    facilities: await db.facility.count({ where: { id: { in: DEMO_FACILITIES.map((f) => f.id) } } }),
    practitioners: await db.practitioner.count({ where: { id: { in: DEMO_PRACTITIONERS.map((p) => p.id) } } }),
  };
  return { inserted: { facilities: facilities.count, practitioners: practitioners.count }, present };
}

async function main() {
  assertMedLinkTarget(process.env.DATABASE_URL);
  const require = createRequire(import.meta.url);
  const { PrismaClient } = require("@prisma/client");
  const db = new PrismaClient();
  try {
    const result = await seedDemo(db);
    console.log(
      `Demo seed (MedLink-SA): inserted ${result.inserted.facilities} facilities and ${result.inserted.practitioners} practitioners; ` +
        `demo rows present: ${result.present.facilities}/${DEMO_FACILITIES.length} facilities, ` +
        `${result.present.practitioners}/${DEMO_PRACTITIONERS.length} practitioners.`
    );
  } finally {
    await db.$disconnect();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : "Demo seed failed.");
    process.exitCode = 1;
  });
}
