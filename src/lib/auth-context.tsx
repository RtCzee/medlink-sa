"use client";

import * as React from "react";
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react";

export type UserRole = "patient" | "doctor" | "hospital" | "pharmacy" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  facility?: string;
  verified: "pending" | "approved" | "rejected";
  identityVerified?: boolean;
  specialty?: string;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => { ok: boolean; error?: string; user?: User };
  signUp: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const user: User | null = session?.user
    ? {
        id: (session.user as { id: string }).id,
        name: session.user.name ?? "",
        email: session.user.email ?? "",
        role: (session.user as { role: UserRole }).role,
        avatar: (session.user as { avatar?: string }).avatar,
        verified: "approved",
      }
    : null;

  const loading = status === "loading";

  const signIn: AuthContextValue["signIn"] = (email, password) => {
    // signIn is async under Auth.js — callers need to handle redirect
    nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    });
    // Optimistic return — actual validation happens server-side
    return { ok: true };
  };

  const signUp: AuthContextValue["signUp"] = async (data) => {
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) return { ok: false, error: result.error };
      return { ok: true };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  };

  const signOut = () => nextAuthSignOut({ callbackUrl: "/sign-in" });

  const updateUser = (_patch: Partial<User>) => {
    // ponytail: profile updates go through API, not client state
  };

  const value = React.useMemo(
    () => ({ user, loading, signIn, signUp, signOut, updateUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
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
