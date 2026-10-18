// Request schemas. All are strict: unknown or protected fields (id, role, email,
// userId, createdAt, ...) are rejected with 400 instead of being silently dropped.
import { AppLanguage, AppTheme } from "@prisma/client";
import { z } from "zod";

const hasAtLeastOneField = (value: Record<string, unknown>) =>
  Object.values(value).some((field) => field !== undefined);

export const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Full name is required.")
  .max(100, "Full name must be 100 characters or fewer.");

// Digits, spaces, +, - and parentheses; 7-15 digits (E.164 maximum).
// Accepts e.g. "+27 82 123 4567", "082-123-4567", "(011) 555 0123".
export const phoneSchema = z
  .string()
  .trim()
  .max(32, "Phone number must be 32 characters or fewer.")
  .regex(/^\+?[0-9() -]+$/, "Phone number may only contain digits, spaces, +, - and parentheses.")
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length;
    return digits >= 7 && digits <= 15;
  }, "Phone number must contain between 7 and 15 digits.");

export const profileUpdateSchema = z
  .strictObject({
    fullName: fullNameSchema.optional(),
    phone: phoneSchema.nullable().optional(),
  })
  .refine(hasAtLeastOneField, { message: "Provide at least one of: fullName, phone." });

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>;

export const settingsUpdateSchema = z
  .strictObject({
    language: z.enum(AppLanguage).optional(),
    theme: z.enum(AppTheme).optional(),
    notificationsEnabled: z.boolean().optional(),
    showEmergencyQr: z.boolean().optional(),
  })
  .refine(hasAtLeastOneField, {
    message: "Provide at least one of: language, theme, notificationsEnabled, showEmergencyQr.",
  });

export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>;
