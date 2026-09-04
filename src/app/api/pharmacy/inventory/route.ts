/**
 * Pharmacy inventory API — GET
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getInventory } from "@/lib/services/pharmacy";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "pharmacy") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const data = await getInventory(session.user.id);
  return NextResponse.json({ ok: true, data });
}
