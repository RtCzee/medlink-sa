/**
 * Pharmacy orders API — GET, PATCH
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrders, updateOrderStatus } from "@/lib/services/pharmacy";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "pharmacy") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getOrders(session.user.id);
  return NextResponse.json({ ok: true, data });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "pharmacy") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id, status } = await req.json();
  if (!id || !status) {
    return NextResponse.json({ ok: false, error: "Missing id or status" }, { status: 400 });
  }
  const data = await updateOrderStatus(id, status);
  return NextResponse.json({ ok: true, data });
}
