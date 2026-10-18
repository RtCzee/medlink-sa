"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import {
  PROFILE_COLUMNS,
  SIGN_IN_PATH,
  isUserRole,
  toAppUser,
  type Profile,
  type User,
} from "@/lib/auth/roles";

// Shared types/constants live in lib/auth/roles.ts so server code can use them too.
export type { User, UserRole } from "@/lib/auth/roles";
export { ROLE_DASHBOARDS, ROLE_LABELS } from "@/lib/auth/roles";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  /** Ends the Supabase session (clears auth cookies) and goes to /sign-in. */
  signOut: () => Promise<void>;
  /**
   * Updates the in-memory user for the current page view only (UI demo forms).
   * Nothing is persisted, and identity fields (id, email, role) can't be changed here.
   */
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

/**
 * Client-side view of the Supabase session for UI (names, nav, buttons).
 * Access control is enforced on the server (proxy.ts, RoleGate) and by RLS;
 * this provider never grants access by itself.
 *
 * `initialUser` is passed by the server-side RoleGate on dashboards, so they
 * render with the verified profile immediately.
 */
export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode;
  initialUser?: User | null;
}) {
  const [user, setUser] = React.useState<User | null>(initialUser ?? null);
  const [loading, setLoading] = React.useState(initialUser === undefined);

  React.useEffect(() => {
    const supabase = createClient();
    let active = true;

    const loadProfile = async (userId: string, email: string | null | undefined) => {
      const { data, error } = await supabase
        .from("profiles")
        .select(PROFILE_COLUMNS)
        .eq("id", userId)
        .maybeSingle();
      if (!active) return;
      if (error) {
        // Transient failure: keep what we have for this same user.
        setUser((prev) => (prev?.id === userId ? prev : null));
      } else if (data && isUserRole(data.role)) {
        setUser(toAppUser(data as Profile, email));
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const authUser = session?.user;
      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }
      if (event === "INITIAL_SESSION" || event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Don't await Supabase calls inside this callback (can deadlock); defer.
        setTimeout(() => void loadProfile(authUser.id, authUser.email), 0);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await createClient().auth.signOut();
    } catch {
      // Even if the network call fails, local session cookies are cleared.
    } finally {
      setUser(null);
      // Full navigation so no cached authenticated page stays in memory.
      window.location.assign(SIGN_IN_PATH);
    }
  }, []);

  const updateUser = React.useCallback<AuthContextValue["updateUser"]>((patch) => {
    const safe: Partial<User> = { ...patch };
    delete safe.id;
    delete safe.email;
    delete safe.role;
    setUser((prev) => (prev ? { ...prev, ...safe } : prev));
  }, []);

  const value = React.useMemo(
    () => ({ user, loading, signOut, updateUser }),
    [user, loading, signOut, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
