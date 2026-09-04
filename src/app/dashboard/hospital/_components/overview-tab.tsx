"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
} from "recharts";
import {
  BedDouble,
  ListOrdered,
  DoorOpen,
  Stethoscope,
  Building2,
  ShieldCheck,
  Star,
  ArrowRight,
  AlertTriangle,
  User,
} from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { BED_GRID, HOSPITAL_STAFF, HOSPITAL_QUEUE, APPROVALS_PENDING, FACILITIES } from "@/lib/data";
import { Button } from "@/components/ui/button";
import type { TabId, BedStatus, BedRow } from "./types";
import { BED_STATUS_META, PATIENT_FLOW } from "./mock-data";
import { StatCard, StatusPill, GlassTooltip } from "./shared";

export default function OverviewTab({ setTab }: { setTab: (t: TabId) => void }) {
  const { user } = useAuth();
  const facility = FACILITIES.find((f) => f.name === user?.facility);
  const beds = useMemo(() => BED_GRID as BedRow[], []);
  const counts = useMemo(() => {
    const c = { occupied: 0, available: 0, cleaning: 0, reserved: 0 };
    beds.forEach((b) => {
      c[b.status] += 1;
    });
    return c;
  }, [beds]);
  const onDuty = HOSPITAL_STAFF.filter((s) => s.status === "on-duty").length;
  const inQueue = HOSPITAL_QUEUE.length;

  const occupancyData = (["occupied", "available", "cleaning", "reserved"] as BedStatus[]).map(
    (s) => ({
      name: BED_STATUS_META[s].label,
      value: counts[s],
      color: BED_STATUS_META[s].chart,
    })
  );

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel relative overflow-hidden p-6 sm:p-8"
      >
        <div
          className="glow-orb"
          style={{
            width: 320,
            height: 320,
            background: "var(--glow-1)",
            top: "-30%",
            right: "-5%",
            opacity: 0.35,
          }}
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">
                <Building2 className="h-3 w-3" />
                Hospital workspace
              </span>
              <StatusPill tone="emerald">
                <ShieldCheck className="h-3 w-3" />
                DOH-verified
              </StatusPill>
              {facility?.open && (
                <StatusPill tone="emerald">24/7 emergency</StatusPill>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-gradient-medical">
                {user?.facility || "Chris Hani Baragwanath Hospital"}
              </span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {facility?.location || "Soweto, Gauteng"} ·{" "}
              {facility?.province || "Gauteng"} · {beds.length} licensed beds ·{" "}
              {facility?.rating?.toFixed(1) || "4.4"}
              <Star className="ml-1 inline h-3 w-3 fill-amber-400 text-amber-400" />{" "}
              patient rating
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <div className="text-xs text-muted-foreground">Last sync</div>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <span className="status-dot bg-emerald-500" />
              Just now · DHIS2 OK
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total beds"
          value={beds.length}
          hint="Across 5 wards"
          icon={BedDouble}
          accent="#2563eb"
          trend="+4 vs last week"
          trendDir="up"
          ariaLabel={`Total beds: ${beds.length}`}
        />
        <StatCard
          label="Available beds"
          value={counts.available}
          hint={`${Math.round((counts.available / beds.length) * 100)}% capacity free`}
          icon={DoorOpen}
          accent="#10b981"
          trend={`${counts.reserved} reserved`}
          trendDir="flat"
          ariaLabel={`Available beds: ${counts.available}`}
        />
        <StatCard
          label="On-duty staff"
          value={onDuty}
          hint={`${HOSPITAL_STAFF.length} total on roster`}
          icon={Stethoscope}
          accent="#06b6d4"
          trend="Night shift starts 18:00"
          trendDir="flat"
          ariaLabel={`On-duty staff: ${onDuty}`}
        />
        <StatCard
          label="Patients in queue"
          value={inQueue}
          hint="Now serving #37"
          icon={ListOrdered}
          accent="#f59e0b"
          trend="Avg wait 18 min"
          trendDir="down"
          ariaLabel={`Patients in queue: ${inQueue}`}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Bed occupancy donut */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 lg:col-span-1"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">
                Bed occupancy
              </h3>
              <p className="text-xs text-muted-foreground">Live, all wards</p>
            </div>
            <Button
              onClick={() => setTab("beds")}
              variant="ghost"
              size="sm"
              className="gap-1 rounded-lg px-2 py-1"
              aria-label="Open beds & wards tab"
            >
              View grid
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="relative h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  stroke="none"
                >
                  {occupancyData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip content={<GlassTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold">
                {Math.round((counts.occupied / beds.length) * 100)}%
              </span>
              <span className="text-xs text-muted-foreground">occupied</span>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {occupancyData.map((d) => (
              <div
                key={d.name}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-2.5 py-1.5"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="flex-1 text-xs text-muted-foreground">
                  {d.name}
                </span>
                <span className="text-xs font-semibold">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Patient flow area chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">
                Patient flow today
              </h3>
              <p className="text-xs text-muted-foreground">
                Hourly admissions vs discharges
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-medical" />
                Admissions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                Discharges
              </span>
            </div>
          </div>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={PATIENT_FLOW}
                margin={{ top: 6, right: 8, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="g-adm" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="var(--medical)"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="100%"
                      stopColor="var(--medical)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                  <linearGradient id="g-dis" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="t"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                />
                <RTooltip content={<GlassTooltip />} />
                <Area
                  type="monotone"
                  dataKey="admissions"
                  stroke="var(--medical)"
                  strokeWidth={2.5}
                  fill="url(#g-adm)"
                />
                <Area
                  type="monotone"
                  dataKey="discharges"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fill="url(#g-dis)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Bottom row: live queue + pending approvals alert */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-semibold">
                Live queue
              </h3>
              <p className="text-xs text-muted-foreground">
                Real-time triage counter
              </p>
            </div>
            <Button
              onClick={() => setTab("queue")}
              variant="ghost"
              size="sm"
              className="gap-1 rounded-lg px-2 py-1"
              aria-label="Open queue tab"
            >
              Manage queue
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Now serving
              </div>
              <div className="font-display text-5xl font-bold text-gradient-medical">
                #37
              </div>
            </div>
            <div className="flex-1" />
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="font-display text-xl font-bold">
                  {inQueue - 1}
                </div>
                <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Waiting
                </div>
              </div>
              <div>
                <div className="font-display text-xl font-bold">18m</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Avg wait
                </div>
              </div>
              <div>
                <div className="font-display text-xl font-bold">2m</div>
                <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Since call
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {HOSPITAL_QUEUE.slice(0, 4).map((q) => (
              <div
                key={q.number}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-foreground/[0.02] px-3 py-2"
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground/5 text-xs font-bold">
                  {q.number}
                </span>
                <span className="flex-1 truncate text-sm font-medium">
                  {q.name}
                </span>
                <span className="hidden text-xs text-muted-foreground sm:block">
                  {q.service}
                </span>
                {q.status === "serving" && (
                  <StatusPill tone="medical">Now serving</StatusPill>
                )}
                {q.status === "called" && (
                  <StatusPill tone="amber">Called</StatusPill>
                )}
                {q.status === "waiting" && (
                  <StatusPill tone="slate">
                    {q.waitMin}m
                  </StatusPill>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pending approvals alert card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <Button
            onClick={() => setTab("approvals")}
            variant="ghost"
            className="glass-panel card-premium group h-full w-full p-5 text-left"
            aria-label="Pending approvals — open approvals tab"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500/15 text-amber-500"
                  aria-hidden
                >
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <span className="grid h-6 min-w-6 place-items-center rounded-full bg-amber-500 px-1.5 text-[0.7rem] font-bold text-white">
                  {APPROVALS_PENDING.length}
                </span>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">
                Pending approvals
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {APPROVALS_PENDING.length} clinician
                {APPROVALS_PENDING.length !== 1 ? "s" : ""} awaiting your
                verification before they can practise at this facility.
              </p>
              <div className="mt-3 space-y-1.5">
                {APPROVALS_PENDING.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-foreground/[0.02] px-2.5 py-1.5"
                  >
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate text-xs font-medium">
                      {a.name}
                    </span>
                    <span className="text-[0.65rem] text-muted-foreground">
                      {a.applied}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-4">
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-500 transition-transform group-hover:translate-x-1">
                  Review approvals
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
