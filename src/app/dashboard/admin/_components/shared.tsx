"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { TabId, AuditKind, VerifiedStatus, AdminUser } from "./types";
import type { TooltipProps } from "recharts";
import {
  HeartPulse,
  Stethoscope,
  Building2,
  Activity,
  KeyRound,
  FileText,
  CheckCircle2,
  Ban,
  Cpu,
  ShieldCheck,
} from "lucide-react";

/* ---------- Animation variants ---------- */

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/* ---------- Style maps ---------- */

export const VERIFIED_STYLE: Record<VerifiedStatus, { label: string; dot: string; badge: string }> = {
  approved: { label: "Verified", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  pending: { label: "Pending", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  rejected: { label: "Rejected", dot: "bg-rose-500", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  suspended: { label: "Suspended", dot: "bg-foreground/40", badge: "bg-foreground/5 text-muted-foreground border-foreground/10" },
};

export const AUDIT_KIND_META: Record<
  AuditKind,
  { label: string; icon: typeof Activity; color: string; bg: string; ring: string }
> = {
  auth: { label: "Auth", icon: KeyRound, color: "text-medical", bg: "bg-medical/10", ring: "ring-medical/20" },
  edit: { label: "Edit", icon: FileText, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", ring: "ring-amber-500/20" },
  create: { label: "Create", icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", ring: "ring-emerald-500/20" },
  delete: { label: "Delete", icon: Ban, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", ring: "ring-rose-500/20" },
  system: { label: "System", icon: Cpu, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10", ring: "ring-violet-500/20" },
  verify: { label: "Verify", icon: ShieldCheck, color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-500/10", ring: "ring-cyan-500/20" },
};

export const ROLE_STYLE: Record<AdminUser["role"], { icon: typeof Activity; tint: string }> = {
  Patient: { icon: HeartPulse, tint: "from-medical to-cyan-400" },
  Doctor: { icon: Stethoscope, tint: "from-emerald-500 to-cyan-400" },
  Hospital: { icon: Building2, tint: "from-violet-500 to-medical" },
  Pharmacy: { icon: Activity, tint: "from-amber-500 to-rose-400" },
};

/* ---------- Recharts tooltip ---------- */

export function ChartTooltip({ active, payload, label }: TooltipProps<string, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <div className="mb-1 font-semibold">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{p.payload?.unit || ""}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------- Section header ---------- */

interface SectionHeaderProps {
  kicker: string;
  icon: typeof Activity;
  title: React.ReactNode;
  subtitle: string;
}

export function SectionHeader({ kicker, icon: Icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-medical">
        <Icon className="h-3.5 w-3.5" />
        {kicker}
      </div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

/* ---------- Stat card ---------- */

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  icon: typeof Activity;
  tint: string;
}

export function StatCard({ label, value, delta, deltaTone, icon: Icon, tint }: StatCardProps) {
  return (
    <motion.div variants={fadeUp} className="glass-panel p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="font-display text-3xl font-bold">{value}</p>
          {delta && (
            <p className={cn("text-xs font-medium", deltaTone === "up" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {delta}
            </p>
          )}
        </div>
        <span className={cn("grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white", tint)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.div>
  );
}

/* ---------- Health row ---------- */

interface HealthRowProps {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "medical" | "rose";
  hint?: string;
}

const HEALTH_TONE: Record<string, { dot: string; value: string }> = {
  emerald: { dot: "bg-emerald-500", value: "text-emerald-600 dark:text-emerald-400" },
  amber: { dot: "bg-amber-500", value: "text-amber-600 dark:text-amber-400" },
  medical: { dot: "bg-medical", value: "text-medical" },
  rose: { dot: "bg-rose-500", value: "text-rose-600 dark:text-rose-400" },
};

export function HealthRow({ label, value, tone, hint }: HealthRowProps) {
  const t = HEALTH_TONE[tone];
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", t.dot)} />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-right">
        <span className={cn("text-sm font-medium", t.value)}>{value}</span>
        {hint && <p className="text-[0.65rem] text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

/* ---------- Detail cell ---------- */

interface DetailCellProps {
  icon: typeof Activity;
  label: string;
  value: string;
  mono?: boolean;
}

export function DetailCell({ icon: Icon, label, value, mono }: DetailCellProps) {
  return (
    <div>
      <div className="mb-0.5 flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className={cn("font-medium", mono && "font-mono text-[0.7rem]")}>{value}</div>
    </div>
  );
}

/* ---------- Panel header ---------- */

interface PanelHeaderProps {
  icon: typeof Activity;
  title: string;
  subtitle: string;
}

export function PanelHeader({ icon: Icon, title, subtitle }: PanelHeaderProps) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/10 text-medical">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <p className="text-[0.7rem] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

/* ---------- Session row ---------- */

interface SessionRowProps {
  label: string;
  value: string;
  pct: number;
}

export function SessionRow({ label, value, pct }: SessionRowProps) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-medical to-cyan-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6 }}
        />
      </div>
    </div>
  );
}

/* ---------- Resource bar ---------- */

interface ResourceBarProps {
  icon: typeof Activity;
  label: string;
  value: number;
  tint: string;
}

export function ResourceBar({ icon: Icon, label, value, tint }: ResourceBarProps) {
  const tone = value > 80 ? "text-rose-600 dark:text-rose-400" : value > 60 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className={cn("font-medium", tone)}>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", tint)}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

/* ---------- Toggle row ---------- */

interface ToggleRowProps {
  icon: typeof Activity;
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  tone?: "medical" | "amber" | "emerald";
}

export function ToggleRow({ icon: Icon, title, desc, checked, onCheckedChange, tone = "medical" }: ToggleRowProps) {
  const toneCls = {
    medical: "text-medical bg-medical/10",
    amber: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
    emerald: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
  }[tone];
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className={cn("grid h-8 w-8 place-items-center rounded-lg", toneCls)}>
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="text-[0.7rem] text-muted-foreground">{desc}</div>
        </div>
      </div>
      <div
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-6 w-11 cursor-pointer rounded-full transition-colors",
          checked ? "bg-medical" : "bg-foreground/20"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </div>
    </div>
  );
}
