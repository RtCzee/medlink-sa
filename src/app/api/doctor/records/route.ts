/**
 * Doctor health records API — GET, POST
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRecords, createRecord } from "@/lib/services/doctor";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "doctor") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getRecords(session.user.id);
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "doctor") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data = await createRecord({ ...body, doctorId: session.user.id });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
