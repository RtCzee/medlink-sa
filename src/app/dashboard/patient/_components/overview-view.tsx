"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  ArrowRight, BadgeCheck, Calendar, HeartPulse, Pill, QrCode, Shield, Sparkles, Stethoscope,
  Truck, Video, FileImage, FileText, FlaskConical,
} from "lucide-react";
import type { TooltipProps } from "recharts";

import { CURRENT_TICKET, PATIENT_APPOINTMENTS, PATIENT_PRESCRIPTIONS, PATIENT_RECORDS, PATIENT_VITALS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { greeting, formatRand, StatCard, StatusPill } from "./shared-utils";
import type { User } from "@/lib/auth-context";

function GlassTooltip({ active, payload, label }: TooltipProps<string, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-panel border border-border/60 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: {p.value}
        </div>
      ))}
    </div>
  );
}

interface OverviewViewProps {
  user: User | null;
  goToTab: (t: string, extra?: Record<string, string>) => void;
}

export function OverviewView({ user, goToTab }: OverviewViewProps) {
  const nextAppt = PATIENT_APPOINTMENTS[0];
  const activeRx = PATIENT_PRESCRIPTIONS.filter((p) => p.status === "active").length;
  const healthScore = 87;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">{greeting()},</div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
              {user?.name?.split(" ")[0] ?? "Patient"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.identityVerified ? (
              <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="h-3.5 w-3.5" /> ID verified
              </span>
            ) : null}
            <span className="chip">
              <HeartPulse className="h-3.5 w-3.5 text-medical" /> Health score {healthScore}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Verify banner */}
      {!user?.identityVerified && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => goToTab("verify")}
          className="flex w-full items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left transition hover:border-amber-500/50"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Shield className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="font-semibold text-amber-700 dark:text-amber-300">Verify your SA ID</div>
            <div className="text-sm text-amber-600/80 dark:text-amber-400/80">
              Verified citizens get priority queue access and prescription privileges.
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        </motion.button>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Next appointment"
          value={nextAppt.date === "Today" ? nextAppt.time : nextAppt.date}
          sub={`${nextAppt.doctor} · ${nextAppt.specialty}`}
          accent="medical"
          index={0}
        />
        <StatCard
          icon={Pill}
          label="Active prescriptions"
          value={String(activeRx)}
          sub="2 refills available"
          accent="cyan"
          index={1}
        />
        <StatCard
          icon={QrCode}
          label="Queue position"
          value={`#${CURRENT_TICKET.number}`}
          sub={`~${CURRENT_TICKET.estimatedWaitMin} min wait`}
          accent="amber"
          index={2}
        />
        <StatCard
          icon={HeartPulse}
          label="Health score"
          value={`${healthScore}/100`}
          sub="Up 3 from last week"
          accent="emerald"
          index={3}
        />
      </div>

      {/* Vitals + appointments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Vitals this week</h3>
              <p className="text-xs text-muted-foreground">Blood pressure, heart rate & SpO₂</p>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-medical" /> BP
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> HR
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> SpO₂
              </span>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PATIENT_VITALS} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--medical)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--medical)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSpo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="bp" name="BP (mmHg)" stroke="var(--medical)" strokeWidth={2} fill="url(#gBp)" />
                <Area type="monotone" dataKey="hr" name="HR (bpm)" stroke="#06b6d4" strokeWidth={2} fill="url(#gHr)" />
                <Area type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="#10b981" strokeWidth={2} fill="url(#gSpo2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Upcoming appointments */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="glass-panel p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Upcoming</h3>
            <Button variant="ghost" size="sm" onClick={() => goToTab("appointments")} className="text-xs font-medium text-medical hover:underline">
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {PATIENT_APPOINTMENTS.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-medical/10 text-medical">
                  {a.type === "video" ? <Video className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{a.doctor}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.date} · {a.time} · {a.specialty}
                  </div>
                </div>
                <StatusPill status={a.status} />
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent records + order medicine */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent records</h3>
            <Button variant="ghost" size="sm" onClick={() => goToTab("records")} className="text-xs font-medium text-medical hover:underline">
              View all
            </Button>
          </div>
          <div className="space-y-2">
            {PATIENT_RECORDS.map((r) => {
              const Icon = r.type === "Imaging" ? FileImage : r.type === "Lab" ? FlaskConical : FileText;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-foreground/5 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.facility} · {r.doctor} · {r.date}
                    </div>
                  </div>
                  <StatusPill status="completed" />
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Order medicine quick action */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: 0.08 }}
          onClick={() => goToTab("medicine")}
          className="glass-panel group relative overflow-hidden p-5 text-left"
        >
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-medical/20 blur-3xl transition group-hover:bg-medical/30" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-medical to-cyan-400 text-white shadow-lg">
              <Truck className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">Order medicine</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare prices across Clicks, Dis-Chem, Rosebank Pharmacy & more. Delivery in 30 min.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-medical">
              Browse marketplace
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Health tip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="glass-panel flex items-center gap-4 p-5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <div className="text-sm font-semibold">Today's health insight</div>
          <div className="text-sm text-muted-foreground">
            Staying hydrated helps your kidneys flush toxins — aim for 8 glasses a day.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
