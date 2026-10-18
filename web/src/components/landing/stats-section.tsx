"use client";

import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { useCountUp } from "@/hooks/use-count-up";
import { STATS } from "@/lib/data";
import type { Stat } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

function formatStatValue(value: number, decimals?: number) {
  if (decimals && decimals > 0) {
    return value.toFixed(decimals);
  }
  return Math.round(value).toLocaleString("en-ZA");
}

function StatItem({ stat, start }: { stat: Stat; start: boolean }) {
  const value = useCountUp(stat.value, {
    duration: 2000,
    decimals: stat.decimals ?? 0,
    start,
  });
  const display = formatStatValue(value, stat.decimals);

  return (
    <motion.div
      variants={item}
      className="stat-card group"
      aria-label={`${stat.label}: ${stat.prefix ?? ""}${stat.value}${stat.suffix ?? ""}`}
    >
      {/* Top accent line in medical blue */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-medical to-cyan-400 opacity-80"
      />
      <div className="flex items-baseline gap-0.5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        {stat.prefix && (
          <span className="text-muted-foreground">{stat.prefix}</span>
        )}
        <span className="text-gradient">{display}</span>
        {stat.suffix && (
          <span className="text-gradient-medical">{stat.suffix}</span>
        )}
      </div>
      <div className="mt-3 text-sm font-semibold text-foreground">
        {stat.label}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{stat.sublabel}</div>
    </motion.div>
  );
}

/**
 * Animated ECG-style SVG line — decorative "national pulse" divider.
 * Two identical path segments side-by-side translate via the .animate-marquee
 * keyframes for a seamless loop. Edges fade via a CSS mask.
 */
function EcgLine() {
  const path =
    "M0,20 L30,20 L36,17 L42,20 L52,20 L58,22 L62,8 L66,30 L70,20 L78,17 L86,20 L120,20";
  return (
    <div
      className="relative h-10 w-full overflow-hidden"
      aria-hidden
      style={{
        WebkitMaskImage:
          "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        maskImage:
          "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
    >
      <div className="flex h-full w-[200%] animate-marquee">
        <svg
          viewBox="0 0 120 40"
          preserveAspectRatio="none"
          className="h-full w-1/2 flex-shrink-0"
        >
          <defs>
            <linearGradient id="ecg-grad" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="var(--medical)" stopOpacity="0.15" />
              <stop offset="45%" stopColor="var(--medical)" stopOpacity="1" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d={path}
            fill="none"
            stroke="url(#ecg-grad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <svg
          viewBox="0 0 120 40"
          preserveAspectRatio="none"
          className="h-full w-1/2 flex-shrink-0"
        >
          <path
            d={path}
            fill="none"
            stroke="url(#ecg-grad)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

export default function StatsSection() {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.25 });

  return (
    <section
      id="stats"
      className="relative py-20 sm:py-28"
      aria-label="National network statistics"
    >
      <div ref={ref} className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="chip mb-4">
            <Activity className="h-3.5 w-3.5 text-medical" />
            National pulse
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-foreground">The network,</span>{" "}
            <span className="text-gradient-medical">by the numbers</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Live telemetry from the MedLink SA backbone — measured across nine
            provinces, refreshed every ninety seconds.
          </p>
        </motion.div>

        {/* ECG divider */}
        <div className="mx-auto mt-8 max-w-3xl">
          <EcgLine />
        </div>

        {/* Stats grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate={inView ? "show" : "hidden"}
          className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4"
          aria-label="Key national statistics"
        >
          {STATS.map((stat) => (
            <StatItem key={stat.id} stat={stat} start={inView} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
