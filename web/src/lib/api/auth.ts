// Authentication for /api/* routes. Identity always comes from a token verified by
// Supabase Auth; user ids, emails or roles sent by the client are never trusted.
import type { UserRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/server";
import { ApiError, forbidden, profileNotFound, unauthenticated } from "./errors";

export type ApiUser = {
  id: string;
  email: string | null;
  /** "cookie" for the web app session, "bearer" for Authorization: Bearer <jwt>. */
  via: "cookie" | "bearer";
};

const BEARER_PATTERN = /^Bearer\s+([A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+)$/;

function isAuthUnavailable(error: { name?: string; status?: number }): boolean {
  return error.name === "AuthRetryableFetchError" || (error.status ?? 0) >= 500;
}

/**
 * Returns the verified user, or throws 401. Makes exactly one Supabase Auth call
 * (getUser), which checks the token with the Auth server, so revoked or deleted
 * sessions are rejected.
 *
 * - Authorization: Bearer <access token> (future Android client) takes precedence.
 *   A present but malformed or invalid header is a 401; it never falls back to cookies.
 * - Otherwise the Supabase session cookie set by the web app is used.
 */
export async function getApiUser(request: Request): Promise<ApiUser> {
  const header = request.headers.get("authorization");
  let token: string | null = null;
  if (header !== null) {
    const match = BEARER_PATTERN.exec(header.trim());
    if (!match) throw unauthenticated("The Authorization header must be: Bearer <access token>.");
    token = match[1];
  }

  const supabase = await createClient();
  const { data, error } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (error) {
    if (isAuthUnavailable(error)) {
      throw new ApiError(
        503,
        "SERVICE_UNAVAILABLE",
        "Sign-in could not be checked right now. Please try again shortly."
      );
    }
    throw unauthenticated();
  }
  if (!data.user) throw unauthenticated();

  return { id: data.user.id, email: data.user.email ?? null, via: token ? "bearer" : "cookie" };
}

/**
 * Cookie-authenticated writes must come from this site (defence in depth against
 * CSRF, on top of SameSite cookies and CORS preflight). Bearer requests carry no
 * ambient credentials, so they are exempt.
 */
export function assertSameOrigin(request: Request, user: ApiUser): void {
  if (user.via !== "cookie") return;
  const origin = request.headers.get("origin");
  if (!origin) return;
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw forbidden("Cross-site requests are not allowed.");
  }
  if (originHost !== host) throw forbidden("Cross-site requests are not allowed.");
}

/** 403 unless the user's role IN THE DATABASE is one of `roles`. */
export async function requireRole(user: ApiUser, roles: readonly UserRole[]): Promise<UserRole> {
  const profile = await db.profile.findUnique({ where: { id: user.id }, select: { role: true } });
  if (!profile) throw profileNotFound();
  if (!roles.includes(profile.role)) throw forbidden();
  return profile.role;
}
