"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function SignOutButton() {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        setPending(true);
        void signOut();
      }}
      className="btn-glass inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
    >
      <LogOut className="h-4 w-4" />
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}
