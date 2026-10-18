"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  Pill,
  MessageSquare,
  Settings,
  Search,
  Bell,
  TrendingUp,
  TrendingDown,
  Activity,
  BedDouble,
  Stethoscope,
  ArrowUpRight,
  MoreHorizontal,
} from "lucide-react";
import {
  PATIENT_FLOW,
  NETWORK_ACTIVITY,
  PROVINCE_SPLIT,
  VITALS,
} from "@/lib/data";
import { cn, getInitials } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------------- Custom Tooltip ---------------- */
type TooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number | string;
    color?: string;
    dataKey?: string | number;
  }>;
  label?: string | number;
};

function GlassTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs shadow-lg">
      {label !== undefined && (
        <div className="mb-1 font-semibold text-foreground">{label}</div>
      )}
      <div className="space-y-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color }}
            />
            <span className="text-muted-foreground">{p.name}</span>
            <span className="ml-auto font-semibold tabular-nums text-foreground">
              {typeof p.value === "number"
                ? p.value.toLocaleString("en-ZA")
                : p.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Sidebar items ---------------- */
type SidebarItem = {
  Icon: React.ElementType;
  label: string;
  active?: boolean;
  badge?: number;
};

const SIDEBAR_ICONS: SidebarItem[] = [
  { Icon: LayoutDashboard, label: "Dashboard", active: true },
  { Icon: Calendar, label: "Schedule" },
  { Icon: Users, label: "Patients" },
  { Icon: FileText, label: "Records" },
  { Icon: Pill, label: "Pharmacy" },
  { Icon: MessageSquare, label: "Messages", badge: 3 },
  { Icon: Settings, label: "Settings" },
];

/* ---------------- Stat tiles ---------------- */
const STAT_TILES = [
  {
    id: "patients",
    label: "Active patients",
    value: "4.21M",
    delta: "+4.2%",
    up: true,
    sparkKey: "bp" as const,
    color: "var(--chart-1)",
  },
  {
    id: "consults",
    label: "Consults today",
    value: "1,284",
    delta: "+12.0%",
    up: true,
    sparkKey: "hr" as const,
    color: "var(--chart-2)",
  },
  {
    id: "beds",
    label: "Bed occupancy",
    value: "73%",
    delta: "-1.8%",
    up: false,
    sparkKey: "spo2" as const,
    color: "var(--chart-5)",
  },
];

/* ---------------- High-risk patients ---------------- */
const HIGH_RISK = [
  {
    id: "p1",
    name: "Thandiwe Mokoena",
    initials: "TM",
    condition: "Hypertension · Stage 2",
    risk: "critical" as const,
    spark: [128, 131, 126, 133, 129, 124, 127],
  },
  {
    id: "p2",
    name: "Sipho Dlamini",
    initials: "SD",
    condition: "Post-op cardiac",
    risk: "high" as const,
    spark: [86, 84, 90, 88, 92, 87, 89],
  },
  {
    id: "p3",
    name: "Aisha Patel",
    initials: "AP",
    condition: "Diabetes · T2",
    risk: "moderate" as const,
    spark: [142, 138, 140, 145, 139, 141, 137],
  },
];

const RISK_STYLES: Record<
  "critical" | "high" | "moderate",
  { label: string; className: string; dot: string }
> = {
  critical: {
    label: "Critical",
    className:
      "bg-rose-500/12 text-rose-500 border-rose-500/30 dark:text-rose-400",
    dot: "bg-rose-500",
  },
  high: {
    label: "High",
    className:
      "bg-amber-500/12 text-amber-600 border-amber-500/30 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  moderate: {
    label: "Moderate",
    className:
      "bg-yellow-500/12 text-yellow-700 border-yellow-500/30 dark:text-yellow-400",
    dot: "bg-yellow-500",
  },
};

/* ---------------- Sparkline ---------------- */
function Sparkline({
  data,
  dataKey,
  color,
}: {
  data: Array<Record<string, number | string>>;
  dataKey: string;
  color: string;
}) {
  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 2, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={`spark-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.6}
            fill={`url(#spark-${dataKey})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- Risk sparkline (tiny line) ---------------- */
function RiskSpark({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <div className="h-7 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 1, right: 1, bottom: 1, left: 1 }}
        >
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.6}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PlatformPreview() {
  return (
    <section id="platform" className="relative py-20 sm:py-28">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="glow-orb animate-float-slow"
          style={{
            width: 420,
            height: 420,
            background: "var(--glow-1)",
            top: "10%",
            left: "-6%",
          }}
        />
        <div
          className="glow-orb animate-float-slow"
          style={{
            width: 380,
            height: 380,
            background: "var(--glow-2)",
            bottom: "0%",
            right: "-4%",
            animationDelay: "-5s",
          }}
        />
        <div className="bg-dots absolute inset-0 opacity-30 dark:opacity-20" />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <div className="mb-10 flex flex-col items-start gap-3 sm:mb-14 sm:items-center sm:text-center">
          <span className="chip">
            <span className="status-dot bg-medical" />
            <span className="uppercase tracking-widest text-medical">
              The platform
            </span>
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-gradient sm:text-4xl lg:text-5xl">
            A living operating system for healthcare
          </h2>
          <p className="max-w-2xl text-balance text-muted-foreground sm:text-lg">
            One workspace for triage, records, charts and teams — built for the
            pace of a ward and the scale of a nation.
          </p>
        </div>

        {/* Dashboard panel */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: EASE }}
          className="glass-card card-premium relative overflow-hidden rounded-3xl p-0 shadow-[0_30px_80px_-20px_rgba(2,6,23,0.25)]"
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            </div>
            <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-lg border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground">
              <span className="status-dot bg-emerald-500" />
              <span className="truncate font-mono text-[0.7rem]">
                app.medlink.sa/dashboard
              </span>
              <span className="ml-auto hidden text-[0.65rem] uppercase tracking-wider text-emerald-500 sm:inline">
                Secure
              </span>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <button className="btn-ghost grid h-7 w-7 place-items-center rounded-md">
                <Bell className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Body: sidebar + main */}
          <div className="flex flex-col lg:flex-row">
            {/* Sidebar */}
            <aside className="border-b border-border/60 px-3 py-4 lg:w-[68px] lg:border-b-0 lg:border-r lg:px-0 lg:py-6">
              <div className="flex items-center justify-center gap-2 lg:flex-col lg:gap-2.5">
                {SIDEBAR_ICONS.map(({ Icon, label, active, badge }) => (
                  <button
                    key={label}
                    aria-label={label}
                    className={cn(
                      "group relative grid h-10 w-10 place-items-center rounded-xl border transition-all duration-300",
                      active
                        ? "border-transparent bg-gradient-to-br from-medical to-cyan-500 text-white shadow-[0_6px_18px_var(--glow-1)]"
                        : "border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                    )}
                  >
                    <Icon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2.1} />
                    {badge && (
                      <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[0.6rem] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </aside>

            {/* Main column */}
            <div className="flex-1 bg-background/30">
              {/* Top bar */}
              <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
                <div className="input-premium flex h-9 flex-1 items-center gap-2 rounded-lg px-3 text-sm">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Search patients, records…
                  </span>
                  <kbd className="ml-auto hidden rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold sm:inline">
                    /
                  </kbd>
                </div>
                <div className="chip hidden border-emerald-500/30 bg-emerald-500/10 text-emerald-600 sm:flex dark:text-emerald-400">
                  <span className="status-dot bg-emerald-500" />
                  Live
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-xs font-bold text-white">
                  TM
                </div>
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-12 gap-3 p-3 sm:gap-4 sm:p-5">
                {/* Stat tiles */}
                {STAT_TILES.map((t) => (
                  <div
                    key={t.id}
                    className="stat-card col-span-12 sm:col-span-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {t.label}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-0.5 text-[0.7rem] font-semibold",
                          t.up ? "text-emerald-500" : "text-rose-500"
                        )}
                      >
                        {t.up ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {t.delta}
                      </span>
                    </div>
                    <div className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground">
                      {t.value}
                    </div>
                    <div className="mt-2">
                      <Sparkline
                        data={VITALS}
                        dataKey={t.sparkKey}
                        color={t.color}
                      />
                    </div>
                  </div>
                ))}

                {/* Area chart */}
                <div className="stat-card col-span-12 lg:col-span-8">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Patient flow
                      </h3>
                      <p className="text-[0.7rem] text-muted-foreground">
                        Admissions vs discharges · today
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[0.7rem]">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />
                        Admissions
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-[var(--chart-2)]" />
                        Discharges
                      </span>
                    </div>
                  </div>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={PATIENT_FLOW}
                        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="g-adm" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor="var(--chart-1)"
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--chart-1)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                          <linearGradient id="g-dis" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="0%"
                              stopColor="var(--chart-2)"
                              stopOpacity={0.45}
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--chart-2)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="t"
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                        />
                        <Tooltip
                          content={<GlassTooltip />}
                          cursor={{
                            stroke: "var(--medical)",
                            strokeDasharray: "3 3",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="admissions"
                          stroke="var(--chart-1)"
                          strokeWidth={2}
                          fill="url(#g-adm)"
                        />
                        <Area
                          type="monotone"
                          dataKey="discharges"
                          stroke="var(--chart-2)"
                          strokeWidth={2}
                          fill="url(#g-dis)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie chart */}
                <div className="stat-card col-span-12 sm:col-span-6 lg:col-span-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Network by province
                      </h3>
                      <p className="text-[0.7rem] text-muted-foreground">
                        Active patient share
                      </p>
                    </div>
                  </div>
                  <div className="relative h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={PROVINCE_SPLIT}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={2}
                          stroke="var(--background)"
                          strokeWidth={2}
                        >
                          {PROVINCE_SPLIT.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<GlassTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
                        Total
                      </span>
                      <span className="font-display text-lg font-semibold">
                        4.2M
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                    {PROVINCE_SPLIT.map((p) => (
                      <div
                        key={p.name}
                        className="flex items-center gap-1.5 text-[0.7rem]"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: p.color }}
                        />
                        <span className="truncate text-muted-foreground">
                          {p.name}
                        </span>
                        <span className="ml-auto font-semibold tabular-nums">
                          {p.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar chart */}
                <div className="stat-card col-span-12 lg:col-span-7">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Network activity
                      </h3>
                      <p className="text-[0.7rem] text-muted-foreground">
                        Consults & scripts · last 7 days
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[0.7rem]">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-[var(--chart-1)]" />
                        Consults
                      </span>
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-[var(--chart-4)]" />
                        Scripts
                      </span>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={NETWORK_ACTIVITY}
                        margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                        barGap={2}
                        barCategoryGap="22%"
                      >
                        <defs>
                          <linearGradient id="g-bar-consults" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={1} />
                            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                          </linearGradient>
                          <linearGradient id="g-bar-scripts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={1} />
                            <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.35} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="d"
                          tick={{
                            fontSize: 10,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "var(--muted-foreground)",
                          }}
                          axisLine={false}
                          tickLine={false}
                          width={36}
                          tickFormatter={(v) =>
                            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
                          }
                        />
                        <Tooltip
                          content={<GlassTooltip />}
                          cursor={{
                            fill: "color-mix(in oklab, var(--medical) 8%, transparent)",
                          }}
                        />
                        <Bar
                          dataKey="consults"
                          fill="url(#g-bar-consults)"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={26}
                        />
                        <Bar
                          dataKey="scripts"
                          fill="url(#g-bar-scripts)"
                          radius={[3, 3, 0, 0]}
                          maxBarSize={26}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* High-risk patients */}
                <div className="stat-card col-span-12 lg:col-span-5">
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        High-risk patients
                      </h3>
                      <p className="text-[0.7rem] text-muted-foreground">
                        AI-flagged for follow-up
                      </p>
                    </div>
                    <button className="btn-ghost flex items-center gap-1 rounded-md px-2 py-1 text-[0.7rem] font-semibold text-medical">
                      View all
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {HIGH_RISK.map((p) => {
                      const r = RISK_STYLES[p.risk];
                      return (
                        <div
                          key={p.id}
                          className="group flex items-center gap-3 rounded-xl border border-border/50 bg-background/40 p-2.5 transition-all duration-300 hover:border-medical/40 hover:bg-medical/5"
                        >
                          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-medical/80 to-cyan-500/80 text-xs font-bold text-white">
                            {p.initials}
                            <span
                              className={cn(
                                "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background",
                                r.dot
                              )}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-foreground">
                              {p.name}
                            </div>
                            <div className="truncate text-[0.7rem] text-muted-foreground">
                              {p.condition}
                            </div>
                          </div>
                          <RiskSpark
                            data={p.spark}
                            color={
                              p.risk === "critical"
                                ? "#f43f5e"
                                : p.risk === "high"
                                  ? "#f59e0b"
                                  : "#eab308"
                            }
                          />
                          <span
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                              r.className
                            )}
                          >
                            {r.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hairline mt-3" />
                  <div className="mt-3 flex items-center justify-between text-[0.7rem] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-medical" />
                      Updated 2 min ago
                    </span>
                    <span className="flex items-center gap-1">
                      <BedDouble className="h-3 w-3" />
                      3 of 1,284 flagged
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer status bar */}
          <div className="flex items-center justify-between gap-2 border-t border-border/60 px-4 py-2.5 text-[0.7rem] text-muted-foreground sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="status-dot bg-emerald-500" />
                All systems normal
              </span>
              <span className="hidden items-center gap-1.5 sm:flex">
                <Stethoscope className="h-3 w-3" />
                8 clinicians online
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">DHIS2 synced · 08:14</span>
              <button className="btn-ghost grid h-6 w-6 place-items-center rounded">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Caption */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Illustrative dashboard · live prototype renders with mock data
        </p>
      </div>
    </section>
  );
}
