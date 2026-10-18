// GET/PATCH /api/profile: the signed-in user's own profile.
//
// SECURITY: Prisma connects as a privileged database role and BYPASSES Row Level
// Security. Ownership is enforced here: every query is scoped to the verified
// session user's id, and `select` limits the returned columns.
import type { Prisma } from "@prisma/client";
import { assertSameOrigin, getApiUser } from "@/lib/api/auth";
import { profileNotFound } from "@/lib/api/errors";
import { json, withApi } from "@/lib/api/handler";
import { isRecordNotFound } from "@/lib/api/prisma";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { profileUpdateSchema } from "@/lib/api/schemas";
import { parseJson } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const PROFILE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProfileSelect;

export const GET = withApi("GET /api/profile", async (request) => {
  const user = await getApiUser(request);
  // Primary-key lookup. Never creates a row: the signup trigger owns creation.
  const profile = await db.profile.findUnique({
    where: { id: user.id },
    select: PROFILE_SELECT,
  });
  if (!profile) throw profileNotFound();
  return json(profile);
});

export const PATCH = withApi("PATCH /api/profile", async (request) => {
  const user = await getApiUser(request);
  assertSameOrigin(request, user);
  enforceRateLimit(`profile:${user.id}`);
  // Only fullName and phone are accepted. Email changes go through Supabase Auth
  // (the database trigger syncs them to profiles); role is admin-only.
  const changes = await parseJson(request, profileUpdateSchema);

  try {
    const profile = await db.profile.update({
      where: { id: user.id },
      data: changes,
      select: PROFILE_SELECT,
    });
    return json(profile);
  } catch (error) {
    if (isRecordNotFound(error)) throw profileNotFound();
    throw error;
  }
});
