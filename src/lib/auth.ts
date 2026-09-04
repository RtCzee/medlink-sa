import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { findMockUserByEmail } from "@/lib/mock-users";
import type { UserRole } from "@/lib/auth-context";

/**
 * Auth config that works with or without a database.
 * When DATABASE_URL is set and Prisma is available, uses PostgreSQL.
 * Otherwise falls back to an in-memory mock user store (seeded with
 * the test accounts shown on the sign-in page).
 */
const HAS_DB = !!process.env.DATABASE_URL;

async function authorize(
  credentials: Record<"email" | "password", string> | undefined
) {
  if (!credentials?.email || !credentials?.password) return null;

  if (HAS_DB) {
    try {
      const { PrismaClient } = await import("@prisma/client");
      const prisma = new PrismaClient();
      const user = await prisma.user.findUnique({
        where: { email: credentials.email.toLowerCase().trim() },
      });
      if (!user) return null;
      const valid = await bcrypt.compare(credentials.password, user.passwordHash);
      if (!valid) return null;
      return {
        id: user.id,
        name: user.name ?? "",
        email: user.email,
        role: user.role as "patient" | "doctor" | "hospital" | "pharmacy" | "admin",
        avatar: user.avatar ?? undefined,
      };
    } catch {
      // Prisma unavailable — fall through to mock
    }
  }

  // Mock mode: validate against in-memory users
  const mock = findMockUserByEmail(credentials.email);
  if (!mock) return null;
  const valid = await bcrypt.compare(credentials.password, mock.passwordHash);
  if (!valid) return null;
  return {
    id: mock.id,
    name: mock.name,
    email: mock.email,
    role: mock.role,
    avatar: mock.avatar,
  };
}

/**
 * NextAuth requires a secret in production or it throws MissingSecretError.
 * Prefer the real env var; fall back to a fixed string so the academic demo
 * deploy works without dashboard configuration.
 * NOTE: set NEXTAUTH_SECRET in Vercel for any real deployment.
 */
const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET ?? "medlink-sa-poe-demo-secret-do-not-use-in-production";

export const authOptions: NextAuthOptions = {
  secret: AUTH_SECRET,
  session: { strategy: "jwt" },
  pages: { signIn: "/sign-in" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize,
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: UserRole }).role = token.role as UserRole;
      }
      return session;
    },
  },
};
