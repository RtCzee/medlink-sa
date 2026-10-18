// GET/PATCH /api/settings: the signed-in user's own app settings.
//
// SECURITY: Prisma bypasses Row Level Security, so every query is scoped to the
// verified session user's id (user_settings.user_id, the primary key).
// A missing row is a 404 SETTINGS_NOT_FOUND. We deliberately don't upsert: the
// signup trigger owns row creation, and silently creating rows on write would hide
// a broken trigger.
import type { Prisma } from "@prisma/client";
import { assertSameOrigin, getApiUser } from "@/lib/api/auth";
import { settingsNotFound } from "@/lib/api/errors";
import { json, withApi } from "@/lib/api/handler";
import { isRecordNotFound } from "@/lib/api/prisma";
import { enforceRateLimit } from "@/lib/api/rate-limit";
import { settingsUpdateSchema } from "@/lib/api/schemas";
import { parseJson } from "@/lib/api/validation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const SETTINGS_SELECT = {
  language: true,
  theme: true,
  notificationsEnabled: true,
  showEmergencyQr: true,
  updatedAt: true,
} satisfies Prisma.UserSettingsSelect;

export const GET = withApi("GET /api/settings", async (request) => {
  const user = await getApiUser(request);
  const settings = await db.userSettings.findUnique({
    where: { userId: user.id },
    select: SETTINGS_SELECT,
  });
  if (!settings) throw settingsNotFound();
  return json(settings);
});

export const PATCH = withApi("PATCH /api/settings", async (request) => {
  const user = await getApiUser(request);
  assertSameOrigin(request, user);
  enforceRateLimit(`settings:${user.id}`);
  const changes = await parseJson(request, settingsUpdateSchema);

  try {
    const settings = await db.userSettings.update({
      where: { userId: user.id },
      data: changes,
      select: SETTINGS_SELECT,
    });
    return json(settings);
  } catch (error) {
    if (isRecordNotFound(error)) throw settingsNotFound();
    throw error;
  }
});
