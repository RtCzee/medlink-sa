"use client";

import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { NETWORK_ACTIVITY, PROVINCE_SPLIT } from "@/lib/data";
import {
  Crown,
  Users,
  Building2,
  Stethoscope,
  ShieldCheck,
  Server,
  ArrowUpRight,
} from "lucide-react";
import type { TabId, AdminUser, AdminHospital, PendingDoctor, PendingPatient } from "./types";
import {
  fadeUp,
  AUDIT_KIND_META,
  SectionHeader,
  StatCard,
  HealthRow,
  ChartTooltip,
} from "./shared";
import { AUDIT_EXTENDED } from "./mock-data";
import { Button } from "@/components/ui/button";

interface OverviewTabProps {
  users: AdminUser[];
  hospitals: AdminHospital[];
  pendingDoctors: PendingDoctor[];
  pendingPatients: PendingPatient[];
  setTab: (t: TabId) => void;
}

export function OverviewTab({
  users,
  hospitals,
  pendingDoctors,
  pendingPatients,
  setTab,
}: OverviewTabProps) {
  const totalUsers = users.length;
  const verifiedHospitals = hospitals.filter((h) => h.verified).length;
  const activeDoctors = users.filter((u) => u.role === "Doctor" && u.verified === "approved").length;
  const pendingCount =
    users.filter((u) => u.verified === "pending").length +
    hospitals.filter((h) => !h.verified).length +
    pendingDoctors.length +
    pendingPatients.length;

  return (
    <div className="space-y-6">
      <motion.div initial="hidden" animate="show">
        <SectionHeader
          kicker="National command center"
          icon={Crown}
          title={
            <>
              National <span className="text-gradient-medical">command center</span>
            </>
          }
          subtitle="Live oversight of the MedLink SA network across all 9 provinces."
        />
      </motion.div>

      {/* Stat cards */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        <StatCard label="Total users" value={totalUsers.toLocaleString()} delta="+12 this week" deltaTone="up" icon={Users} tint="from-medical to-cyan-400" />
        <StatCard label="Verified hospitals" value={String(verifiedHospitals)} delta="+1 today" deltaTone="up" icon={Building2} tint="from-emerald-500 to-cyan-400" />
        <StatCard label="Active doctors" value={String(activeDoctors)} delta="All on duty" deltaTone="flat" icon={Stethoscope} tint="from-violet-500 to-medical" />
        <StatCard label="Pending verifications" value={String(pendingCount)} delta="Needs review" deltaTone="down" icon={ShieldCheck} tint="from-amber-500 to-rose-400" />
      </motion.div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold">Network activity</h3>
              <p className="text-xs text-muted-foreground">Consultations vs prescriptions · last 7 days</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-medical" /> Consults
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> Scripts
              </span>
            </div>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={NETWORK_ACTIVITY} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="consults-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--medical)" stopOpacity={1} />
                    <stop offset="100%" stopColor="var(--medical)" stopOpacity={0.5} />
                  </linearGradient>
                  <linearGradient id="scripts-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={1} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <RTooltip content={<ChartTooltip />} cursor={{ fill: "var(--medical)", fillOpacity: 0.05 }} />
                <Bar dataKey="consults" name="Consults" fill="url(#consults-grad)" radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="scripts" name="Scripts" fill="url(#scripts-grad)" radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show" className="glass-panel p-5">
          <div className="mb-4">
            <h3 className="font-display text-base font-semibold">Network by province</h3>
            <p className="text-xs text-muted-foreground">Active facilities · share %</p>
          </div>
          <div className="relative h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={PROVINCE_SPLIT}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={3}
                  stroke="none"
                >
                  {PROVINCE_SPLIT.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <RTooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display text-2xl font-bold">9</div>
                <div className="text-[0.65rem] text-muted-foreground">Provinces</div>
              </div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
            {PROVINCE_SPLIT.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                <span className="truncate text-muted-foreground">{p.name}</span>
                <span className="ml-auto font-medium">{p.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* System health + audit preview */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Server className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold">System health</h3>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
          </div>
          <div className="space-y-3">
            <HealthRow label="Uptime" value="99.98%" tone="emerald" hint="30-day rolling" />
            <HealthRow label="API latency (p50)" value="98 ms" tone="emerald" hint="Gauteng edge" />
            <HealthRow label="DHIS2 sync" value="In sync" tone="emerald" hint="12 min ago · queue 0" />
            <HealthRow label="Active sessions" value="4,283" tone="medical" hint="Across 9 provinces" />
          </div>
          <Button onClick={() => setTab("health")} variant="secondary" className="mt-4 w-full gap-2 rounded-lg px-3 py-2 text-sm font-medium">
            Open monitoring
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show" className="glass-panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold">Recent audit</h3>
              <p className="text-xs text-muted-foreground">Latest activity on the network</p>
            </div>
            <Button onClick={() => setTab("audit")} variant="ghost" className="rounded-lg px-2.5 py-1 text-xs font-medium text-medical">
              View all
            </Button>
          </div>
          <ol className="space-y-3">
            {AUDIT_EXTENDED.slice(0, 5).map((e) => {
              const meta = AUDIT_KIND_META[e.kind];
              const Icon = meta.icon;
              return (
                <li key={e.id} className="flex items-start gap-3">
                  <span className={cn("mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full", meta.bg, meta.color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-snug">
                      <span className="font-semibold">{e.actor}</span>{" "}
                      <span className="text-muted-foreground">{e.action}</span>{" "}
                      <span className="font-medium">{e.target}</span>
                    </p>
                    <p className="text-[0.7rem] text-muted-foreground">{e.time} · {meta.label}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
