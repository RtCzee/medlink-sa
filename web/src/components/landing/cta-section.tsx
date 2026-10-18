"use client";

import { motion } from "framer-motion";
import { ArrowRight, Activity, Sparkles, ShieldCheck } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const ROLES_QUICK = [
  { label: "Patient", icon: "HeartPulse" },
  { label: "Doctor", icon: "Stethoscope" },
  { label: "Hospital", icon: "Building2" },
  { label: "Pharmacy", icon: "Pill" },
  { label: "Admin", icon: "ShieldCheck" },
];

export default function CTASection() {
  return (
    <section id="cta" className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="relative overflow-hidden rounded-[2rem] border border-border bg-gradient-to-br from-medical/12 via-background to-cyan-400/8 p-8 sm:p-14"
        >
          {/* ambient */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div
              className="glow-orb animate-float-slow"
              style={{
                width: 380,
                height: 380,
                background: "var(--glow-1)",
                top: "-20%",
                left: "-10%",
              }}
            />
            <div
              className="glow-orb animate-float-slow"
              style={{
                width: 320,
                height: 320,
                background: "var(--glow-2)",
                bottom: "-25%",
                right: "-8%",
                animationDelay: "-5s",
              }}
            />
            <div className="bg-grid absolute inset-0 opacity-30 dark:opacity-15" />
          </div>

          <div className="flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <span className="chip mb-5">
                <Sparkles className="h-3 w-3 text-medical" />
                Join the network
              </span>
              <h2 className="font-display text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl lg:text-5xl">
                Step into South Africa&apos;s
                <span className="text-gradient-medical">
                  {" "}
                  living health network.
                </span>
              </h2>
              <p className="mt-5 text-base text-muted-foreground sm:text-lg">
                Pick a role, take a tour of the prototype, and see how a single
                record can follow a patient from a rural clinic to a city
                trauma centre — without ever losing the thread.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#top"
                  className="btn-primary group inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold"
                >
                  <Activity className="h-4 w-4" />
                  Launch the prototype
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <a
                  href="#platform"
                  className="btn-secondary inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold"
                >
                  Explore the dashboard
                </a>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  No real data is stored
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="status-dot bg-emerald-500" />
                  Demo runs fully in your browser
                </span>
              </div>
            </div>

            {/* quick role selector */}
            <div className="w-full max-w-xs shrink-0">
              <div className="glass-card p-3">
                <div className="px-2 pb-2 pt-1 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                  Quick-test a role
                </div>
                <div className="space-y-1.5">
                  {ROLES_QUICK.map((r, i) => (
                    <motion.button
                      key={r.label}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-medical/10"
                    >
                      <span className="text-sm font-medium">{r.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-medical" />
                    </motion.button>
                  ))}
                </div>
              </div>
              <p className="mt-3 text-center text-[0.7rem] text-muted-foreground">
                One tap. No password. Passkey-ready.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
