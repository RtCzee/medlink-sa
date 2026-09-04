/**
 * Admin users API — GET (list), PATCH (verify/reject)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUsers, verifyUser } from "@/lib/services/admin";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") as any;
  const data = await getUsers(role);
  return NextResponse.json({ ok: true, data });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const { id, verified } = await req.json();
  if (!id || !verified) {
    return NextResponse.json({ ok: false, error: "Missing id or verified" }, { status: 400 });
  }
  const data = await verifyUser(id, verified);
  return NextResponse.json({ ok: true, data });
}
