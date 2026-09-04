"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Server,
  Database,
  Globe,
  Zap,
  RefreshCw,
  Power,
  Activity,
  Clock,
  Users,
  Cpu,
  HardDrive,
  MemoryStick,
  Wifi,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
} from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, ChartTooltip, SectionHeader, PanelHeader, SessionRow, ResourceBar } from "./shared";
import { SYSTEM_METRICS, API_RESPONSE_TREND, SA_PROVINCES_HEALTH } from "./mock-data";

/* ---------- component ---------- */

export function HealthTab() {
  const m = SYSTEM_METRICS;

  const uptimeData = [{ name: "uptime", value: m.uptime, fill: "#10b981" }];
  const apiData = [{ name: "api", value: Math.min(m.apiLatency / 5, 100), fill: m.apiLatency > 200 ? "#f43f5e" : m.apiLatency > 150 ? "#f59e0b" : "#0ea5e9" }];

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <SectionHeader
          kicker="System Health"
          icon={Server}
          title="Infrastructure Overview"
          subtitle="Real-time platform metrics, uptime monitoring and resource utilisation."
        />
      </motion.div>

      {/* Top gauges */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2">
        {/* Uptime gauge */}
        <div className="glass-panel flex items-center gap-6 p-6">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="75%" outerRadius="100%" data={uptimeData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold">{m.uptime}%</span>
              <span className="text-[0.6rem] text-muted-foreground">Uptime</span>
            </div>
          </div>
          <div className="space-y-3">
            <PanelHeader icon={Activity} title="Platform Uptime" subtitle="Last 30 days" />
            <div className="space-y-2">
              <SessionRow label="Target" value="99.95%" pct={99.95} />
              <SessionRow label="Actual" value={`${m.uptime}%`} pct={m.uptime} />
            </div>
          </div>
        </div>

        {/* API latency gauge */}
        <div className="glass-panel flex items-center gap-6 p-6">
          <div className="relative h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="75%" outerRadius="100%" data={apiData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={10} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-2xl font-bold">{m.apiLatency}</span>
              <span className="text-[0.6rem] text-muted-foreground">ms avg</span>
            </div>
          </div>
          <div className="space-y-3">
            <PanelHeader icon={Zap} title="API Response Time" subtitle="Average latency" />
            <div className="space-y-2">
              <SessionRow label="P50" value={`${m.apiP50}ms`} pct={m.apiP50 / 3} />
              <SessionRow label="P95" value={`${m.apiP95}ms`} pct={m.apiP95 / 3} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* API trend chart */}
      <motion.div variants={fadeUp} className="glass-panel p-5">
        <PanelHeader icon={Activity} title="API Response Trend" subtitle="24-hour latency pattern" />
        <div className="mt-3 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={API_RESPONSE_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} unit="ms" />
              <RTooltip content={<ChartTooltip />} />
              <Bar dataKey="ms" fill="url(#apiGradient)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="apiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Resource bars + DHIS2 + DB */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2">
        {/* Resources */}
        <div className="glass-panel p-5">
          <PanelHeader icon={Cpu} title="Resource Utilisation" subtitle="Current server load" />
          <div className="mt-3 space-y-4">
            <ResourceBar icon={Cpu} label="CPU Load" value={m.cpuLoad} tint="from-medical to-cyan-400" />
            <ResourceBar icon={MemoryStick} label="Memory" value={m.memoryLoad} tint="from-violet-500 to-medical" />
            <ResourceBar icon={HardDrive} label="Disk" value={m.diskLoad} tint="from-amber-500 to-rose-400" />
          </div>
        </div>

        {/* DHIS2 Sync */}
        <div className="glass-panel p-5">
          <PanelHeader icon={RefreshCw} title="DHIS2 Integration" subtitle="National health data sync" />
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                Last Sync
              </div>
              <span className="text-sm font-medium">{m.dhis2LastSync}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Queue
              </div>
              <span className="text-sm font-medium">{m.dhis2Queue} records</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wifi className="h-4 w-4" />
                Status
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {m.dhis2Status}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* DB + Sessions */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2">
        {/* Database */}
        <div className="glass-panel p-5">
          <PanelHeader icon={Database} title="Database Cluster" subtitle="PostgreSQL primary" />
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <HardDrive className="h-4 w-4" />
                Size
              </div>
              <span className="text-sm font-medium">{m.dbSize}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Activity className="h-4 w-4" />
                Pool
              </div>
              <span className="text-sm font-medium">{m.dbPool}/{m.dbPoolMax}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Wifi className="h-4 w-4" />
                Status
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {m.dbStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Active Sessions */}
        <div className="glass-panel p-5">
          <PanelHeader icon={Users} title="Active Sessions" subtitle="Current connected users" />
          <div className="mt-3 space-y-3">
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                Total
              </div>
              <span className="text-sm font-medium">{m.activeSessions.toLocaleString()}</span>
            </div>
            <SessionRow label="Doctors" value="1,247" pct={35} />
            <SessionRow label="Patients" value="2,891" pct={62} />
            <SessionRow label="Admins" value="145" pct={3} />
          </div>
        </div>
      </motion.div>

      {/* Province latency grid */}
      <motion.div variants={fadeUp} className="glass-panel p-5">
        <PanelHeader icon={MapPin} title="Provincial Health Status" subtitle="Real-time latency and session distribution" />
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SA_PROVINCES_HEALTH.map((p) => (
            <div key={p.name} className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", p.status === "green" ? "bg-emerald-500" : "bg-amber-500")} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{p.name}</div>
                <div className="text-xs text-muted-foreground">{p.sessions} sessions</div>
              </div>
              <div className="text-right">
                <div className={cn("text-sm font-medium", p.latency > 250 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                  {p.latency}ms
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={fadeUp} className="glass-panel border-rose-500/20 p-5">
        <PanelHeader icon={AlertTriangle} title="Danger Zone" subtitle="Irreversible actions — use with caution" />
        <div className="mt-3 flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => toast.info("Restart queued — this is a demo")}
            className="gap-2 border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
          >
            <RefreshCw className="h-4 w-4" /> Restart Services
          </Button>
          <Button
            variant="destructive"
            onClick={() => toast.info("Maintenance mode — this is a demo")}
            className="gap-2"
          >
            <Power className="h-4 w-4" /> Enter Maintenance
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
