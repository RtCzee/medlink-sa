/**
 * Patient health records API — GET
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecords } from "@/lib/services/patient";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "patient") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getRecords(session.user.id);
  return NextResponse.json({ ok: true, data });
}
