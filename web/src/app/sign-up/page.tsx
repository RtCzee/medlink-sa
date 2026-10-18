"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  HeartPulse,
  ShieldCheck,
  Check,
  MailCheck,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { DEFAULT_AFTER_SIGN_IN } from "@/lib/auth/roles";
import {
  EMAIL_PATTERN,
  MIN_PASSWORD_LENGTH,
  NETWORK_ERROR_MESSAGE,
  describeAuthError,
} from "@/lib/auth/errors";

function SignUpForm() {
  // Self-registration always creates a PATIENT account. No role is sent to
  // Supabase; the database signup trigger sets role = 'patient'.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const validate = (): string | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return "Enter your full name.";
    if (trimmedName.length > 100) return "Full name must be 100 characters or fewer.";
    if (!EMAIL_PATTERN.test(email.trim())) return "Enter a valid email address.";
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (password !== confirmPassword) return "Passwords don't match.";
    return null;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    setLoading(true);
    const trimmedEmail = email.trim();
    try {
      const { data, error: authError } = await createClient().auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: name.trim() },
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
            DEFAULT_AFTER_SIGN_IN
          )}`,
        },
      });
      if (authError) {
        setError(describeAuthError(authError, "Registration failed. Please try again."));
        setLoading(false);
        return;
      }
      if (data.session) {
        // Email confirmation is off: already signed in.
        setRedirecting(true);
        window.location.assign(DEFAULT_AFTER_SIGN_IN);
        return;
      }
      // Email confirmation is on: no session until the link is opened.
      setPassword("");
      setConfirmPassword("");
      setSentTo(trimmedEmail);
      setLoading(false);
    } catch {
      setError(NETWORK_ERROR_MESSAGE);
      setLoading(false);
    }
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

          {/* Self-registration is patient-only */}
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-medical/30 bg-medical/10 p-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-medical text-white">
              <HeartPulse className="h-4 w-4" />
            </span>
            <div>
              <div className="text-sm font-semibold">Patient account</div>
              <div className="text-[0.7rem] text-muted-foreground">
                Doctor, hospital and pharmacy accounts are set up by MedLink SA
                administrators.
              </div>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-6 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-3 text-sm text-rose-500"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {sentTo ? (
            <div
              role="status"
              className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm"
            >
              <div className="flex items-center gap-2 font-semibold text-emerald-500">
                <MailCheck className="h-4 w-4 shrink-0" />
                Check your email
              </div>
              <p className="mt-2 text-muted-foreground">
                We sent a confirmation link to{" "}
                <span className="font-semibold text-foreground">{sentTo}</span>.
                Open it in this browser to activate your account. If you already
                have an account, just sign in.
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Nothing there? Check your spam folder, or wait a minute and register
                again to resend it.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Full name
                </label>
                <div className="input-premium flex h-11 items-center gap-2 px-3.5">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <input
                    required
                    maxLength={100}
                    autoComplete="name"
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
                    autoComplete="email"
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
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Confirm password
                </label>
                <div className="input-premium flex h-11 items-center gap-2 px-3.5">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || redirecting}
                className="btn-primary flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold disabled:opacity-60"
              >
                {redirecting
                  ? "Account created. Opening your dashboard…"
                  : loading
                    ? "Creating account…"
                    : "Create account"}
                {!loading && !redirecting && <ArrowRight className="h-4 w-4" />}
              </button>
              </form>
          )}

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
