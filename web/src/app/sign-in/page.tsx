"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_AFTER_SIGN_IN, safeRedirectPath } from "@/lib/auth/roles";
import {
  EMAIL_PATTERN,
  NETWORK_ERROR_MESSAGE,
  describeAuthError,
} from "@/lib/auth/errors";

const URL_ERRORS: Record<string, string> = {
  confirmation_failed:
    "That confirmation link is invalid or has expired. Try signing in, or register again to get a new link.",
};

function SignInForm() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState<string | null>(
    () => URL_ERRORS[params.get("error") ?? ""] ?? null
  );
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Only same-site paths are accepted (prevents open redirects).
  const redirect = safeRedirectPath(params.get("redirect"), DEFAULT_AFTER_SIGN_IN);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setError("Enter a valid email address.");
      return;
    }
    if (!password) {
      setError("Enter your password.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: authError } = await createClient().auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });
      if (authError || !data.session) {
        setError(describeAuthError(authError, "Sign in failed. Please try again."));
        setLoading(false);
        return;
      }
      setSuccess(true);
      // Full navigation so the server sees the new session cookie. /dashboard
      // resolves the user's real role from the database.
      window.location.assign(redirect);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
      setLoading(false);
    }
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
            <div
              role="alert"
              className="mt-6 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-500"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-3 text-sm text-emerald-500"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Signed in. Taking you to your dashboard…
            </div>
          )}

          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <div className="input-premium flex h-11 items-center gap-2 px-3.5">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  autoComplete="email"
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
                <button
                  type="button"
                  className="text-xs font-medium text-medical hover:underline"
                >
                  Forgot?
                </button>
              </div>
              <div className="input-premium flex h-11 items-center gap-2 px-3.5">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <input
                  type={showPwd ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={showPwd ? "Hide password" : "Show password"}
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-60"
            >
              {loading || success ? "Signing in…" : "Sign in"}
              {!loading && !success && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

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
