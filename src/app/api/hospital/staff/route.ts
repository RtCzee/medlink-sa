/**
 * Hospital staff API — GET, POST
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getStaff, addStaff } from "@/lib/services/hospital";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "hospital") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getStaff(session.user.id);
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "hospital") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data = await addStaff({ ...body, hospitalId: session.user.id });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
