/**
 * Explore directory search API — GET
 */
import { NextResponse } from "next/server";
import { searchHospitals, searchDoctors } from "@/lib/services/explore";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const [hospitals, doctors] = await Promise.all([
    searchHospitals(q),
    searchDoctors(q),
  ]);
  return NextResponse.json({ ok: true, data: { hospitals, doctors } });
}
