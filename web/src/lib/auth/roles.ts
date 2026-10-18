// Shared (server + client) auth types and helpers. No secrets, no side effects.

export type UserRole = "patient" | "doctor" | "hospital" | "pharmacy" | "admin";

export const USER_ROLES: readonly UserRole[] = [
  "patient",
  "doctor",
  "hospital",
  "pharmacy",
  "admin",
];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/** Shape the UI works with. Built from the `profiles` row (see toAppUser). */
export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string | null;
  avatar?: string;
  facility?: string;
  verified: "pending" | "approved" | "rejected";
  identityVerified?: boolean;
  specialty?: string;
};

/** Columns read from public.profiles. RLS limits this to the caller's own row. */
export const PROFILE_COLUMNS = "id, full_name, email, phone, role";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role: UserRole;
};

export function toAppUser(profile: Profile, fallbackEmail?: string | null): User {
  const email = profile.email ?? fallbackEmail ?? "";
  const name = profile.full_name?.trim() || email.split("@")[0] || "MedLink user";
  return {
    id: profile.id,
    name,
    email,
    role: profile.role,
    phone: profile.phone,
    // Non-patient roles can only be assigned in the database by an administrator.
    verified: profile.role === "patient" ? "pending" : "approved",
    identityVerified: false,
  };
}

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  patient: "/dashboard/patient",
  doctor: "/dashboard/doctor",
  hospital: "/dashboard/hospital",
  pharmacy: "/dashboard/pharmacy",
  admin: "/dashboard/admin",
};

export const ROLE_LABELS: Record<UserRole, string> = {
  patient: "Patient",
  doctor: "Doctor",
  hospital: "Hospital",
  pharmacy: "Pharmacy",
  admin: "Administrator",
};

export const SIGN_IN_PATH = "/sign-in";
export const SIGN_UP_PATH = "/sign-up";
/** Resolves to the signed-in user's own dashboard (by profiles.role). */
export const DEFAULT_AFTER_SIGN_IN = "/dashboard";

/** Paths that need a signed-in user. Checked in proxy.ts AND in the pages themselves. */
export function isProtectedPath(pathname: string): boolean {
  return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
}

/** Sign-in / sign-up pages: signed-in users are sent to their dashboard instead. */
export function isAuthPagePath(pathname: string): boolean {
  return pathname === SIGN_IN_PATH || pathname === SIGN_UP_PATH;
}

/**
 * Only allow same-site relative redirects ("/dashboard/patient?tab=x").
 * Blocks open redirects such as "//evil.com", "/\\evil.com" or "https://...".
 */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback: string = DEFAULT_AFTER_SIGN_IN
): string {
  if (!value || typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value;
}

export function signInUrl(nextPath?: string | null): string {
  const next = safeRedirectPath(nextPath, "");
  return next ? `${SIGN_IN_PATH}?redirect=${encodeURIComponent(next)}` : SIGN_IN_PATH;
}
