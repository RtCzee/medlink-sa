"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  HeartPulse,
  Stethoscope,
  Building2,
  Pill,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { ROLES } from "@/lib/data";
import type { RoleMeta } from "@/types";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const ICON_MAP: Record<RoleMeta["icon"], LucideIcon> = {
  HeartPulse,
  Stethoscope,
  Building2,
  Pill,
  ShieldCheck,
};

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

function RoleCard({ role, featured = false }: { role: RoleMeta; featured?: boolean }) {
  const Icon = ICON_MAP[role.icon];

  return (
    <motion.article
      variants={item}
      className={cn(
        "relative",
        featured && "sm:col-span-2 lg:col-span-2 lg:row-span-2"
      )}
    >
      {/* Radial glow behind the card — uses the role's own glow color */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3 opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${role.glow}, transparent 65%)`,
          filter: "blur(28px)",
        }}
      />

      {/* Card body */}
      <div
        className={cn(
          "card-premium group relative flex h-full flex-col overflow-hidden p-6",
          featured && "sm:p-8 lg:p-10"
        )}
      >
        {/* Large watermark icon for featured card */}
        {featured && Icon ? (
          <Icon
            aria-hidden
            className="pointer-events-none absolute -bottom-8 -right-8 h-48 w-48 opacity-[0.07]"
            style={{ color: role.accent }}
          />
        ) : null}

        {/* Icon circle + label */}
        <div className="flex items-center gap-3">
          <div
            className="grid h-12 w-12 place-items-center rounded-full text-white shadow-lg transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6"
            style={{
              backgroundColor: role.accent,
              boxShadow: `0 8px 24px ${role.glow}`,
            }}
          >
            {Icon ? <Icon className="h-6 w-6" /> : null}
          </div>
          <div>
            <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
              {featured ? "Featured role" : "Role"}
            </div>
            <h3
              className={cn(
                "font-display font-semibold tracking-tight",
                featured ? "text-2xl sm:text-3xl" : "text-lg"
              )}
            >
              {role.label}
            </h3>
          </div>
        </div>

        {/* Tagline */}
        <p
          className={cn(
            "mt-4 italic text-muted-foreground",
            featured ? "text-base sm:text-lg" : "text-sm"
          )}
        >
          &ldquo;{role.tagline}&rdquo;
        </p>

        {/* Description */}
        <p
          className={cn(
            "mt-3 text-muted-foreground",
            featured ? "text-base leading-relaxed" : "text-sm leading-relaxed"
          )}
        >
          {role.description}
        </p>

        {/* Spacer to push the CTA to the bottom */}
        <div className="flex-1" />

        {/* Enter role view ghost CTA */}
        <a
          href="#platform"
          className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-medical transition-colors hover:text-cyan-500"
          aria-label={`Enter ${role.label} view`}
        >
          Enter {role.label} view
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
        </a>
      </div>
    </motion.article>
  );
}

export default function RolesSection() {
  const [patient, ...others] = ROLES;

  return (
    <section
      id="roles"
      className="relative py-20 sm:py-28"
      aria-label="Who MedLink SA serves"
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
            <span className="status-dot bg-medical" />
            Who it serves
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="text-foreground">One network,</span>{" "}
            <span className="text-gradient-medical">five points of view</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            The same patient, seen through five lenses. Each role gets a focused
            workspace &mdash; never a one-size-fits-all dashboard.
          </p>
        </motion.div>

        {/* Asymmetric grid: featured patient card + 4 smaller role cards */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="User role cards"
        >
          <RoleCard role={patient} featured />
          {others.map((role) => (
            <RoleCard key={role.id} role={role} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
