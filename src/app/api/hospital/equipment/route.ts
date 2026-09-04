/**
 * Hospital equipment API — GET, POST
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEquipment } from "@/lib/services/hospital";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "hospital") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getEquipment(session.user.id);
  return NextResponse.json({ ok: true, data });
}
