"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  HeartPulse,
  Stethoscope,
  Building2,
  Pill,
  ShieldCheck,
  Check,
} from "lucide-react";
import { useAuth, ROLE_DASHBOARDS, type UserRole } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ROLES: Array<{
  id: UserRole;
  label: string;
  icon: React.ElementType;
  desc: string;
}> = [
  { id: "patient", label: "Patient", icon: HeartPulse, desc: "Get care" },
  { id: "doctor", label: "Doctor", icon: Stethoscope, desc: "Treat patients" },
  { id: "hospital", label: "Hospital", icon: Building2, desc: "Run a facility" },
  { id: "pharmacy", label: "Pharmacy", icon: Pill, desc: "Dispense" },
];

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signUp } = useAuth();
  const [role, setRole] = useState<UserRole>(
    (params.get("role") as UserRole) || "patient"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    const res = await signUp({ name, email, password, role });
    setLoading(false);
    if (!res.ok) {
      setError(res.error ?? "Sign up failed.");
      return;
    }
    // Account created — redirect to sign-in
    router.push("/sign-in?registered=true");
  };

  return (
    <div className="grid min-h-[100svh] lg:grid-cols-2">
      {/* Left: brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-medical/15 via-background to-cyan-400/10 lg:block">
        <div className="absolute inset-0">
          <div
            className="glow-orb animate-float-slow"
            style={{
              width: 420,
              height: 420,
              background: "var(--glow-1)",
              top: "5%",
              left: "-12%",
            }}
          />
          <div
            className="glow-orb animate-float-slow"
            style={{
              width: 340,
              height: 340,
              background: "var(--glow-2)",
              bottom: "8%",
              right: "-6%",
              animationDelay: "-5s",
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
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Free to join
            </span>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight">
              Healthcare that
              <br />
              <span className="text-gradient-medical">follows you.</span>
            </h2>
            <p className="mt-5 text-base text-muted-foreground">
              Your records, your prescriptions, your appointments — in one
              account that works at every clinic, hospital and pharmacy on the
              network.
            </p>
            <ul className="mt-8 space-y-3 text-sm">
              {[
                "Book appointments & video consults",
                "Order medicine for delivery",
                "Join the clinic queue from home",
                "Carry your record anywhere in SA",
              ].map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                    <Check className="h-3 w-3" />
                  </span>
                  <span className="text-foreground/80">{t}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Right: form */}
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Join South Africa&apos;s national health network.
          </p>

          {/* Role selector */}
          <div className="mt-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              I am a…
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <Button
                  key={r.id}
                  type="button"
                  variant="outline"
                  onClick={() => setRole(r.id)}
                  className={cn(
                    "flex h-auto items-center gap-2.5 p-3 text-left",
                    role === r.id
                      ? "border-medical bg-medical/10 ring-1 ring-medical/30"
                      : "border-border bg-card/40 hover:border-medical/40"
                  )}
                >
                  <span
                    className={cn(
                      "grid h-8 w-8 place-items-center rounded-lg",
                      role === r.id
                        ? "bg-medical text-white"
                        : "bg-foreground/5 text-muted-foreground"
                    )}
                  >
                    <r.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold">{r.label}</div>
                    <div className="text-[0.7rem] text-muted-foreground">
                      {r.desc}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-6 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Full name
              </label>
              <div className="input-premium flex h-11 items-center gap-2 px-3.5">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Thandiwe Mokoena"
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

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
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Password
              </label>
              <div className="input-premium flex h-11 items-center gap-2 px-3.5">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              variant="default"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-semibold disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-medical hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <SignUpForm />
    </Suspense>
  );
}
