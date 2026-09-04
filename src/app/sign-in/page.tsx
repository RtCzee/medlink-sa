"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { signIn as nextAuthSignIn } from "next-auth/react";
import { ROLE_DASHBOARDS, type UserRole } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const TEST_ACCOUNTS = [
  { email: "admin@gmail.com", label: "Admin" },
  { email: "adminpatient@gmail.com", label: "Patient" },
  { email: "admindoctor@gmail.com", label: "Doctor" },
  { email: "adminhospital@gmail.com", label: "Hospital" },
  { email: "adminpharmacy@gmail.com", label: "Pharmacy" },
];

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirect = params.get("redirect");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await nextAuthSignIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res?.ok) {
      setError("Invalid email or password.");
      return;
    }

    // After successful sign-in, fetch session to get role, then redirect
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const role = session?.user?.role as UserRole | undefined;
    const dest = redirect ?? (role ? ROLE_DASHBOARDS[role] : "/dashboard/patient");
    window.location.href = dest;
  };

  const quickFill = (em: string) => {
    setEmail(em);
    setPassword("12345678");
    setError(null);
  };

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-medical to-cyan-400 shadow-[0_4px_16px_var(--glow-1)]">
              <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display text-[0.95rem] font-semibold tracking-tight">
              MedLink<span className="text-medical"> SA</span>
            </span>
          </Link>

          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your MedLink SA account.
          </p>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <div className="input-premium flex h-11 items-center gap-2 px-3.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Password
                </label>
                <Button
                  variant="link"
                  type="button"
                  className="h-auto p-0 text-xs font-medium text-medical hover:underline"
                >
                  Forgot?
                </Button>
              </div>
              <div className="input-premium flex h-11 items-center gap-2 px-3.5">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="default"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Quick test accounts */}
          <div className="mt-8">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Test accounts (password:{" "}
              <span className="font-mono">12345678</span>)
            </div>
            <div className="flex flex-wrap gap-2">
              {TEST_ACCOUNTS.map((a) => (
                <Button
                  key={a.email}
                  variant="outline"
                  size="sm"
                  onClick={() => quickFill(a.email)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold cursor-pointer transition-colors hover:border-medical/40 hover:text-medical"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            New to MedLink SA?{" "}
            <Link
              href="/sign-up"
              className="font-semibold text-medical hover:underline"
            >
              Create an account
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right: brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-medical/15 via-background to-cyan-400/10 lg:block">
        <div className="absolute inset-0">
          <div
            className="glow-orb animate-float-slow"
            style={{
              width: 400,
              height: 400,
              background: "var(--glow-1)",
              top: "10%",
              right: "-10%",
            }}
          />
          <div
            className="glow-orb animate-float-slow"
            style={{
              width: 320,
              height: 320,
              background: "var(--glow-2)",
              bottom: "10%",
              left: "-8%",
              animationDelay: "-4s",
            }}
          />
          <div className="bg-grid absolute inset-0 opacity-30 dark:opacity-15" />
        </div>
        <div className="relative flex h-full flex-col justify-center p-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="max-w-md"
          >
            <span className="chip mb-6">
              <span className="status-dot bg-emerald-500" />
              Live across 9 provinces
            </span>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              One record.
              <br />
              One network.
              <br />
              <span className="text-gradient-medical">One country.</span>
            </h2>
            <p className="mt-5 text-base text-muted-foreground">
              Join 4.2 million South Africans already connected to better,
              faster, fairer healthcare.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <SignInForm />
    </Suspense>
  );
}
