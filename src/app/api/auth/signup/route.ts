import { NextResponse } from "next/server";
import { createMockUser } from "@/lib/mock-users";

const HAS_DB = !!process.env.DATABASE_URL;

export async function POST(req: Request) {
  try {
    const { name, email, password, role } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (HAS_DB) {
      try {
        const bcrypt = await import("bcryptjs");
        const { PrismaClient } = await import("@prisma/client");
        const prisma = new PrismaClient();

        const existing = await prisma.user.findUnique({
          where: { email: email.toLowerCase().trim() },
        });
        if (existing) {
          return NextResponse.json(
            { error: "An account with that email already exists." },
            { status: 409 }
          );
        }

        const passwordHash = await bcrypt.hash(password, 12);
        const user = await prisma.user.create({
          data: { name, email: email.toLowerCase().trim(), passwordHash, role },
        });

        return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
      } catch {
        // Prisma unavailable — fall through to mock
      }
    }

    // Mock mode
    const result = createMockUser({ name, email, password, role });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }
    return NextResponse.json({ ok: true, userId: result.userId }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
