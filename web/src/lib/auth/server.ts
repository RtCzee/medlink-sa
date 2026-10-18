// Server-only auth helpers. Every query uses the user's own session (publishable key
// + cookies), so Row Level Security decides what can be read. No elevated access.
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { PROFILE_COLUMNS, isUserRole, signInUrl, type Profile } from "@/lib/auth/roles";

/** Verified with the Supabase Auth server (not just the cookie). */
export const getAuthUser = cache(async (): Promise<SupabaseUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
});

/** Redirects to /sign-in?redirect=<nextPath> when there is no valid session. */
export async function requireUser(nextPath: string): Promise<SupabaseUser> {
  const user = await getAuthUser();
  if (!user) redirect(signInUrl(nextPath));
  return user;
}

export type ProfileResult =
  | { status: "ok"; user: SupabaseUser; profile: Profile }
  | { status: "missing"; user: SupabaseUser }
  | { status: "error"; user: SupabaseUser };

/**
 * Loads the signed-in user's profiles row (created by the database signup trigger).
 * Returns null when signed out. Never inserts: a missing row is reported, not patched.
 */
export const getCurrentProfile = cache(async (): Promise<ProfileResult | null> => {
  const user = await getAuthUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[auth] profile lookup failed:", error.code ?? "unknown");
    return { status: "error", user };
  }
  if (!data) return { status: "missing", user };
  if (!isUserRole(data.role)) {
    console.error("[auth] profile has an unknown role");
    return { status: "error", user };
  }
  return { status: "ok", user, profile: data as Profile };
});
