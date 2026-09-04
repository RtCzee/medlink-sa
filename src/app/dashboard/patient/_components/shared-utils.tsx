"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function formatRand(n: number) {
  return `R${n.toLocaleString("en-ZA", { minimumFractionDigits: 0 })}`;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "medical",
  index = 0,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  accent?: string;
  index?: number;
}) {
  const accentMap: Record<string, string> = {
    medical: "from-medical/20 to-medical/5 text-medical",
    cyan: "from-cyan-500/20 to-cyan-500/5 text-cyan-500",
    amber: "from-amber-500/20 to-amber-500/5 text-amber-500",
    emerald: "from-emerald-500/20 to-emerald-500/5 text-emerald-500",
    red: "from-red-500/20 to-red-500/5 text-red-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="glass-panel group relative overflow-hidden p-4"
    >
      <div className={`absolute -right-4 -top-4 h-20 w-20 rounded-full bg-gradient-to-br ${accentMap[accent] ?? accentMap.medical} blur-2xl opacity-60`} />
      <div className="relative">
        <div className="mb-2 flex items-center gap-2">
          <span className={`grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br ${accentMap[accent] ?? accentMap.medical}`}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>
      </div>
    </motion.div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    scheduled: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    confirmed: "bg-medical/10 text-medical",
    completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    cancelled: "bg-red-500/10 text-red-600 dark:text-red-400",
    no_show: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    pending: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    active: "bg-medical/10 text-medical",
    refilled: "bg-cyan-500/10 text-cyan-500",
    expired: "bg-red-500/10 text-red-600 dark:text-red-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${map[status] ?? map.pending}`}>
      {status.replace("_", " ")}
    </span>
  );
}

export function ViewHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}
