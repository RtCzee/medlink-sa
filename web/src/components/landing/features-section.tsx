"use client";

import { motion } from "framer-motion";
import {
  Video,
  FileText,
  Database,
  WifiOff,
  Languages,
  Fingerprint,
  BedDouble,
  Sparkles,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "@/lib/data";
import type { Feature } from "@/types";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const ICON_MAP: Record<Feature["icon"], LucideIcon> = {
  Video,
  FileText,
  Database,
  WifiOff,
  Languages,
  Fingerprint,
  BedDouble,
  Sparkles,
  ScrollText,
};

// Rotating tint palette — keeps the grid visually varied without
// introducing new brand colors.
const TINTS = [
  "bg-medical/10 text-medical",
  "bg-cyan-500/10 text-cyan-500",
  "bg-violet-500/10 text-violet-500",
] as const;

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-20 sm:py-28"
      aria-label="Platform capabilities"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="chip mb-4">
            <Sparkles className="h-3.5 w-3.5 text-medical" />
            Capabilities
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-gradient">Built for how</span>{" "}
            <span className="text-foreground">South Africa actually works</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Nine capabilities that separate a health app which looks good in a
            pitch deck from one that survives a Tuesday in Mthatha.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-label="Capability cards"
        >
          {FEATURES.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon];
            const tint = TINTS[i % TINTS.length];
            const hasMetric = Boolean(feature.metric || feature.metricLabel);
            return (
              <motion.article
                key={feature.id}
                variants={item}
                className="card-premium group relative flex flex-col p-6"
              >
                {/* Icon tile */}
                <div
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6",
                    tint
                  )}
                >
                  {Icon ? <Icon className="h-6 w-6" /> : null}
                </div>

                <h3 className="mt-5 font-display text-lg font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>

                {/* Metric chip pinned bottom-right */}
                {hasMetric && (
                  <div className="mt-5 flex justify-end">
                    <span className="chip">
                      {feature.metric && (
                        <span className="font-semibold text-foreground">
                          {feature.metric}
                        </span>
                      )}
                      {feature.metricLabel && (
                        <span className="text-muted-foreground">
                          {feature.metricLabel}
                        </span>
                      )}
                    </span>
                  </div>
                )}
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
