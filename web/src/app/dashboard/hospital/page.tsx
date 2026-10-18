"use client";

/* =========================================================================
   MedLink SA — Hospital Dashboard
   Task ID: 8-HOSPITAL
   Liquid-glass command center for SA hospital administrators.
   ========================================================================= */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
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
  Activity,
  LayoutDashboard,
  BedDouble,
  ListOrdered,
  Users,
  UserCheck,
  Building2,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  Filter,
  X,
  Check,
  Stethoscope,
  HeartPulse,
  Baby,
  Scissors,
  Ambulance,
  ScanLine,
  FlaskConical,
  Sparkles,
  MapPin,
  Phone,
  Globe,
  Mail,
  Calendar,
  Bed,
  User,
  ShieldAlert,
  FileText,
  IdCard,
  DoorOpen,
  Star,
  Hash,
  Save,
  Send,
  Bell,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  BED_GRID,
  HOSPITAL_STAFF,
  HOSPITAL_QUEUE,
  APPROVALS_PENDING,
  FACILITIES,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* =========================================================================
   Types
   ========================================================================= */

type TabId =
  | "overview"
  | "beds"
  | "queue"
  | "staff"
  | "approvals"
  | "departments"
  | "settings";

type BedStatus = "occupied" | "available" | "cleaning" | "reserved";

type BedRow = {
  id: string;
  ward: string;
  status: BedStatus;
  bedNumber: number;
};

type BedPatientDetail = {
  patient: string;
  age: number;
  admitted: string;
  attending: string;
  diagnosis: string;
  expectedDischarge: string;
  insurance: string;
};

/* =========================================================================
   Mock data extensions (realistic SA context, layered on shared exports)
   ========================================================================= */

const SA_FIRST = [
  "Thandiwe", "Sipho", "Aisha", "Johan", "Lerato", "Bongani", "Naledi",
  "Pieter", "Fatima", "Sizwe", "Zanele", "Mandla", "Refilwe", "Andile",
  "Karabo", "Nompumelelo", "Tumelo", "Mosa", "Kagiso", "Boitumelo",
  "Lebohang", "Katlego", "Mpho", "Tebogo", "Tshepo", "Sibongile", "Nokuthula",
];
const SA_LAST = [
  "Mokoena", "Dlamini", "Naidoo", "Sithole", "Khumalo", "Pillay", "Botha",
  "Molefe", "Zulu", "Nkosi", "Mahlangu", "Mthembu", "Khoza", "Mthethwa",
  "Cele", "Ndlovu", "Hlongwane", "Khanyile", "Mhlongo", "Mseleku",
];
const ATTENDING = [
  "Dr. Sipho Dlamini — Cardiology",
  "Dr. Thandiwe Mokoena — General",
  "Dr. R. Naidoo — Dermatology",
  "Dr. M. Sithole — Internal Med",
  "Dr. K. Pillay — Paediatrics",
  "Dr. J. Botha — Surgery",
  "Dr. N. Khumalo — Orthopaedics",
  "Dr. P. Molefe — Maternity",
];
const DIAGNOSES = [
  "Hypertension — Stage 2",
  "Type 2 Diabetes — uncontrolled",
  "Post-op cardiac review",
  "Community-acquired pneumonia",
  "COPD exacerbation",
  "Acute asthma",
  "Fractured femur — post-ORIF",
  "Appendicitis — post-appendectomy",
  "Pre-eclampsia — monitoring",
  "Neonatal jaundice",
  "TB — initiation phase",
  "Sepsis — IV antibiotics",
  "Acute stroke — rehab",
  "Acute coronary syndrome",
  "Acute kidney injury",
  "Cellulitis — IV antibiotics",
];
const INSURANCE = ["GEMS", "Discovery Health", "Bonitas", "Momentum", "Self-pay", "Profmed"];

/** Deterministic patient detail per occupied/reserved bed. */
function bedDetail(bed: BedRow): BedPatientDetail | null {
  if (bed.status !== "occupied" && bed.status !== "reserved") return null;
  const seed = bed.bedNumber;
  const first = SA_FIRST[(seed * 7) % SA_FIRST.length];
  const last = SA_LAST[(seed * 11) % SA_LAST.length];
  const age = 18 + ((seed * 13) % 70);
  const dayAdmit = 1 + ((seed * 5) % 25);
  const admitDate = `June ${dayAdmit}, 2025`;
  const dischargeDay = dayAdmit + 1 + ((seed * 3) % 6);
  const dischargeDate = `June ${dischargeDay > 30 ? dischargeDay - 30 : dischargeDay}, 2025`;
  return {
    patient: `${first} ${last.charAt(0)}.`,
    age,
    admitted: admitDate,
    attending: ATTENDING[(seed * 3) % ATTENDING.length],
    diagnosis: DIAGNOSES[(seed * 5) % DIAGNOSES.length],
    expectedDischarge: dischargeDate,
    insurance: INSURANCE[(seed * 2) % INSURANCE.length],
  };
}

