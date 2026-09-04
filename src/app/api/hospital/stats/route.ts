/**
 * Hospital stats API — GET
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getHospitalStats } from "@/lib/services/hospital";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "hospital") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  // ponytail: assume one hospital per user; pass user ID as hospitalId for now
  const data = await getHospitalStats(session.user.id);
  return NextResponse.json({ ok: true, data });
}
