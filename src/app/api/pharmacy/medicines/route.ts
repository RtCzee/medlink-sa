/**
 * Pharmacy medicines API — GET, POST
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMedicines, createMedicine } from "@/lib/services/pharmacy";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "pharmacy") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getMedicines();
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "pharmacy") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const data = await createMedicine(body);
  return NextResponse.json({ ok: true, data }, { status: 201 });
}