/** Departments (8) — realistic SA public/tertiary mix. */
const DEPARTMENTS = [
  {
    id: "d1",
    name: "Cardiology",
    icon: HeartPulse,
    head: "Dr. Sipho Dlamini",
    beds: 24,
    staff: 14,
    patientsToday: 41,
    status: "active" as const,
    color: "#ef4444",
  },
  {
    id: "d2",
    name: "ICU",
    icon: Activity,
    head: "Dr. M. Sithole",
    beds: 16,
    staff: 22,
    patientsToday: 14,
    status: "critical" as const,
    color: "#f59e0b",
  },
  {
    id: "d3",
    name: "Paediatrics",
    icon: Baby,
    head: "Dr. K. Pillay",
    beds: 18,
    staff: 11,
    patientsToday: 28,
    status: "active" as const,
    color: "#06b6d4",
  },
  {
    id: "d4",
    name: "Maternity",
    icon: Baby,
    head: "Dr. P. Molefe",
    beds: 22,
    staff: 16,
    patientsToday: 19,
    status: "active" as const,
    color: "#ec4899",
  },
  {
    id: "d5",
    name: "Surgical",
    icon: Scissors,
    head: "Dr. J. Botha",
    beds: 30,
    staff: 19,
    patientsToday: 36,
    status: "active" as const,
    color: "#8b5cf6",
  },
  {
    id: "d6",
    name: "Emergency",
    icon: Ambulance,
    head: "Dr. N. Khumalo",
    beds: 12,
    staff: 24,
    patientsToday: 132,
    status: "critical" as const,
    color: "#ef4444",
  },
  {
    id: "d7",
    name: "Radiology",
    icon: ScanLine,
    head: "Dr. L. Adams",
    beds: 0,
    staff: 8,
    patientsToday: 74,
    status: "active" as const,
    color: "#0ea5e9",
  },
  {
    id: "d8",
    name: "Laboratory",
    icon: FlaskConical,
    head: "Dr. T. Naidoo",
    beds: 0,
    staff: 12,
    patientsToday: 218,
    status: "active" as const,
    color: "#10b981",
  },
];

/** Patient flow today — hourly admissions vs discharges (06:00 → 22:00). */
const PATIENT_FLOW = [
  { t: "06:00", admissions: 3, discharges: 1 },
  { t: "08:00", admissions: 8, discharges: 2 },
  { t: "10:00", admissions: 14, discharges: 4 },
  { t: "12:00", admissions: 11, discharges: 9 },
  { t: "14:00", admissions: 9, discharges: 12 },
  { t: "16:00", admissions: 12, discharges: 10 },
  { t: "18:00", admissions: 6, discharges: 7 },
  { t: "20:00", admissions: 4, discharges: 5 },
  { t: "22:00", admissions: 2, discharges: 3 },
];

const WARDS = ["ICU", "General", "Paediatrics", "Maternity", "Surgical"] as const;

const BED_STATUS_META: Record<
  BedStatus,
  { label: string; tile: string; dot: string; ring: string; chart: string; text: string }
> = {
  occupied: {
    label: "Occupied",
    tile: "bg-rose-500/90 border-rose-400/50 text-white",
    dot: "bg-rose-500",
    ring: "ring-rose-500/40",
    chart: "#f43f5e",
    text: "text-rose-500",
  },
  available: {
    label: "Available",
    tile: "bg-emerald-500/90 border-emerald-400/50 text-white",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/40",
    chart: "#10b981",
    text: "text-emerald-500",
  },
  cleaning: {
    label: "Cleaning",
    tile: "bg-amber-500/90 border-amber-400/50 text-white",
    dot: "bg-amber-500",
    ring: "ring-amber-500/40",
    chart: "#f59e0b",
    text: "text-amber-500",
  },
  reserved: {
    label: "Reserved",
    tile: "bg-violet-500/90 border-violet-400/50 text-white",
    dot: "bg-violet-500",
    ring: "ring-violet-500/40",
    chart: "#8b5cf6",
    text: "text-violet-500",
  },
};

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "beds", label: "Beds & wards", icon: BedDouble },
  { id: "queue", label: "Queue", icon: ListOrdered },
  { id: "staff", label: "Staff", icon: Users },
  { id: "approvals", label: "Approvals", icon: UserCheck },
  { id: "departments", label: "Departments", icon: Building2 },
  { id: "settings", label: "Settings", icon: Settings },
];

/* =========================================================================
   Page
   ========================================================================= */

export default function HospitalDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-medical border-t-transparent" />
        </div>
      }
    >
      <HospitalDashboardInner />
      <SonnerToaster position="top-right" richColors closeButton />
    </Suspense>
  );
}

function HospitalDashboardInner() {
  const params = useSearchParams();
  const tabParam = (params.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  return (
    <DashboardLayout role="hospital">
      <div className="space-y-6">
        <TabBar tab={tab} setTab={setTab} />
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "overview" && <OverviewTab setTab={setTab} />}
            {tab === "beds" && <BedsTab />}
            {tab === "queue" && <QueueTab />}
            {tab === "staff" && <StaffTab setTab={setTab} />}
            {tab === "approvals" && <ApprovalsTab />}
            {tab === "departments" && <DepartmentsTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================================
   Tab bar
   ========================================================================= */

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="glass-panel -mx-1 flex gap-1 overflow-x-auto rounded-2xl p-1.5">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
              active
                ? "text-white"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={t.label}
          >
            {active && (
              <motion.span
                layoutId="hospital-tab-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-medical to-cyan-500 shadow-[0_6px_20px_var(--glow-1)]"
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10 whitespace-nowrap">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   Shared atoms
   ========================================================================= */

function ViewHeader({
  title,
  subtitle,
  icon: Icon,
  action,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-medical/15 to-cyan-400/15 text-medical">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  trend,
  trendDir,
  icon: Icon,
  accent,
  ariaLabel,
}: {
  label: string;
  value: string | number;
  hint?: string;
  trend?: string;
  trendDir?: "up" | "down" | "flat";
  icon: React.ElementType;
  accent: string;
  ariaLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="stat-card relative"
      aria-label={ariaLabel || `${label}: ${value}`}
    >
      <div
        className="absolute inset-x-0 top-0 h-[3px] rounded-t-xl"
        style={{ background: accent }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-2 font-display text-3xl font-bold tracking-tight">
            {value}
          </div>
          {hint && (
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          )}
        </div>
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{
            background: `color-mix(in oklab, ${accent} 15%, transparent)`,
            color: accent,
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trendDir === "up" && (
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
          )}
          {trendDir === "down" && (
            <ArrowDownRight className="h-3.5 w-3.5 text-rose-500" />
          )}
          <span
            className={
              trendDir === "up"
                ? "text-emerald-500"
                : trendDir === "down"
                ? "text-rose-500"
                : "text-muted-foreground"
            }
          >
            {trend}
          </span>
        </div>
      )}
    </motion.div>
  );
}

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <div className="mb-1 font-semibold">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color || p.fill }}
          />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function StatusPill({
  tone,
  children,
  dot = true,
}: {
  tone: "emerald" | "rose" | "amber" | "violet" | "medical" | "slate";
  children: React.ReactNode;
  dot?: boolean;
}) {
  const map: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/30",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    violet: "bg-violet-500/10 text-violet-500 border-violet-500/30",
    medical: "bg-medical/10 text-medical border-medical/30",
    slate: "bg-foreground/5 text-muted-foreground border-border",
  };
  const dotMap: Record<string, string> = {
    emerald: "bg-emerald-500",
    rose: "bg-rose-500",
    amber: "bg-amber-500",
    violet: "bg-violet-500",
    medical: "bg-medical",
    slate: "bg-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold",
        map[tone]
      )}
    >
      {dot && (
        <span className={cn("h-1.5 w-1.5 rounded-full", dotMap[tone])} />
      )}
      {children}
    </span>
  );
}

