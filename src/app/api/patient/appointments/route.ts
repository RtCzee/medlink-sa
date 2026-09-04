/**
 * Patient appointments API — GET, POST
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAppointments, createAppointment } from "@/lib/services/patient";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "patient") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getAppointments(session.user.id);
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "patient") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data = await createAppointment({ ...body, patientId: session.user.id });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
