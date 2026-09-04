/**
 * Hospital wards API — GET, POST
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getWards, addWard } from "@/lib/services/hospital";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "hospital") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getWards(session.user.id);
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "hospital") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data = await addWard({ ...body, hospitalId: session.user.id });
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
