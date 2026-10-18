"use client";

import * as React from "react";

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

const TEST_ACCOUNTS: Record<string, { password: string; user: User }> = {
  "admin@gmail.com": {
    password: "12345678",
    user: {
      id: "u-admin",
      name: "System Administrator",
      email: "admin@gmail.com",
      role: "admin",
      verified: "approved",
    },
  },
  "adminpatient@gmail.com": {
    password: "12345678",
    user: {
      id: "u-patient",
      name: "Thandiwe Mokoena",
      email: "adminpatient@gmail.com",
      role: "patient",
      verified: "approved",
      identityVerified: true,
    },
  },
  "admindoctor@gmail.com": {
    password: "12345678",
    user: {
      id: "u-doctor",
      name: "Dr. Sipho Dlamini",
      email: "admindoctor@gmail.com",
      role: "doctor",
      verified: "approved",
      facility: "Chris Hani Baragwanath Hospital",
      specialty: "Cardiology",
    },
  },
  "adminhospital@gmail.com": {
    password: "12345678",
    user: {
      id: "u-hospital",
      name: "Chris Hani Baragwanath",
      email: "adminhospital@gmail.com",
      role: "hospital",
      verified: "approved",
      facility: "Chris Hani Baragwanath Hospital",
    },
  },
  "adminpharmacy@gmail.com": {
    password: "12345678",
    user: {
      id: "u-pharmacy",
      name: "Clicks Pharmacy — Rosebank",
      email: "adminpharmacy@gmail.com",
      role: "pharmacy",
      verified: "approved",
      facility: "Clicks Pharmacy — Rosebank",
    },
  },
};

const STORAGE_KEY = "medlink-sa-user";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => { ok: boolean; error?: string; user?: User };
  signUp: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
  }) => { ok: boolean; error?: string; user?: User };
  signOut: () => void;
  updateUser: (patch: Partial<User>) => void;
};

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialiser reads localStorage SYNCHRONOUSLY on first render.
  // This avoids the loading=true → loading=false window where the auth guard
  // could fire and redirect to /sign-in on a hard navigation/refresh.
  const [user, setUser] = React.useState<User | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      return null;
    }
  });
  const [loading] = React.useState(false);

  // Keep user in sync across tabs / windows.
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        setUser(e.newValue ? (JSON.parse(e.newValue) as User) : null);
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = (u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const signIn: AuthContextValue["signIn"] = (email, password) => {
    const key = email.trim().toLowerCase();
    const account = TEST_ACCOUNTS[key];
    if (!account) {
      return { ok: false, error: "No account found for that email." };
    }
    if (account.password !== password) {
      return { ok: false, error: "Incorrect password. Please try again." };
    }
    persist(account.user);
    return { ok: true, user: account.user };
  };

  const signUp: AuthContextValue["signUp"] = (data) => {
    const key = data.email.trim().toLowerCase();
    if (TEST_ACCOUNTS[key]) {
      return { ok: false, error: "An account with that email already exists." };
    }
    const newUser: User = {
      id: `u-${Date.now()}`,
      name: data.name,
      email: key,
      role: data.role,
      verified: "pending",
      identityVerified: data.role === "patient" ? false : undefined,
    };
    persist(newUser);
    return { ok: true, user: newUser };
  };

  const signOut = () => persist(null);

  const updateUser: AuthContextValue["updateUser"] = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
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
