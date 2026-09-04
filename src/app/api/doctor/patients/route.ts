/**
 * Doctor patients API — GET
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPatients } from "@/lib/services/doctor";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "doctor") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getPatients(session.user.id);
  return NextResponse.json({ ok: true, data });
}
