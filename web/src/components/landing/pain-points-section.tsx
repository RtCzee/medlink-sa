"use client";

import { motion } from "framer-motion";
import {
  Clock,
  FolderX,
  Pill,
  BedDouble,
  KeyRound,
  WifiOff,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

const ICONS: Record<string, LucideIcon> = {
  Clock,
  FolderX,
  Pill,
  BedDouble,
  KeyRound,
  WifiOff,
};

import { PAIN_POINTS } from "@/lib/data";

export default function PainPointsSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="glow-orb"
          style={{
            width: 520,
            height: 520,
            background: "var(--glow-2)",
            top: "20%",
            right: "-15%",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="chip mb-4">
            <span className="status-dot bg-rose-500" />
            Real pain, real fixes
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            The cracks South African healthcare
            <span className="text-gradient-medical"> falls through.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Each of these is a story we&apos;ve heard from a nurse, a pharmacist
            or a patient. Each one has a concrete answer inside MedLink SA.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PAIN_POINTS.map((p, i) => {
            const Icon = ICONS[p.icon] ?? Clock;
            return (
              <motion.article
                key={p.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.07 }}
                className="card-premium group relative overflow-hidden p-5"
              >
                {/* problem */}
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-rose-500/12 text-rose-500">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="pt-1 font-display text-[0.95rem] font-semibold leading-snug">
                    {p.title}
                  </h3>
                </div>

                {/* divider */}
                <div className="my-4 flex items-center gap-2">
                  <span className="hairline flex-1" />
                  <ArrowRight className="h-3 w-3 rotate-90 text-medical" />
                  <span className="hairline flex-1" />
                </div>

                {/* solution */}
                <p className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-medical/15 text-[0.6rem] font-bold text-medical">
                    ✓
                  </span>
                  {p.solution}
                </p>

                {/* hover glow */}
                <div className="pointer-events-none absolute -bottom-12 -right-12 h-32 w-32 rounded-full bg-medical/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
