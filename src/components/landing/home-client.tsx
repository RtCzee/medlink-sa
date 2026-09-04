"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  HeartPulse,
  Stethoscope,
  Building2,
  Pill,
  ShieldCheck,
  ArrowRight,
  Search,
  QrCode,
  Video,
  Truck,
  Clock,
  MapPin,
} from "lucide-react";
import { useAuth, ROLE_DASHBOARDS } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";

const FaqSection = dynamic(
  () =>
    import("@/components/landing/faq-section").then((mod) => mod),
  {
    ssr: false,
    loading: () => (
      <div className="mx-auto max-w-6xl px-4 py-20">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    ),
  }
);

const EASE = [0.16, 1, 0.3, 1] as const;

const ROLE_CARDS = [
  {
    role: "patient" as const,
    icon: HeartPulse,
    title: "I'm a patient",
    desc: "Book doctors, order medicine for delivery, join the clinic queue from home, video-consult, and carry your record in your pocket.",
    accent: "from-medical to-cyan-400",
  },
  {
    role: "doctor" as const,
    icon: Stethoscope,
    title: "I'm a doctor",
    desc: "Your morning queue, high-risk flags, prescriptions and video follow-ups — less admin, more patients.",
    accent: "from-cyan-400 to-medical",
  },
  {
    role: "hospital" as const,
    icon: Building2,
    title: "I run a facility",
    desc: "Live bed heatmap, staffing, queue triage, and approve the clinicians in your hospital.",
    accent: "from-violet-500 to-medical",
  },
  {
    role: "pharmacy" as const,
    icon: Pill,
    title: "I'm a pharmacy",
    desc: "Receive e-prescriptions, publish medicine prices, dispatch delivery, and manage inventory.",
    accent: "from-emerald-500 to-teal-400",
  },
];

const SOLUTIONS = [
  {
    icon: QrCode,
    title: "Skip the waiting room",
    desc: "Pull a QR queue ticket from home. We tell you when your number is ~10 minutes away.",
  },
  {
    icon: Truck,
    title: "Medicine, delivered",
    desc: "Compare prices across Clicks, Dis-Chem and local pharmacies. Order for delivery or pickup.",
  },
  {
    icon: Video,
    title: "Video consults for minor issues",
    desc: "A cough, a rash, a follow-up — see your doctor from home and keep the clinic clear for the serious cases.",
  },
  {
    icon: MapPin,
    title: "Nearest open care, now",
    desc: "Find the closest hospital, clinic or pharmacy that's open right now — with live bed availability.",
  },
  {
    icon: ShieldCheck,
    title: "Verified, by design",
    desc: "Hospitals verify their doctors. We verify the hospitals. Patients verify their ID. Trust, layered.",
  },
  {
    icon: Clock,
    title: "One record that follows you",
    desc: "Every visit, every script, every scan — carried on the network, not the folder.",
  },
];

export default function HomeClient() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  const authed = mounted && user;

  return (
    <div className="relative">
      {/* Roles */}
      <section className="relative py-20 sm:py-28">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div
            className="glow-orb"
            style={{
              width: 480,
              height: 480,
              background: "var(--glow-1)",
              top: "0%",
              left: "-10%",
            }}
          />
        </div>
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <span className="chip mb-4">
              <span className="status-dot bg-medical" />
              One network, every role
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Choose how you join.
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Each role gets its own workspace, tuned to the job. Sign up
              free — it works across all nine provinces.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROLE_CARDS.map((r, i) => (
              <motion.div
                key={r.role}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.07 }}
              >
                <Link
                  href={
                    authed
                      ? ROLE_DASHBOARDS[r.role]
                      : `/sign-up?role=${r.role}`
                  }
                  className="card-premium group block h-full p-5"
                >
                  <span
                    className={`mb-4 grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${r.accent} text-white shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <r.icon className="h-5 w-5" />
                  </span>
                  <h3 className="font-display text-base font-semibold">
                    {r.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {r.desc}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-medical">
                    {authed ? "Open dashboard" : "Sign up"}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions grid */}
      <section className="relative py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <span className="chip mb-4">
              <Search className="h-3 w-3 text-medical" />
              Built to fix real pain
            </span>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Healthcare, unblocked.
            </h2>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Six of the biggest cracks in South African healthcare — each
              with a concrete answer inside MedLink SA.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
                className="card-premium group p-5"
              >
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-medical/12 text-medical transition-transform group-hover:scale-110">
                    <s.icon className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-display text-[0.95rem] font-semibold leading-snug">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Compact CTA */}
      <section className="relative py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE }}
            className="glass-strong relative overflow-hidden rounded-3xl p-8 text-center sm:p-14"
          >
            <div className="pointer-events-none absolute inset-0 -z-10">
              <div
                className="glow-orb"
                style={{
                  width: 360,
                  height: 360,
                  background: "var(--glow-1)",
                  top: "-30%",
                  left: "50%",
                  transform: "translateX(-50%)",
                }}
              />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Step into the network.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              One account. Every clinic, doctor, hospital and pharmacy on
              the network. Free to join.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button variant="default" asChild className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold">
                <Link href="/sign-up">
                  Create your account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="secondary" asChild className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold">
                <Link href="/explore">
                  Explore the network
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ (lazy-loaded) */}
      <FaqSection />
    </div>
  );
}