/* =========================================================================
   Overview tab
   ========================================================================= */

function OverviewTab({ setTab }: { setTab: (t: TabId) => void }) {
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
            <button
              onClick={() => setTab("beds")}
              className="btn-ghost flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
              aria-label="Open beds & wards tab"
            >
              View grid
              <ArrowRight className="h-3 w-3" />
            </button>
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
            <button
              onClick={() => setTab("queue")}
              className="btn-ghost flex items-center gap-1 rounded-lg px-2 py-1 text-xs"
              aria-label="Open queue tab"
            >
              Manage queue
              <ArrowRight className="h-3 w-3" />
            </button>
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
                  <StatusPill tone="slate" dot={false}>
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
          <button
            onClick={() => setTab("approvals")}
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
          </button>
        </motion.div>
      </div>
    </div>
  );
}

/* =========================================================================
   Beds & wards tab (KEY)
   ========================================================================= */

function BedsTab() {
  const allBeds = useMemo(() => BED_GRID as BedRow[], []);
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [selectedBed, setSelectedBed] = useState<BedRow | null>(null);

  const counts = useMemo(() => {
    const c = { occupied: 0, available: 0, cleaning: 0, reserved: 0 };
    allBeds.forEach((b) => {
      c[b.status] += 1;
    });
    return c;
  }, [allBeds]);

  const filteredBeds = useMemo(() => {
    if (wardFilter === "all") return allBeds;
    return allBeds.filter((b) => b.ward === wardFilter);
  }, [allBeds, wardFilter]);

  const bedsByWard = useMemo(() => {
    const map: Record<string, BedRow[]> = {};
    WARDS.forEach((w) => {
      map[w] = filteredBeds.filter((b) => b.ward === w);
    });
    return map;
  }, [filteredBeds]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Beds & wards"
        subtitle="Live bed heatmap · 80 beds across 5 wards"
        icon={BedDouble}
      />

      {/* Bed status summary bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <Bed className="h-4 w-4 text-medical" />
            <span className="text-sm font-semibold">
              {allBeds.length} beds total
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          {(["occupied", "available", "cleaning", "reserved"] as BedStatus[]).map(
            (s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={cn("h-3 w-3 rounded", BED_STATUS_META[s].dot)}
                />
                <span className="text-sm font-semibold">
                  {counts[s]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {BED_STATUS_META[s].label}
                </span>
              </div>
            )
          )}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="status-dot bg-emerald-500" />
            Updated 4s ago
          </div>
        </div>
        {/* Proportion bar */}
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-foreground/5">
          {(["occupied", "available", "cleaning", "reserved"] as BedStatus[]).map(
            (s) => (
              <div
                key={s}
                className={cn("h-full", BED_STATUS_META[s].dot)}
                style={{ width: `${(counts[s] / allBeds.length) * 100}%` }}
                title={`${BED_STATUS_META[s].label}: ${counts[s]}`}
              />
            )
          )}
        </div>
      </motion.div>

      {/* Ward filter + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setWardFilter("all")}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              wardFilter === "all"
                ? "border-medical bg-medical/10 text-medical"
                : "border-border text-muted-foreground hover:bg-foreground/5"
            )}
            aria-pressed={wardFilter === "all"}
          >
            All wards
          </button>
          {WARDS.map((w) => (
            <button
              key={w}
              onClick={() => setWardFilter(w)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                wardFilter === w
                  ? "border-medical bg-medical/10 text-medical"
                  : "border-border text-muted-foreground hover:bg-foreground/5"
              )}
              aria-pressed={wardFilter === w}
            >
              {w}
              <span className="ml-1.5 text-[0.65rem] text-muted-foreground">
                ({allBeds.filter((b) => b.ward === w).length})
              </span>
            </button>
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {(["occupied", "available", "cleaning", "reserved"] as BedStatus[]).map(
            (s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className={cn("h-3 w-3 rounded", BED_STATUS_META[s].dot)}
                />
                {BED_STATUS_META[s].label}
              </div>
            )
          )}
        </div>
      </div>

      {/* Heatmap grid grouped by ward */}
      <div className="space-y-5">
        {WARDS.map((ward) => {
          const wardBeds = bedsByWard[ward] || [];
          if (wardBeds.length === 0) return null;
          const wardCounts = {
            occupied: wardBeds.filter((b) => b.status === "occupied").length,
            available: wardBeds.filter((b) => b.status === "available").length,
            cleaning: wardBeds.filter((b) => b.status === "cleaning").length,
            reserved: wardBeds.filter((b) => b.status === "reserved").length,
          };
          const occupancy = Math.round(
            (wardCounts.occupied / wardBeds.length) * 100
          );
          return (
            <motion.section
              key={ward}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/10 text-medical">
                    {ward === "ICU" && <Activity className="h-4 w-4" />}
                    {ward === "General" && <Bed className="h-4 w-4" />}
                    {ward === "Paediatrics" && <Baby className="h-4 w-4" />}
                    {ward === "Maternity" && <Baby className="h-4 w-4" />}
                    {ward === "Surgical" && <Scissors className="h-4 w-4" />}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold">
                      {ward} ward
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {wardBeds.length} beds · {occupancy}% occupied
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-rose-500">
                    {wardCounts.occupied} occ
                  </span>
                  <span className="text-emerald-500">
                    {wardCounts.available} free
                  </span>
                  <span className="text-amber-500">
                    {wardCounts.cleaning} clean
                  </span>
                  <span className="text-violet-500">
                    {wardCounts.reserved} res
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16">
                {wardBeds.map((bed) => {
                  const meta = BED_STATUS_META[bed.status];
                  return (
                    <motion.button
                      key={bed.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedBed(bed)}
                      className={cn(
                        "relative aspect-square rounded-lg border text-[0.65rem] font-bold transition-shadow hover:ring-2",
                        meta.tile,
                        meta.ring,
                        "hover:ring-2"
                      )}
                      aria-label={`Bed ${bed.bedNumber}, ${ward}, ${meta.label}. Click for details.`}
                      title={`Bed ${bed.bedNumber} · ${meta.label}`}
                    >
                      {bed.bedNumber}
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Bed detail drawer */}
      <BedDetailSheet bed={selectedBed} onClose={() => setSelectedBed(null)} />
    </div>
  );
}

function BedDetailSheet({
  bed,
  onClose,
}: {
  bed: BedRow | null;
  onClose: () => void;
}) {
  const open = bed !== null;
  const detail = bed ? bedDetail(bed) : null;
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="glass-strong w-full overflow-y-auto border-l border-border/60 p-0 sm:max-w-md"
      >
        {bed && (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border/60 p-5">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-xl border text-sm font-bold",
                    BED_STATUS_META[bed.status].tile
                  )}
                >
                  <BedDouble className="h-5 w-5" />
                </span>
                <div>
                  <SheetTitle className="font-display text-lg">
                    Bed #{bed.bedNumber}
                  </SheetTitle>
                  <SheetDescription className="text-sm">
                    {bed.ward} ward · {BED_STATUS_META[bed.status].label}
                  </SheetDescription>
                </div>
              </div>
              <div className="mt-3">
                <StatusPill
                  tone={
                    bed.status === "occupied"
                      ? "rose"
                      : bed.status === "available"
                      ? "emerald"
                      : bed.status === "cleaning"
                      ? "amber"
                      : "violet"
                  }
                >
                  {BED_STATUS_META[bed.status].label}
                </StatusPill>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 p-5">
              {bed.status === "available" && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Bed ready for admission
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Last cleaned by Housekeeping at 11:42. Linen refreshed, vitals
                    monitor calibrated. Ready to receive next patient.
                  </p>
                </div>
              )}

              {bed.status === "cleaning" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    Cleaning in progress
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Terminal disinfection underway. Estimated completion in 22
                    minutes. Housekeeping team notified.
                  </p>
                </div>
              )}

              {bed.status === "reserved" && detail && (
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-violet-500">
                    <Clock className="h-4 w-4" />
                    Reserved · admission scheduled
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Pre-admission booked for {detail.patient}, {detail.age} ·{" "}
                    {detail.diagnosis}. Expected arrival from ED within 1 hour.
                  </p>
                </div>
              )}

              {detail && (bed.status === "occupied" || bed.status === "reserved") && (
                <>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Patient
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-xs font-bold text-white">
                        {detail.patient
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <div>
                        <div className="font-semibold">
                          {detail.patient}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {detail.age} yrs · {detail.insurance}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoTile
                      label="Admitted"
                      value={detail.admitted}
                      icon={Calendar}
                    />
                    <InfoTile
                      label="Expected discharge"
                      value={detail.expectedDischarge}
                      icon={DoorOpen}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Attending clinician
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2">
                      <Stethoscope className="h-4 w-4 text-medical" />
                      <span className="flex-1 text-sm font-medium">
                        {detail.attending}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Diagnosis
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2">
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                      <span className="flex-1 text-sm font-medium">
                        {detail.diagnosis}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
                      onClick={() => toast.success("Patient record opened")}
                    >
                      <FileText className="h-4 w-4" />
                      Open record
                    </button>
                    <button
                      className="btn-secondary flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
                      onClick={() => toast.success("Discharge planner notified")}
                    >
                      <DoorOpen className="h-4 w-4" />
                      Plan discharge
                    </button>
                  </div>
                </>
              )}

              {bed.status === "available" && (
                <button
                  className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
                  onClick={() => toast.success(`Bed #${bed.bedNumber} reserved for next admission`)}
                >
                  <Plus className="h-4 w-4" />
                  Reserve for admission
                </button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

/* =========================================================================
   Queue tab
   ========================================================================= */

type QueueEntry = {
  number: number;
  name: string;
  service: string;
  status: "serving" | "called" | "waiting" | "missed" | "completed";
  waitMin: number;
};

function QueueTab() {
  const [entries, setEntries] = useState<QueueEntry[]>(
    HOSPITAL_QUEUE.map((q) => ({ ...q })) as QueueEntry[]
  );
  const [nowServing, setNowServing] = useState(37);
  const [elapsed, setElapsed] = useState(0);

  // Live elapsed counter — ticks every second for "now serving" duration.
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const waiting = entries.filter((e) => e.status === "waiting");
  const called = entries.filter((e) => e.status === "called");
  const serving = entries.filter((e) => e.status === "serving");
  const avgWait =
    waiting.length > 0
      ? Math.round(
          waiting.reduce((s, e) => s + e.waitMin, 0) / waiting.length
        )
      : 0;

  function callNext() {
    setEntries((prev) => {
      // Demote current 'called' to 'waiting' (re-queue after 5)
      // Promote first 'waiting' to 'called'
      const next = [...prev];
      const firstWaiting = next.find((e) => e.status === "waiting");
      if (!firstWaiting) {
        toast.info("No patients waiting in queue");
        return prev;
      }
      firstWaiting.status = "called";
      firstWaiting.waitMin = 0;
      toast.success(`Calling #${firstWaiting.number} · ${firstWaiting.name}`, {
        description: `${firstWaiting.service} · please proceed to triage`,
      });
      return next;
    });
  }

  function startServing(num: number) {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.status === "serving") {
          return { ...e, status: "completed" as const };
        }
        if (e.number === num) {
          setNowServing(num);
          setElapsed(0);
          return { ...e, status: "serving" as const };
        }
        return e;
      })
    );
    toast.success(`Now serving #${num}`);
  }

  function completeServing() {
    setEntries((prev) =>
      prev.map((e) =>
        e.status === "serving"
          ? { ...e, status: "completed" as const }
          : e
      )
    );
    toast.success("Consultation completed · patient discharged from queue");
  }

  function skipMissed(num: number) {
    setEntries((prev) => {
      const next = [...prev];
      const idx = next.findIndex((e) => e.number === num);
      if (idx === -1) return prev;
      // Remove from current position; re-queue 5 slots back
      const [entry] = next.splice(idx, 1);
      const requeued: QueueEntry = {
        ...entry,
        status: "waiting",
        waitMin: 0,
        number: next.length + 50,
      };
      next.push(requeued);
      return next;
    });
    toast.warning(`#${num} skipped — re-queued after 5 patients`, {
      description: "Per MedLink SA missed-turn rule",
    });
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Queue management"
        subtitle="Live triage board · Chris Hani Baragwanath · OPD"
        icon={ListOrdered}
        action={
          <button
            onClick={callNext}
            className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            aria-label="Call next patient"
          >
            <ArrowRight className="h-4 w-4" />
            Call next
          </button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Now serving"
          value={`#${nowServing}`}
          hint={`${mm}:${ss} elapsed`}
          icon={Activity}
          accent="#2563eb"
          ariaLabel={`Now serving ticket number ${nowServing}`}
        />
        <StatCard
          label="In queue"
          value={waiting.length}
          hint={`${called.length} called`}
          icon={Users}
          accent="#f59e0b"
        />
        <StatCard
          label="Avg wait"
          value={`${avgWait}m`}
          hint="Across waiting room"
          icon={Clock}
          accent="#06b6d4"
        />
        <StatCard
          label="Completed today"
          value={entries.filter((e) => e.status === "completed").length}
          hint="Discharged from queue"
          icon={CheckCircle2}
          accent="#10b981"
        />
      </div>

      {/* Board: 3 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Now serving */}
        <QueueColumn
          title="Now serving"
          accent="#2563eb"
          entries={serving}
          emptyText="No active consultation — call next to begin."
          renderActions={(e) => (
            <button
              onClick={() => completeServing()}
              className="btn-primary flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold"
              aria-label={`Mark #${e.number} as completed`}
            >
              <Check className="h-3.5 w-3.5" />
              Complete
            </button>
          )}
        />

        {/* Called */}
        <QueueColumn
          title="Called"
          accent="#f59e0b"
          entries={called}
          emptyText="No patients called yet."
          renderActions={(e) => (
            <div className="flex gap-1.5">
              <button
                onClick={() => startServing(e.number)}
                className="btn-primary flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold"
                aria-label={`Start serving #${e.number}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Start
              </button>
              <button
                onClick={() => skipMissed(e.number)}
                className="btn-secondary flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold"
                aria-label={`Skip #${e.number} — patient missed`}
              >
                <X className="h-3.5 w-3.5" />
                Skip
              </button>
            </div>
          )}
        />

        {/* Waiting */}
        <QueueColumn
          title="Waiting"
          accent="#8b5cf6"
          entries={waiting}
          emptyText="Queue is clear."
          renderActions={(e) => (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">{e.waitMin}m</span>
              <button
                onClick={() => skipMissed(e.number)}
                className="btn-ghost ml-1 rounded p-1"
                aria-label={`Mark #${e.number} as missed`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        />
      </div>

      {/* Missed-turn rule note */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel flex items-start gap-3 p-4"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-medical/10 text-medical">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div className="text-sm">
          <div className="font-semibold">Missed-turn rule</div>
          <p className="mt-0.5 text-muted-foreground">
            Patients who miss their call are re-queued <strong>after 5 people</strong> —
            not at the back of the line, and not at the front. This balances fairness
            to those who arrived on time with the reality that ED waits can run long.
            Skipped tickets keep their original number for traceability.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function QueueColumn({
  title,
  accent,
  entries,
  emptyText,
  renderActions,
}: {
  title: string;
  accent: string;
  entries: QueueEntry[];
  emptyText: string;
  renderActions: (e: QueueEntry) => React.ReactNode;
}) {
  return (
    <div className="glass-panel flex flex-col p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: accent }}
          />
          <h3 className="font-display text-sm font-semibold">{title}</h3>
        </div>
        <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-semibold">
          {entries.length}
        </span>
      </div>
      <div className="flex-1 space-y-2">
        {entries.length === 0 && (
          <div className="rounded-lg border border-dashed border-border/60 px-3 py-8 text-center text-xs text-muted-foreground">
            {emptyText}
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {entries.map((e) => (
            <motion.div
              key={e.number}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.25 }}
              className="rounded-xl border border-border/60 bg-foreground/[0.02] p-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-sm font-bold text-white"
                  style={{ background: accent }}
                >
                  {e.number}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{e.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {e.service}
                  </div>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-end">
                {renderActions(e)}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* =========================================================================
   Staff tab
   ========================================================================= */

type StaffRow = {
  id: string;
  name: string;
  role: string;
  status: "on-duty" | "off-duty" | "pending";
  patients: number;
  verified: boolean;
};

function StaffTab({ setTab }: { setTab: (t: TabId) => void }) {
  const [staff, setStaff] = useState<StaffRow[]>(
    HOSPITAL_STAFF.map((s) => ({ ...s })) as StaffRow[]
  );
  const [filter, setFilter] = useState<"all" | "on-duty" | "off-duty" | "pending">(
    "all"
  );
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = staff.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (query && !s.name.toLowerCase().includes(query.toLowerCase()) && !s.role.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  function toggleVerified(id: string) {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, verified: !s.verified } : s))
    );
    const target = staff.find((s) => s.id === id);
    if (target) {
      toast.success(
        `${target.name} ${target.verified ? "un-verified" : "verified"}`
      );
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Staff directory"
        subtitle={`${staff.length} clinicians on the roster`}
        icon={Users}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            aria-label="Add staff member"
          >
            <Plus className="h-4 w-4" />
            Add staff
          </button>
        }
      />

      {/* Filters */}
      <div className="glass-panel flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or role…"
            className="input-premium h-9 w-full pl-9 pr-3 text-sm"
            aria-label="Search staff"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "on-duty", "off-duty", "pending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors capitalize",
                filter === f
                  ? "border-medical bg-medical/10 text-medical"
                  : "border-border text-muted-foreground hover:bg-foreground/5"
              )}
              aria-pressed={filter === f}
            >
              {f === "all" ? "All staff" : f.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Staff table */}
      <div className="glass-panel overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="pl-5">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Patients</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow
                key={s.id}
                className="border-border/40"
              >
                <TableCell className="pl-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-[0.7rem] font-bold text-white">
                      {s.name
                        .replace(/^(Dr\.|Nurse)\s*/, "")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ID {s.id.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{s.role}</TableCell>
                <TableCell>
                  {s.status === "on-duty" && (
                    <StatusPill tone="emerald">On-duty</StatusPill>
                  )}
                  {s.status === "off-duty" && (
                    <StatusPill tone="slate">Off-duty</StatusPill>
                  )}
                  {s.status === "pending" && (
                    <button
                      onClick={() => setTab("approvals")}
                      className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-amber-500 transition-colors hover:bg-amber-500/20"
                      aria-label="Pending verification — open approvals tab"
                    >
                      Pending · verify
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm font-semibold">
                  {s.patients}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {s.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        HPCSA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Unverified
                      </span>
                    )}
                    <Switch
                      checked={s.verified}
                      onCheckedChange={() => toggleVerified(s.id)}
                      aria-label={`Toggle verification for ${s.name}`}
                    />
                  </div>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <button
                    className="btn-ghost rounded-md p-1.5"
                    aria-label={`More actions for ${s.name}`}
                    onClick={() => toast.info(`${s.name} · ${s.role}`)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No staff match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <InviteStaffDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function InviteStaffDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("doctor");
  const [sending, setSending] = useState(false);

  function send() {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onOpenChange(false);
      toast.success(`Invite sent to ${email}`, {
        description: `They'll appear under Approvals once they accept and submit their HPCSA/SANC number.`,
      });
      setEmail("");
      setRole("doctor");
    }, 800);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/15 text-medical">
              <UserCheck className="h-4 w-4" />
            </span>
            Invite a clinician
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a doctor or nurse to join your hospital on
            MedLink SA. They'll need to verify their HPCSA or SANC number before
            practising.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.khumalo@hpcsa.co.za"
                className="input-premium pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="input-premium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor / Specialist</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="intern">Medical intern</SelectItem>
                <SelectItem value="allied">Allied health</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-medical/30 bg-medical/5 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-medical">
              <ShieldCheck className="h-3.5 w-3.5" />
              POPIA compliant
            </div>
            <p className="mt-1">
              Invite links expire after 7 days. New staff must complete identity
              verification before their account activates.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="btn-ghost"
          >
            Cancel
          </Button>
          <Button
            onClick={send}
            disabled={sending}
            className="btn-primary gap-2"
          >
            {sending ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   Approvals tab (KEY)
   ========================================================================= */

type Approval = {
  id: string;
  name: string;
  role: string;
  hpcsa?: string;
  sanc?: string;
  applied: string;
};

const APPROVAL_CREDENTIALS: Record<
  string,
  { qualifications: string[]; experience: string; references: string[] }
> = {
  ap1: {
    qualifications: [
      "MBChB — University of the Witwatersrand, 2016",
      "FC Paed (SA) — Colleges of Medicine, 2022",
      "MMed Paediatrics — Wits, 2024",
    ],
    experience:
      "8 years post-internship. 3 years as Paediatric registrar at Charlotte Maxeke before sub-specialising in neonatology.",
    references: [
      "Prof. M. Mthembu — Head of Paediatrics, Charlotte Maxeke",
      "Dr. L. Adams — Neonatal Fellow, Wits",
    ],
  },
  ap2: {
    qualifications: [
      "Bcur (Ed & Adm) — University of Pretoria, 2018",
      "Critical Care Nursing (ICU) — SANC-accredited, 2021",
      "ACLS & PALS certified (2024)",
    ],
    experience:
      "6 years nursing. 3 years in adult ICU at Netcare Milpark, then 1 year agency cover across Gauteng ICUs.",
    references: [
      "Sr. P. Mokoena — ICU Manager, Netcare Milpark",
      "Dr. R. Pillay — Intensivist, Milpark",
    ],
  },
};

function ApprovalsTab() {
  const [approvals, setApprovals] = useState<Approval[]>(
    APPROVALS_PENDING.map((a) => ({ ...a })) as Approval[]
  );

  function approve(a: Approval) {
    setApprovals((prev) => prev.filter((p) => p.id !== a.id));
    toast.success(`${a.name} approved and added to your staff`, {
      description: `${
        a.role
      } · ${a.hpcsa || a.sanc || "credential on file"} verified`,
    });
  }

  function reject(a: Approval) {
    setApprovals((prev) => prev.filter((p) => p.id !== a.id));
    toast.error(`${a.name} rejected`, {
      description: "Applicant will be notified by email. Record kept for audit.",
    });
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Pending approvals"
        subtitle={`${approvals.length} clinician${approvals.length !== 1 ? "s" : ""} awaiting verification`}
        icon={UserCheck}
      />

      {/* Explainer banner */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel flex items-start gap-3 p-4"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-medical/10 text-medical">
          <ShieldCheck className="h-4 w-4" />
        </span>
        <div className="text-sm">
          <div className="font-semibold">
            Why hospitals verify clinicians
          </div>
          <p className="mt-0.5 text-muted-foreground">
            Doctors and nurses must be verified by their hospital before they
            can practise on MedLink SA. Verification confirms their HPCSA or SANC
            number is active and that they are credentialed at this facility —
            protecting patients and meeting the National Health Act requirements.
          </p>
        </div>
      </motion.div>

      {approvals.length === 0 && (
        <div className="glass-panel grid place-items-center gap-3 py-16 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <div className="font-display text-base font-semibold">
              All caught up
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              No pending approvals. New applicants will appear here.
            </p>
          </div>
        </div>
      )}

      {/* Approval cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {approvals.map((a) => {
            const cred = APPROVAL_CREDENTIALS[a.id];
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.28 }}
                className="glass-panel p-5"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-medical to-cyan-400 text-sm font-bold text-white">
                    {a.name
                      .replace(/^(Dr\.|Nurse)\s*/, "")
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-semibold">
                        {a.name}
                      </h3>
                      <StatusPill tone="amber" dot={false}>
                        <Clock className="h-3 w-3" />
                        {a.applied}
                      </StatusPill>
                    </div>
                    <p className="text-sm text-muted-foreground">{a.role}</p>
                  </div>
                </div>

                {/* Credential badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {a.hpcsa && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.02] px-2.5 py-1.5 text-xs font-semibold">
                      <IdCard className="h-3.5 w-3.5 text-medical" />
                      HPCSA: <span className="font-mono">{a.hpcsa}</span>
                    </span>
                  )}
                  {a.sanc && (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-foreground/[0.02] px-2.5 py-1.5 text-xs font-semibold">
                      <IdCard className="h-3.5 w-3.5 text-medical" />
                      SANC: <span className="font-mono">{a.sanc}</span>
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-2.5 py-1.5 text-xs font-semibold text-emerald-500">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Credential active
                  </span>
                </div>

                {/* Expandable credentials */}
                {cred && (
                  <Accordion
                    type="single"
                    collapsible
                    className="mt-4"
                  >
                    <AccordionItem
                      value="creds"
                      className="border-border/60"
                    >
                      <AccordionTrigger className="text-sm font-semibold hover:no-underline">
                        <span className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-medical" />
                          View credentials & references
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-3 pt-2 text-sm">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Qualifications
                          </div>
                          <ul className="mt-1 space-y-1">
                            {cred.qualifications.map((q, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-muted-foreground"
                              >
                                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Experience
                          </div>
                          <p className="mt-1 text-muted-foreground">
                            {cred.experience}
                          </p>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            References
                          </div>
                          <ul className="mt-1 space-y-1">
                            {cred.references.map((r, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-muted-foreground"
                              >
                                <User className="mt-0.5 h-3.5 w-3.5 shrink-0 text-medical" />
                                <span>{r}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => approve(a)}
                    className="btn-primary flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
                    aria-label={`Approve ${a.name}`}
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => reject(a)}
                    className="btn-secondary flex flex-1 items-center justify-center gap-2 rounded-lg border-rose-500/30 px-3 py-2 text-sm font-semibold text-rose-500 hover:bg-rose-500/10"
                    aria-label={`Reject ${a.name}`}
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* =========================================================================
   Departments tab
   ========================================================================= */

function DepartmentsTab() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Departments"
        subtitle={`${DEPARTMENTS.length} clinical departments · last updated 2m ago`}
        icon={Building2}
        action={
          <button
            onClick={() => setAddOpen(true)}
            className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            aria-label="Add department"
          >
            <Plus className="h-4 w-4" />
            Add department
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((d, i) => {
          const Icon = d.icon;
          return (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-panel card-premium p-5"
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{
                    background: `color-mix(in oklab, ${d.color} 15%, transparent)`,
                    color: d.color,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {d.status === "critical" ? (
                  <StatusPill tone="rose">
                    <AlertTriangle className="h-3 w-3" />
                    Critical
                  </StatusPill>
                ) : (
                  <StatusPill tone="emerald">Active</StatusPill>
                )}
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">
                {d.name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Stethoscope className="h-3 w-3" />
                Head: <span className="font-medium text-foreground">{d.head}</span>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-display text-lg font-bold">
                    {d.beds}
                  </div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Beds
                  </div>
                </div>
                <div>
                  <div className="font-display text-lg font-bold">
                    {d.staff}
                  </div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Staff
                  </div>
                </div>
                <div>
                  <div className="font-display text-lg font-bold">
                    {d.patientsToday}
                  </div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Today
                  </div>
                </div>
              </div>

              <button
                onClick={() => toast.info(`Opening ${d.name} department view`)}
                className="btn-secondary mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
              >
                View department
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </div>

      <AddDepartmentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function AddDepartmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [head, setHead] = useState("");

  function submit() {
    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }
    onOpenChange(false);
    toast.success(`${name} department created`, {
      description: head ? `Head: ${head}` : "Assign a HoD from Staff.",
    });
    setName("");
    setHead("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/15 text-medical">
              <Building2 className="h-4 w-4" />
            </span>
            Add a department
          </DialogTitle>
          <DialogDescription>
            Register a new clinical department. You can assign a head of
            department and beds afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department name</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oncology"
              className="input-premium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-head">Head of department (optional)</Label>
            <Input
              id="dept-head"
              value={head}
              onChange={(e) => setHead(e.target.value)}
              placeholder="e.g. Dr. M. Sithole"
              className="input-premium"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="btn-ghost"
          >
            Cancel
          </Button>
          <Button onClick={submit} className="btn-primary gap-2">
            <Plus className="h-4 w-4" />
            Create department
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   Settings tab
   ========================================================================= */

function SettingsTab() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.facility || "Chris Hani Baragwanath Hospital");
  const [province, setProvince] = useState("Gauteng");
  const [address, setAddress] = useState(
    "26 Chris Hani Rd, Diepkloof, Soweto, 1864"
  );
  const [phone, setPhone] = useState("+27 11 933 8000");
  const [totalBeds, setTotalBeds] = useState("2888");
  const [hours, setHours] = useState("24/7 emergency · elective services 07:00–18:00");
  const [publicContact, setPublicContact] = useState(true);
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (user && name !== user.facility) {
        updateUser({ name, facility: name });
      }
      toast.success("Hospital profile saved", {
        description: "Changes are live on your MedLink SA directory listing.",
      });
    }, 700);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Hospital settings"
        subtitle="Profile, contact & operating hours"
        icon={Settings}
        action={
          <button
            onClick={save}
            disabled={saving}
            className="btn-primary flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
            aria-label="Save settings"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile form */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <h3 className="font-display text-base font-semibold">
            Hospital profile
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Public-facing details shown on the MedLink SA directory.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="h-name">Hospital name</Label>
              <Input
                id="h-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-province">Province</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger id="h-province" className="input-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Eastern Cape",
                    "Free State",
                    "Gauteng",
                    "KwaZulu-Natal",
                    "Limpopo",
                    "Mpumalanga",
                    "Northern Cape",
                    "North West",
                    "Western Cape",
                  ].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-beds">Licensed beds</Label>
              <Input
                id="h-beds"
                type="number"
                value={totalBeds}
                onChange={(e) => setTotalBeds(e.target.value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="h-address">Street address</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="h-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-premium pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-phone">Switchboard</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="h-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-premium pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-hours">Operating hours</Label>
              <Input
                id="h-hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="input-premium"
              />
            </div>
          </div>
        </motion.div>

        {/* Right column: visibility + verification */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-panel p-5"
          >
            <h3 className="font-display text-base font-semibold">
              Visibility
            </h3>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Public contact</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Show phone & address on the public directory so patients can
                  reach you directly.
                </p>
              </div>
              <Switch
                checked={publicContact}
                onCheckedChange={setPublicContact}
                aria-label="Toggle public contact"
              />
            </div>
            <div className="mt-4 flex items-start justify-between gap-3 border-t border-border/60 pt-4">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Globe className="h-3.5 w-3.5 text-medical" />
                  Listed on directory
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your facility appears in MedLink SA search results.
                </p>
              </div>
              <StatusPill tone="emerald">Live</StatusPill>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-5"
          >
            <h3 className="font-display text-base font-semibold">
              Verification
            </h3>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-emerald-500">
                  DOH-verified
                </div>
                <div className="text-xs text-muted-foreground">
                  National Department of Health · since 03 Jan 2025
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Verification is renewed annually. You'll receive a reminder 30 days
              before expiry.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel p-5"
          >
            <h3 className="font-display text-base font-semibold">
              Notifications
            </h3>
            <div className="mt-3 space-y-3">
              {[
                {
                  label: "New approval requests",
                  on: true,
                  icon: UserCheck,
                },
                {
                  label: "Bed capacity alerts (<10%)",
                  on: true,
                  icon: BedDouble,
                },
                {
                  label: "Critical patient admissions",
                  on: true,
                  icon: AlertTriangle,
                },
                {
                  label: "Daily census summary (08:00)",
                  on: false,
                  icon: Bell,
                },
              ].map((n) => (
                <div
                  key={n.label}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <n.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {n.label}
                  </div>
                  <Switch
                    defaultChecked={n.on}
                    aria-label={n.label}
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
