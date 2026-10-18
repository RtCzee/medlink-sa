"use client";

/* =========================================================================
   MedLink SA — Admin Dashboard
   Task ID: 10-ADMIN
   National command center — oversees all accounts, hospitals,
   verifications, audit trail, system health & platform settings.
   ========================================================================= */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import {
  Activity,
  Users,
  Building2,
  Stethoscope,
  ShieldCheck,
  ScrollText,
  Settings as SettingsIcon,
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
  MoreVertical,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  MapPin,
  BedDouble,
  Clock,
  IdCard,
  FileText,
  HeartPulse,
  Server,
  Database,
  Globe,
  Zap,
  RefreshCw,
  Power,
  Download,
  KeyRound,
  Monitor,
  Smartphone,
  Lock,
  Save,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Ban,
  RotateCcw,
  Sparkles,
  Network,
  HardDrive,
  Wifi,
  CloudUpload,
  FileCheck,
  Fingerprint,
  CircleDashed,
  Crown,
  ShieldAlert,
  Cpu,
  Activity as ActivityIcon,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  ADMIN_USERS,
  ADMIN_HOSPITALS,
  ADMIN_AUDIT,
  NETWORK_ACTIVITY,
  PROVINCE_SPLIT,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

/* -------------------------------------------------------------------------
   Types
   ------------------------------------------------------------------------- */

type TabId =
  | "overview"
  | "users"
  | "hospitals"
  | "verifications"
  | "audit"
  | "health"
  | "settings";

type VerifiedStatus = "approved" | "pending" | "rejected" | "suspended";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "Patient" | "Doctor" | "Hospital" | "Pharmacy";
  verified: VerifiedStatus;
  joined: string;
  phone?: string;
  province?: string;
};

type AdminHospital = {
  id: string;
  name: string;
  province: string;
  beds: number;
  doctors: number;
  verified: boolean;
  joined: string;
  ceo?: string;
  district?: string;
};

type AuditKind = "auth" | "edit" | "create" | "delete" | "system" | "verify";

type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  kind: AuditKind;
  ip: string;
  device: string;
  hash: string;
};

type PendingDoctor = {
  id: string;
  name: string;
  specialty: string;
  hpcsa: string;
  hospital: string;
  submitted: string;
};

type PendingPatient = {
  id: string;
  name: string;
  idType: "SA ID" | "Passport" | "Birth cert" | "Refugee permit";
  hospital: string;
  submitted: string;
};

/* -------------------------------------------------------------------------
   Mock data (realistic SA context)
   ------------------------------------------------------------------------- */

const SA_PROVINCES_HEALTH = [
  { name: "Gauteng", status: "green", sessions: 1247, latency: 98 },
  { name: "KwaZulu-Natal", status: "green", sessions: 892, latency: 124 },
  { name: "Western Cape", status: "green", sessions: 1102, latency: 102 },
  { name: "Eastern Cape", status: "amber", sessions: 234, latency: 287 },
  { name: "Free State", status: "green", sessions: 318, latency: 156 },
  { name: "Limpopo", status: "amber", sessions: 156, latency: 312 },
  { name: "Mpumalanga", status: "green", sessions: 287, latency: 168 },
  { name: "Northern Cape", status: "green", sessions: 89, latency: 198 },
  { name: "North West", status: "green", sessions: 203, latency: 174 },
];

const PENDING_DOCTORS: PendingDoctor[] = [
  {
    id: "pd1",
    name: "Dr. K. Adams",
    specialty: "Paediatrician",
    hpcsa: "MP088234",
    hospital: "Netcare Sunninghill",
    submitted: "2 days ago",
  },
  {
    id: "pd2",
    name: "Nurse L. Zulu",
    specialty: "ICU Nurse (SANC)",
    hpcsa: "SANC-449821",
    hospital: "Chris Hani Baragwanath",
    submitted: "5 hours ago",
  },
  {
    id: "pd3",
    name: "Dr. M. Naidoo",
    specialty: "Dermatologist",
    hpcsa: "MP091122",
    hospital: "Netcare Sunninghill",
    submitted: "1 day ago",
  },
];

const PENDING_PATIENTS: PendingPatient[] = [
  {
    id: "pp1",
    name: "M. Khumalo",
    idType: "SA ID",
    hospital: "Chris Hani Baragwanath",
    submitted: "1 hour ago",
  },
  {
    id: "pp2",
    name: "P. Sithole",
    idType: "Passport",
    hospital: "Charlotte Maxeke",
    submitted: "3 hours ago",
  },
  {
    id: "pp3",
    name: "L. Botha (minor)",
    idType: "Birth cert",
    hospital: "Groote Schuur",
    submitted: "Yesterday",
  },
  {
    id: "pp4",
    name: "T. Molefe",
    idType: "Refugee permit",
    hospital: "Charlotte Maxeke",
    submitted: "2 days ago",
  },
];

const AUDIT_EXTENDED: AuditEvent[] = ADMIN_AUDIT.map((a, i) => ({
  ...a,
  ip: ["41.13.22.108", "196.21.14.55", "102.222.86.41", "197.97.42.12", "154.66.18.220", "41.13.22.108", "196.21.14.55"][i % 7],
  device: ["iPhone · Safari 17", "Server · Ubuntu 22.04", "MacBook · Chrome 124", "iPhone · Safari 17", "MacBook · Chrome 124", "Server · Ubuntu 22.04", "Server · Ubuntu 22.04"][i % 7],
  hash: ["0x7af3…b9c2", "0x9d2e…1f8a", "0x4c81…6e30", "0x2b5f…a714", "0x8e0c…d239", "0x1a4b…9f72", "0x6c33…8e51"][i % 7],
}));

const SYSTEM_METRICS = {
  uptime: 99.98,
  apiLatency: 142,
  apiP50: 98,
  apiP95: 287,
  dhis2LastSync: "12 min ago",
  dhis2Queue: 8,
  dhis2Status: "in-sync" as "in-sync" | "syncing" | "error",
  dbPool: 47,
  dbPoolMax: 100,
  dbSize: "847 GB",
  dbStatus: "healthy" as "healthy" | "degraded" | "down",
  activeSessions: 4283,
  cpuLoad: 38,
  memoryLoad: 54,
  diskLoad: 71,
};

const API_RESPONSE_TREND = [
  { t: "00:00", ms: 95 },
  { t: "04:00", ms: 88 },
  { t: "08:00", ms: 142 },
  { t: "12:00", ms: 168 },
  { t: "16:00", ms: 187 },
  { t: "20:00", ms: 124 },
  { t: "now", ms: 142 },
];

/* -------------------------------------------------------------------------
   Style maps
   ------------------------------------------------------------------------- */

const VERIFIED_STYLE: Record<VerifiedStatus, { label: string; dot: string; badge: string }> = {
  approved: { label: "Verified", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  pending: { label: "Pending", dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  rejected: { label: "Rejected", dot: "bg-rose-500", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
  suspended: { label: "Suspended", dot: "bg-foreground/40", badge: "bg-foreground/5 text-muted-foreground border-foreground/10" },
};

const AUDIT_KIND_META: Record<
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

const ROLE_STYLE: Record<AdminUser["role"], { icon: typeof Users; tint: string }> = {
  Patient: { icon: HeartPulse, tint: "from-medical to-cyan-400" },
  Doctor: { icon: Stethoscope, tint: "from-emerald-500 to-cyan-400" },
  Hospital: { icon: Building2, tint: "from-violet-500 to-medical" },
  Pharmacy: { icon: Activity, tint: "from-amber-500 to-rose-400" },
};

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */

function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl">
      {label && <div className="mb-1 font-semibold">{label}</div>}
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{typeof p.value === "number" ? p.value.toLocaleString() : p.value}{p.payload?.unit || ""}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Tab bar
   ------------------------------------------------------------------------- */

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "hospitals", label: "Hospitals", icon: Building2 },
  { id: "verifications", label: "Verifications", icon: ShieldCheck },
  { id: "audit", label: "Audit log", icon: ScrollText },
  { id: "health", label: "System health", icon: Server },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/* =========================================================================
   Page (Suspense wrapper)
   ========================================================================= */

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-medical border-t-transparent" />
        </div>
      }
    >
      <AdminDashboardInner />
      <SonnerToaster position="top-right" richColors closeButton />
    </Suspense>
  );
}

function AdminDashboardInner() {
  const params = useSearchParams();
  const tabParam = (params.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  // Local mutable state — mirrors shared data but tracks admin actions
  const [users, setUsers] = useState<AdminUser[]>(
    ADMIN_USERS.map((u) => ({ ...u, role: u.role as AdminUser["role"], verified: u.verified as VerifiedStatus }))
  );
  const [hospitals, setHospitals] = useState<AdminHospital[]>(
    ADMIN_HOSPITALS.map((h) => ({
      ...h,
      ceo: h.id === "h4" ? "Dr. R. Pretorius" : h.id === "h5" ? "Dr. N. Mthethwa" : undefined,
      district: h.id === "h4" ? "Joburg Metro" : h.id === "h5" ? "eThekwini" : undefined,
    }))
  );
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>(PENDING_DOCTORS);
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>(PENDING_PATIENTS);

  // Mutators
  const mutateUser = (id: string, patch: Partial<AdminUser>) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const verifyHospital = (id: string) => {
    setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, verified: true } : h)));
    const h = hospitals.find((x) => x.id === id);
    toast.success("Hospital verified", {
      description: `${h?.name} can now approve their own doctors`,
    });
  };

  const revokeHospital = (id: string) => {
    setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, verified: false } : h)));
    const h = hospitals.find((x) => x.id === id);
    toast.error("Verification revoked", {
      description: `${h?.name} is now pending re-verification`,
    });
  };

  const approveDoctor = (id: string) => {
    const d = pendingDoctors.find((x) => x.id === id);
    setPendingDoctors((prev) => prev.filter((x) => x.id !== id));
    toast.success("Doctor approved", {
      description: `${d?.name} — ${d?.specialty} can now practise at ${d?.hospital}`,
    });
  };

  const rejectDoctor = (id: string) => {
    const d = pendingDoctors.find((x) => x.id === id);
    setPendingDoctors((prev) => prev.filter((x) => x.id !== id));
    toast.error("Doctor application rejected", { description: `${d?.name} notified by SMS` });
  };

  const approvePatient = (id: string) => {
    const p = pendingPatients.find((x) => x.id === id);
    setPendingPatients((prev) => prev.filter((x) => x.id !== id));
    toast.success("Patient ID verified", { description: `${p?.name} — ${p?.idType} check passed` });
  };

  const rejectPatient = (id: string) => {
    const p = pendingPatients.find((x) => x.id === id);
    setPendingPatients((prev) => prev.filter((x) => x.id !== id));
    toast.error("Patient ID check failed", { description: `${p?.name} asked to re-submit` });
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        <TabBar tab={tab} setTab={setTab} />
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "overview" && <OverviewView users={users} hospitals={hospitals} pendingDoctors={pendingDoctors} pendingPatients={pendingPatients} setTab={setTab} />}
            {tab === "users" && <UsersView users={users} mutateUser={mutateUser} />}
            {tab === "hospitals" && <HospitalsView hospitals={hospitals} verifyHospital={verifyHospital} revokeHospital={revokeHospital} />}
            {tab === "verifications" && (
              <VerificationsView
                hospitals={hospitals}
                verifyHospital={verifyHospital}
                revokeHospital={revokeHospital}
                pendingDoctors={pendingDoctors}
                approveDoctor={approveDoctor}
                rejectDoctor={rejectDoctor}
                pendingPatients={pendingPatients}
                approvePatient={approvePatient}
                rejectPatient={rejectPatient}
              />
            )}
            {tab === "audit" && <AuditView />}
            {tab === "health" && <SystemHealthView />}
            {tab === "settings" && <SettingsView />}
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
    <div className="glass-panel sticky top-20 z-20 flex gap-1 overflow-x-auto rounded-2xl p-1.5">
      {TABS.map((t) => {
        const active = tab === t.id;
        const Icon = t.icon;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={active}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors sm:px-4",
              active ? "text-medical-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="admin-tab-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-medical to-cyan-500 shadow-[0_6px_20px_var(--glow-1)]"
                transition={{ type: "spring", damping: 26, stiffness: 320 }}
              />
            )}
            <Icon className="relative h-4 w-4" />
            <span className="relative hidden sm:inline">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   Shared sub-components
   ========================================================================= */

function SectionHeader({
  kicker,
  title,
  subtitle,
  icon: Icon,
}: {
  kicker?: string;
  title: React.ReactNode;
  subtitle?: string;
  icon?: typeof Activity;
}) {
  return (
    <div className="mb-5">
      {kicker && (
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-medical/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider text-medical">
          {Icon && <Icon className="h-3 w-3" />}
          {kicker}
        </div>
      )}
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  deltaTone = "up",
  icon: Icon,
  tint = "from-medical to-cyan-400",
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  icon: typeof Activity;
  tint?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      custom={0}
      className="stat-card group relative overflow-hidden p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {value}
          </div>
          {delta && (
            <div
              className={cn(
                "mt-1 inline-flex items-center gap-1 text-xs font-medium",
                deltaTone === "up" && "text-emerald-600 dark:text-emerald-400",
                deltaTone === "down" && "text-rose-600 dark:text-rose-400",
                deltaTone === "flat" && "text-muted-foreground"
              )}
            >
              {deltaTone === "up" && <TrendingUp className="h-3 w-3" />}
              {deltaTone === "down" && <TrendingDown className="h-3 w-3" />}
              {delta}
            </div>
          )}
        </div>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg",
            tint
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </motion.div>
  );
}

function VerifiedBadge({ status }: { status: VerifiedStatus }) {
  const s = VERIFIED_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
        s.badge
      )}
    >
      <span className={cn("status-dot", s.dot)} />
      {s.label}
    </span>
  );
}

/* =========================================================================
   1. OVERVIEW
   ========================================================================= */

function OverviewView({
  users,
  hospitals,
  pendingDoctors,
  pendingPatients,
  setTab,
}: {
  users: AdminUser[];
  hospitals: AdminHospital[];
  pendingDoctors: PendingDoctor[];
  pendingPatients: PendingPatient[];
  setTab: (t: TabId) => void;
}) {
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
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass-panel p-5 lg:col-span-2"
        >
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

        <motion.div
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="glass-panel p-5"
        >
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
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass-panel p-5"
        >
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
          <button
            onClick={() => setTab("health")}
            className="btn-secondary mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium"
          >
            Open monitoring
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>

        <motion.div
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="glass-panel p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-base font-semibold">Recent audit</h3>
              <p className="text-xs text-muted-foreground">Latest activity on the network</p>
            </div>
            <button
              onClick={() => setTab("audit")}
              className="btn-ghost rounded-lg px-2.5 py-1 text-xs font-medium text-medical"
            >
              View all
            </button>
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

function HealthRow({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "emerald" | "amber" | "medical" | "rose";
  hint?: string;
}) {
  const toneCls = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    medical: "bg-medical",
    rose: "bg-rose-500",
  }[tone];
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
      <span className={cn("status-dot", toneCls)} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[0.7rem] text-muted-foreground">{hint}</div>}
      </div>
      <div className="font-display text-sm font-semibold">{value}</div>
    </div>
  );
}

/* =========================================================================
   2. USERS
   ========================================================================= */

function UsersView({
  users,
  mutateUser,
}: {
  users: AdminUser[];
  mutateUser: (id: string, patch: Partial<AdminUser>) => void;
}) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesQuery =
        !query ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || u.verified === statusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, query, roleFilter, statusFilter]);

  const toggleSuspend = (u: AdminUser) => {
    const next: VerifiedStatus = u.verified === "suspended" ? "approved" : "suspended";
    mutateUser(u.id, { verified: next });
    if (next === "suspended") {
      toast.warning("Account suspended", { description: `${u.name} can no longer sign in` });
    } else {
      toast.success("Account reactivated", { description: `${u.name} can sign in again` });
    }
  };

  const verifyUser = (u: AdminUser) => {
    mutateUser(u.id, { verified: "approved" });
    toast.success("User verified", { description: `${u.name} — ${u.role} account is now active` });
  };

  const blockUser = (u: AdminUser) => {
    mutateUser(u.id, { verified: "rejected" });
    toast.error("User blocked", { description: `${u.name} permanently blocked for policy violation` });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="Account oversight"
        icon={Users}
        title={
          <>
            All <span className="text-gradient-medical">accounts</span>
          </>
        }
        subtitle="Every patient, doctor, hospital and pharmacy on the network — across all roles."
      />

      {/* Filters */}
      <div className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="input-premium h-9 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-9 w-[130px]" aria-label="Filter by role">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="Patient">Patient</SelectItem>
              <SelectItem value="Doctor">Doctor</SelectItem>
              <SelectItem value="Hospital">Hospital</SelectItem>
              <SelectItem value="Pharmacy">Pharmacy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All status</SelectItem>
              <SelectItem value="approved">Verified</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-background/30 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Joined</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.map((u, i) => {
                  const roleMeta = ROLE_STYLE[u.role];
                  const RoleIcon = roleMeta.icon;
                  return (
                    <motion.tr
                      key={u.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ delay: i * 0.02, duration: 0.2 }}
                      className="border-b border-border/40 transition-colors hover:bg-medical/5"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br text-[0.65rem] font-bold text-white", roleMeta.tint)}>
                            {initialsOf(u.name)}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{u.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium">
                          <RoleIcon className="h-3 w-3" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <VerifiedBadge status={u.verified} />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{u.joined}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelected(u)}
                            className="btn-ghost grid h-8 w-8 place-items-center rounded-lg"
                            aria-label={`View ${u.name}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {u.verified === "pending" && (
                            <button
                              onClick={() => verifyUser(u)}
                              className="btn-secondary inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                              aria-label={`Verify ${u.name}`}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Verify</span>
                            </button>
                          )}
                          {u.verified !== "pending" && u.verified !== "rejected" && (
                            <button
                              onClick={() => toggleSuspend(u)}
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium",
                                u.verified === "suspended"
                                  ? "btn-secondary"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15"
                              )}
                              aria-label={u.verified === "suspended" ? `Activate ${u.name}` : `Suspend ${u.name}`}
                            >
                              {u.verified === "suspended" ? (
                                <>
                                  <UserCheck className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Activate</span>
                                </>
                              ) : (
                                <>
                                  <UserX className="h-3.5 w-3.5" />
                                  <span className="hidden sm:inline">Suspend</span>
                                </>
                              )}
                            </button>
                          )}
                          {u.verified !== "rejected" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <button
                                  className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/15 dark:text-rose-400"
                                  aria-label={`Block ${u.name}`}
                                >
                                  <Ban className="h-3.5 w-3.5" />
                                </button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="glass-strong">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Block user permanently?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {u.name} will be permanently blocked from signing in. Their records remain on the network for POPIA compliance but the account is revoked. This action is logged to the audit trail.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="btn-secondary">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => blockUser(u)}
                                    className="bg-rose-500 text-white hover:bg-rose-600"
                                  >
                                    Block user
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="grid place-items-center gap-2 py-16 text-muted-foreground">
            <Search className="h-8 w-8 opacity-40" />
            <p className="text-sm">No users match your filters.</p>
          </div>
        )}
        <div className="border-t border-border/40 px-4 py-2.5 text-xs text-muted-foreground">
          Showing {filtered.length} of {users.length} accounts
        </div>
      </div>

      {/* User detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="glass-strong w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">Account details</SheetTitle>
                <SheetDescription className="text-left sr-only">
                  View and manage {selected.name}'s account.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-6 pb-8">
                {/* Header */}
                <div className="flex items-center gap-4">
                  <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-base font-bold text-white", ROLE_STYLE[selected.role].tint)}>
                    {initialsOf(selected.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-lg font-bold">{selected.name}</div>
                    <div className="truncate text-sm text-muted-foreground">{selected.email}</div>
                    <div className="mt-1">
                      <VerifiedBadge status={selected.verified} />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="glass-card grid grid-cols-2 gap-3 p-4 text-sm">
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">Role</div>
                    <div className="font-medium">{selected.role}</div>
                  </div>
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">Joined</div>
                    <div className="font-medium">{selected.joined}</div>
                  </div>
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">Province</div>
                    <div className="font-medium">{selected.province || "Gauteng"}</div>
                  </div>
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-wider text-muted-foreground">Phone</div>
                    <div className="font-medium">{selected.phone || "+27 82 000 0000"}</div>
                  </div>
                </div>

                {/* Activity stub */}
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Account activity (last 30 days)
                  </div>
                  <div className="space-y-2">
                    {[
                      { label: "Sign-ins", value: "47" },
                      { label: "Records created", value: "12" },
                      { label: "Audit events", value: "63" },
                      { label: "Last sign-in", value: "34m ago · iPhone" },
                    ].map((r) => (
                      <div key={r.label} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm">
                        <span className="text-muted-foreground">{r.label}</span>
                        <span className="font-medium">{r.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {selected.verified === "pending" && (
                    <button
                      onClick={() => {
                        verifyUser(selected);
                        setSelected(null);
                      }}
                      className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      Verify account
                    </button>
                  )}
                  <button
                    onClick={() => {
                      toggleSuspend(selected);
                      setSelected(null);
                    }}
                    className="btn-secondary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
                  >
                    {selected.verified === "suspended" ? (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Reactivate account
                      </>
                    ) : (
                      <>
                        <UserX className="h-4 w-4" />
                        Suspend account
                      </>
                    )}
                  </button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-500/15 dark:text-rose-400">
                        <Ban className="h-4 w-4" />
                        Block user permanently
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-strong">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Block {selected.name}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This permanently revokes the account. Logged to audit. POPIA records retained.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="btn-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            blockUser(selected);
                            setSelected(null);
                          }}
                          className="bg-rose-500 text-white hover:bg-rose-600"
                        >
                          Block user
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* =========================================================================
   3. HOSPITALS
   ========================================================================= */

function HospitalsView({
  hospitals,
  verifyHospital,
  revokeHospital,
}: {
  hospitals: AdminHospital[];
  verifyHospital: (id: string) => void;
  revokeHospital: (id: string) => void;
}) {
  const [selected, setSelected] = useState<AdminHospital | null>(null);

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="Trust chain"
        icon={Building2}
        title={
          <>
            Hospitals on the <span className="text-gradient-medical">network</span>
          </>
        }
        subtitle="Admin verifies hospitals → hospitals verify their doctors → doctors practise."
      />

      {/* Trust chain explainer */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="show"
        className="glass-panel relative overflow-hidden p-5"
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-medical/10 blur-3xl" />
        <div className="relative grid gap-3 sm:grid-cols-3">
          {[
            { step: "01", title: "Admin verifies hospital", desc: "Identity, CEO & license checks.", icon: ShieldCheck, tint: "from-medical to-cyan-400" },
            { step: "02", title: "Hospital verifies doctors", desc: "HPCSA + SANC credentialing.", icon: Building2, tint: "from-emerald-500 to-cyan-400" },
            { step: "03", title: "Doctors practise", desc: "Consults, scripts & clinical notes.", icon: Stethoscope, tint: "from-violet-500 to-medical" },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={s.step} className="flex items-center gap-3">
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", s.tint)}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {s.step}
                  </div>
                  <div className="text-sm font-semibold">{s.title}</div>
                  <div className="text-xs text-muted-foreground">{s.desc}</div>
                </div>
                {i < 2 && <ChevronRight className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Hospital cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {hospitals.map((h, i) => (
          <motion.div
            key={h.id}
            variants={fadeUp}
            custom={i}
            initial="hidden"
            animate="show"
            className="glass-panel card-premium p-5"
          >
            <div className="flex items-start gap-4">
              <span className={cn(
                "grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-white shadow-lg",
                h.verified ? "bg-gradient-to-br from-emerald-500 to-cyan-400" : "bg-gradient-to-br from-amber-500 to-rose-400"
              )}>
                <Building2 className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-bold">{h.name}</h3>
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {h.province}{h.district ? ` · ${h.district}` : ""}
                    </div>
                  </div>
                  <VerifiedBadge status={h.verified ? "approved" : "pending"} />
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-2">
                    <div className="font-display text-lg font-bold">{h.beds.toLocaleString()}</div>
                    <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Beds</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-2">
                    <div className="font-display text-lg font-bold">{h.doctors}</div>
                    <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Doctors</div>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-background/40 px-2 py-2">
                    <div className="font-display text-lg font-bold">{h.joined.includes("day") ? "—" : "✓"}</div>
                    <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">Joined</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setSelected(h)}
                    className="btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View details
                  </button>
                  {!h.verified ? (
                    <button
                      onClick={() => verifyHospital(h.id)}
                      className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verify
                    </button>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/15 dark:text-rose-400">
                          <RotateCcw className="h-3.5 w-3.5" />
                          Revoke
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-strong">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Revoke verification?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {h.name} will return to pending status. Their doctors lose prescribing privileges until the hospital is re-verified. Logged to audit.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="btn-secondary">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => revokeHospital(h.id)}
                            className="bg-rose-500 text-white hover:bg-rose-600"
                          >
                            Revoke verification
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                  {h.ceo && (
                    <span className="ml-auto text-[0.7rem] text-muted-foreground">
                      CEO: <span className="font-medium text-foreground">{h.ceo}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hospital detail drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="glass-strong w-full overflow-y-auto sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="text-left">Hospital profile</SheetTitle>
                <SheetDescription className="sr-only">View {selected.name}'s details.</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 px-6 pb-8">
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white",
                    selected.verified ? "bg-gradient-to-br from-emerald-500 to-cyan-400" : "bg-gradient-to-br from-amber-500 to-rose-400"
                  )}>
                    <Building2 className="h-7 w-7" />
                  </span>
                  <div>
                    <div className="font-display text-lg font-bold">{selected.name}</div>
                    <div className="text-sm text-muted-foreground">{selected.province}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <InfoTile icon={BedDouble} label="Beds" value={selected.beds.toLocaleString()} />
                  <InfoTile icon={Stethoscope} label="Doctors" value={String(selected.doctors)} />
                  <InfoTile icon={MapPin} label="Province" value={selected.province} />
                  <InfoTile icon={Clock} label="Joined" value={selected.joined} />
                  {selected.ceo && <InfoTile icon={Crown} label="CEO" value={selected.ceo} />}
                  {selected.district && <InfoTile icon={Globe} label="District" value={selected.district} />}
                </div>

                <div>
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Trust chain
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                      <span className="text-muted-foreground">Hospital verified by</span>
                      <span className="font-medium">{selected.verified ? "MedLink SA Admin" : "Pending"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                      <span className="text-muted-foreground">Doctors verified by</span>
                      <span className="font-medium">{selected.verified ? "This hospital" : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                      <span className="text-muted-foreground">Can issue scripts</span>
                      <span className={cn("font-medium", selected.verified ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}>
                        {selected.verified ? "Yes" : "No — pending verification"}
                      </span>
                    </div>
                  </div>
                </div>

                {!selected.verified && (
                  <button
                    onClick={() => {
                      verifyHospital(selected.id);
                      setSelected(null);
                    }}
                    className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Verify hospital
                  </button>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="glass-card p-3">
      <div className="mb-1 flex items-center gap-1.5 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

/* =========================================================================
   4. VERIFICATIONS QUEUE
   ========================================================================= */

function VerificationsView({
  hospitals,
  verifyHospital,
  pendingDoctors,
  approveDoctor,
  rejectDoctor,
  pendingPatients,
  approvePatient,
  rejectPatient,
}: {
  hospitals: AdminHospital[];
  verifyHospital: (id: string) => void;
  revokeHospital: (id: string) => void;
  pendingDoctors: PendingDoctor[];
  approveDoctor: (id: string) => void;
  rejectDoctor: (id: string) => void;
  pendingPatients: PendingPatient[];
  approvePatient: (id: string) => void;
  rejectPatient: (id: string) => void;
}) {
  const [sub, setSub] = useState<"hospitals" | "doctors" | "patients">("hospitals");
  const pendingHospitals = hospitals.filter((h) => !h.verified);

  const subTabs = [
    { id: "hospitals" as const, label: "Hospitals", count: pendingHospitals.length, icon: Building2 },
    { id: "doctors" as const, label: "Doctors", count: pendingDoctors.length, icon: Stethoscope },
    { id: "patients" as const, label: "Patients", count: pendingPatients.length, icon: IdCard },
  ];

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="Approval workflow"
        icon={ShieldCheck}
        title={
          <>
            Verification <span className="text-gradient-medical">queue</span>
          </>
        }
        subtitle="Everything pending verification across the network — hospitals, doctors and patient ID checks."
      />

      {/* Sub tabs */}
      <div className="glass-panel flex gap-1 rounded-2xl p-1.5">
        {subTabs.map((s) => {
          const active = sub === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              onClick={() => setSub(s.id)}
              aria-pressed={active}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                active ? "text-medical-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <motion.span
                  layoutId="verify-sub-pill"
                  className="absolute inset-0 rounded-xl bg-gradient-to-br from-medical to-cyan-500 shadow-[0_6px_20px_var(--glow-1)]"
                  transition={{ type: "spring", damping: 26, stiffness: 320 }}
                />
              )}
              <Icon className="relative h-4 w-4" />
              <span className="relative">{s.label}</span>
              <span className={cn(
                "relative grid h-5 min-w-5 place-items-center rounded-full px-1 text-[0.65rem] font-bold",
                active ? "bg-white/25 text-white" : "bg-foreground/10 text-foreground"
              )}>
                {s.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Queue */}
      <AnimatePresence mode="wait">
        <motion.div
          key={sub}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="space-y-3"
        >
          {sub === "hospitals" && (
            <>
              {pendingHospitals.length === 0 && <EmptyQueue label="hospitals" />}
              {pendingHospitals.map((h, i) => (
                <VerificationItem
                  key={h.id}
                  index={i}
                  icon={Building2}
                  tint="from-amber-500 to-rose-400"
                  title={h.name}
                  subtitle={`${h.province} · ${h.beds} beds · ${h.doctors} doctors`}
                  submittedBy="Self-registration"
                  date={h.joined}
                  docs={[
                    { label: "Hospital license", value: "License #WC-2024-8821" },
                    { label: "CEO ID", value: h.ceo || "On file" },
                    { label: "Facility inspection", value: "Passed · 18 May 2025" },
                    { label: "District health office", value: h.district || "Confirmed" },
                  ]}
                  onApprove={() => verifyHospital(h.id)}
                  onReject={() => toast.error("Hospital application rejected", { description: `${h.name} notified` })}
                />
              ))}
            </>
          )}

          {sub === "doctors" && (
            <>
              {pendingDoctors.length === 0 && <EmptyQueue label="doctors" />}
              {pendingDoctors.map((d, i) => (
                <VerificationItem
                  key={d.id}
                  index={i}
                  icon={Stethoscope}
                  tint="from-medical to-cyan-400"
                  title={d.name}
                  subtitle={`${d.specialty} · ${d.hospital}`}
                  submittedBy={d.hospital}
                  date={d.submitted}
                  docs={[
                    { label: "HPCSA / SANC #", value: d.hpcsa },
                    { label: "Qualification", value: "MBChB · Wits 2014" },
                    { label: "Specialist registration", value: "FC Paeds (SA) · 2021" },
                    { label: "Police clearance", value: "Issued 14 Apr 2025" },
                  ]}
                  onApprove={() => approveDoctor(d.id)}
                  onReject={() => rejectDoctor(d.id)}
                />
              ))}
            </>
          )}

          {sub === "patients" && (
            <>
              {pendingPatients.length === 0 && <EmptyQueue label="patients" />}
              {pendingPatients.map((p, i) => (
                <VerificationItem
                  key={p.id}
                  index={i}
                  icon={IdCard}
                  tint="from-violet-500 to-medical"
                  title={p.name}
                  subtitle={`${p.idType} check · ${p.hospital}`}
                  submittedBy={p.hospital}
                  date={p.submitted}
                  docs={[
                    { label: "Document type", value: p.idType },
                    { label: "Document number", value: "•••• •••• 8821" },
                    { label: "Selfie match", value: "98.4% — pass" },
                    { label: "Home Affairs check", value: "Pending" },
                  ]}
                  onApprove={() => approvePatient(p.id)}
                  onReject={() => rejectPatient(p.id)}
                />
              ))}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function EmptyQueue({ label }: { label: string }) {
  return (
    <div className="glass-panel grid place-items-center gap-3 py-16 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-7 w-7" />
      </span>
      <div>
        <div className="font-display text-base font-semibold">All caught up</div>
        <div className="text-sm text-muted-foreground">No pending {label} in the queue right now.</div>
      </div>
    </div>
  );
}

function VerificationItem({
  index,
  icon: Icon,
  tint,
  title,
  subtitle,
  submittedBy,
  date,
  docs,
  onApprove,
  onReject,
}: {
  index: number;
  icon: typeof Activity;
  tint: string;
  title: string;
  subtitle: string;
  submittedBy: string;
  date: string;
  docs: { label: string; value: string }[];
  onApprove: () => void;
  onReject: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      variants={fadeUp}
      custom={index}
      initial="hidden"
      animate="show"
      className="glass-panel card-premium p-4"
    >
      <div className="flex items-start gap-3">
        <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow", tint)}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{title}</h3>
              <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[0.7rem] font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              {date}
            </span>
          </div>

          <div className="mt-1 text-[0.7rem] text-muted-foreground">
            Submitted by <span className="font-medium text-foreground">{submittedBy}</span>
          </div>

          {/* Review documents */}
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-medical hover:bg-medical/10"
          >
            <FileText className="h-3.5 w-3.5" />
            {expanded ? "Hide documents" : "Review documents"}
            <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          </button>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mt-2 grid gap-2 rounded-xl border border-border/60 bg-background/40 p-3 sm:grid-cols-2">
                  {docs.map((d) => (
                    <div key={d.label} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground">{d.label}</span>
                      <span className="font-medium">{d.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={onApprove}
              className="btn-primary inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              <Check className="h-3.5 w-3.5" />
              Approve
            </button>
            <button
              onClick={onReject}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-500/15 dark:text-rose-400"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* =========================================================================
   5. AUDIT LOG (Notion-style)
   ========================================================================= */

function AuditView() {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<AuditKind | "all">("all");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const kinds: (AuditKind | "all")[] = ["all", "auth", "create", "edit", "delete", "verify", "system"];

  const filtered = useMemo(() => {
    return AUDIT_EXTENDED.filter((e) => {
      const matchesQuery =
        !query ||
        e.actor.toLowerCase().includes(query.toLowerCase()) ||
        e.action.toLowerCase().includes(query.toLowerCase()) ||
        e.target.toLowerCase().includes(query.toLowerCase());
      const matchesKind = kindFilter === "all" || e.kind === kindFilter;
      return matchesQuery && matchesKind;
    });
  }, [query, kindFilter]);

  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const exportMock = () => {
    toast.success("Audit log exported", {
      description: "medlink-audit-2025-06-20.csv · 7 events · POPIA compliant",
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="Notion-style timeline"
        icon={ScrollText}
        title={
          <>
            Audit <span className="text-gradient-medical">log</span>
          </>
        }
        subtitle="A story of every action on the network — signed, hashed and POPIA-compliant."
      />

      {/* Toolbar */}
      <div className="glass-panel flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action or target…"
            aria-label="Search audit log"
            className="input-premium h-9 pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {kinds.map((k) => {
            const active = kindFilter === k;
            const meta = k === "all" ? null : AUDIT_KIND_META[k as AuditKind];
            const Icon = meta?.icon || CircleDashed;
            return (
              <button
                key={k}
                onClick={() => setKindFilter(k)}
                aria-pressed={active}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                  active
                    ? "border-medical/30 bg-medical/15 text-medical"
                    : "border-border/60 bg-background/30 text-muted-foreground hover:text-foreground"
                )}
              >
                {meta ? <Icon className={cn("h-3 w-3", meta.color)} /> : <Icon className="h-3 w-3" />}
                {k === "all" ? "All" : meta!.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={exportMock}
          className="btn-secondary inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium"
          aria-label="Export audit log"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Timeline */}
      <div className="glass-panel p-5">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute bottom-2 left-[15px] top-2 w-px bg-gradient-to-b from-medical/40 via-border to-transparent" />

          <ol className="space-y-2">
            <AnimatePresence mode="popLayout">
              {filtered.map((e, i) => {
                const meta = AUDIT_KIND_META[e.kind];
                const Icon = meta.icon;
                const isOpen = !!expanded[e.id];
                return (
                  <motion.li
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.03, duration: 0.22 }}
                  >
                    <button
                      onClick={() => toggle(e.id)}
                      aria-expanded={isOpen}
                      className="group relative flex w-full items-start gap-4 rounded-xl p-2.5 text-left transition-colors hover:bg-medical/5"
                    >
                      {/* Icon node */}
                      <span className={cn("relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full ring-4 ring-background", meta.bg, meta.color)}>
                        <Icon className="h-4 w-4" />
                      </span>

                      {/* Body */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                          <p className="text-sm leading-snug">
                            <span className="font-semibold">{e.actor}</span>{" "}
                            <span className="text-muted-foreground">{e.action}</span>{" "}
                            <span className="font-medium">{e.target}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <span className={cn("chip border-0 text-[0.65rem] font-semibold", meta.bg, meta.color)}>
                              {meta.label}
                            </span>
                            <span className="text-[0.7rem] text-muted-foreground">{e.time}</span>
                            <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.22 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 grid gap-2 rounded-lg border border-border/60 bg-background/40 p-3 text-xs sm:grid-cols-2 lg:grid-cols-4">
                                <DetailCell icon={Globe} label="IP address" value={e.ip} />
                                <DetailCell icon={Monitor} label="Device" value={e.device} />
                                <DetailCell icon={Fingerprint} label="Attested hash" value={e.hash} mono />
                                <DetailCell icon={Lock} label="Signed by" value="MedLink SA · Ed25519" />
                              </div>
                              <p className="mt-2 text-[0.7rem] text-muted-foreground">
                                Attested & cryptographically signed. Tamper-evident — any modification invalidates the chain. Retained 7 years per POPIA.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        </div>

        {filtered.length === 0 && (
          <div className="grid place-items-center gap-2 py-12 text-muted-foreground">
            <Search className="h-7 w-7 opacity-40" />
            <p className="text-sm">No events match your filters.</p>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-xs text-muted-foreground">
          <span>{filtered.length} of {AUDIT_EXTENDED.length} events</span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3 w-3" />
            Chain intact · last verified 1m ago
          </span>
        </div>
      </div>
    </div>
  );
}

function DetailCell({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  mono?: boolean;
}) {
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

/* =========================================================================
   6. SYSTEM HEALTH
   ========================================================================= */

function SystemHealthView() {
  const [metrics, setMetrics] = useState(SYSTEM_METRICS);
  const [restarting, setRestarting] = useState(false);

  // simulate live jitter
  useEffect(() => {
    const id = setInterval(() => {
      setMetrics((m) => ({
        ...m,
        apiLatency: Math.max(80, Math.min(220, m.apiLatency + (Math.random() > 0.5 ? 1 : -1) * 6)),
        activeSessions: Math.max(4000, m.activeSessions + Math.floor((Math.random() - 0.5) * 60)),
        cpuLoad: Math.max(20, Math.min(80, m.cpuLoad + (Math.random() > 0.5 ? 1 : -1) * 3)),
        memoryLoad: Math.max(30, Math.min(85, m.memoryLoad + (Math.random() > 0.5 ? 1 : -1) * 2)),
      }));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const forceSync = () => {
    setMetrics((m) => ({ ...m, dhis2Status: "syncing", dhis2LastSync: "syncing…" }));
    toast.info("DHIS2 sync started", { description: "Pushing 8 queued records to the national registry" });
    setTimeout(() => {
      setMetrics((m) => ({ ...m, dhis2Status: "in-sync", dhis2LastSync: "just now", dhis2Queue: 0 }));
      toast.success("DHIS2 sync complete", { description: "8 records pushed · 0 failed · next sync in 15 min" });
    }, 2400);
  };

  const restartService = () => {
    setRestarting(true);
    toast.warning("Service restart initiated", { description: "MedLink SA core services restarting…" });
    setTimeout(() => {
      setRestarting(false);
      toast.success("Service restarted", { description: "All microservices healthy · 0 errors" });
    }, 3500);
  };

  const uptimeData = [{ name: "uptime", value: metrics.uptime, fill: "var(--medical)" }];
  const apiData = [{ name: "latency", value: metrics.apiLatency, fill: "#06b6d4" }];

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="Live monitoring"
        icon={Server}
        title={
          <>
            System <span className="text-gradient-medical">health</span>
          </>
        }
        subtitle="Real-time monitoring across the MedLink SA infrastructure and 9 provincial edges."
      />

      {/* Top row: uptime + API gauge + DHIS2 */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-5">
          <PanelHeader icon={ActivityIcon} title="Uptime" subtitle="30-day rolling" />
          <div className="relative h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="68%" outerRadius="100%" data={uptimeData} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "var(--border)" }} dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display text-3xl font-bold text-emerald-600 dark:text-emerald-400">{metrics.uptime}%</div>
                <div className="text-[0.65rem] text-muted-foreground">SLA 99.95%</div>
              </div>
            </div>
          </div>
          <div className="mt-2 text-center text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 inline h-3 w-3" />
            Within SLA
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show" className="glass-panel p-5">
          <PanelHeader icon={Zap} title="API response time" subtitle="p50 across edges" />
          <div className="relative h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="68%" outerRadius="100%" data={apiData} startAngle={90} endAngle={30}>
                <PolarAngleAxis type="number" domain={[0, 400]} angleAxisId={0} tick={false} />
                <RadialBar background={{ fill: "var(--border)" }} dataKey="value" cornerRadius={20} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <div className="font-display text-3xl font-bold">{metrics.apiLatency}<span className="text-base">ms</span></div>
                <div className="text-[0.65rem] text-muted-foreground">p50 · {metrics.apiP95}ms p95</div>
              </div>
            </div>
          </div>
          <div className="mt-2 flex justify-around text-center text-xs">
            <div>
              <div className="font-semibold text-medical">{metrics.apiP50}ms</div>
              <div className="text-[0.65rem] text-muted-foreground">p50</div>
            </div>
            <div>
              <div className="font-semibold text-amber-600 dark:text-amber-400">{metrics.apiP95}ms</div>
              <div className="text-[0.65rem] text-muted-foreground">p95</div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show" className="glass-panel p-5">
          <PanelHeader icon={CloudUpload} title="DHIS2 sync" subtitle="National registry" />
          <div className="mt-2 flex items-center gap-3">
            <span className={cn(
              "grid h-12 w-12 place-items-center rounded-xl",
              metrics.dhis2Status === "in-sync" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
              metrics.dhis2Status === "syncing" && "bg-medical/10 text-medical",
              metrics.dhis2Status === "error" && "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}>
              {metrics.dhis2Status === "syncing" ? (
                <RefreshCw className="h-6 w-6 animate-spin" />
              ) : (
                <Database className="h-6 w-6" />
              )}
            </span>
            <div>
              <div className="font-display text-lg font-bold capitalize">
                {metrics.dhis2Status === "in-sync" ? "In sync" : metrics.dhis2Status === "syncing" ? "Syncing…" : "Error"}
              </div>
              <div className="text-xs text-muted-foreground">Last sync {metrics.dhis2LastSync}</div>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <span className="text-muted-foreground">Queue</span>
              <span className="font-medium">{metrics.dhis2Queue} records</span>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
              <span className="text-muted-foreground">Next sync</span>
              <span className="font-medium">in 14 min</span>
            </div>
          </div>
          <button
            onClick={forceSync}
            disabled={metrics.dhis2Status === "syncing"}
            className="btn-primary mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", metrics.dhis2Status === "syncing" && "animate-spin")} />
            Force DHIS2 sync
          </button>
        </motion.div>
      </div>

      {/* DB + Sessions + Resource load */}
      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-5">
          <PanelHeader icon={Database} title="Database" subtitle="PostgreSQL 15.4 · primary" />
          <div className="mt-3 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Connection pool</span>
                <span className="font-medium">{metrics.dbPool}/{metrics.dbPoolMax}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-foreground/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-medical to-cyan-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${(metrics.dbPool / metrics.dbPoolMax) * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
            </div>
            <HealthRow label="Status" value="Healthy" tone="emerald" hint="0 deadlocks · 0 slow queries" />
            <HealthRow label="Size" value={metrics.dbSize} tone="medical" hint="Logs · 38 GB · 30-day" />
            <HealthRow label="Replica lag" value="0.4s" tone="emerald" hint="Read replica · Cape Town" />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show" className="glass-panel p-5">
          <PanelHeader icon={Users} title="Active sessions" subtitle="Live users right now" />
          <div className="mt-2 font-display text-5xl font-bold text-gradient-medical">
            {metrics.activeSessions.toLocaleString()}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            <TrendingUp className="mr-1 inline h-3 w-3 text-emerald-500" />
            +8.4% vs hour ago
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <SessionRow label="Patients" value="2,847" pct={66} />
            <SessionRow label="Doctors" value="812" pct={19} />
            <SessionRow label="Hospital staff" value="489" pct={11} />
            <SessionRow label="Pharmacy" value="135" pct={4} />
          </div>
        </motion.div>

        <motion.div variants={fadeUp} custom={2} initial="hidden" animate="show" className="glass-panel p-5">
          <PanelHeader icon={Cpu} title="Resource load" subtitle="Cluster · 8 nodes" />
          <div className="mt-3 space-y-3">
            <ResourceBar icon={Cpu} label="CPU" value={metrics.cpuLoad} tint="from-medical to-cyan-400" />
            <ResourceBar icon={HardDrive} label="Memory" value={metrics.memoryLoad} tint="from-violet-500 to-medical" />
            <ResourceBar icon={HardDrive} label="Disk I/O" value={metrics.diskLoad} tint="from-amber-500 to-rose-400" />
            <ResourceBar icon={Wifi} label="Network" value={28} tint="from-emerald-500 to-cyan-400" />
          </div>
        </motion.div>
      </div>

      {/* Regional status */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-5">
        <PanelHeader icon={Globe} title="Regional status" subtitle="9 provinces · edge nodes" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {SA_PROVINCES_HEALTH.map((p) => (
            <div
              key={p.name}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-background/40 p-3 transition-colors hover:border-medical/30"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{p.name}</span>
                <span
                  className={cn(
                    "status-dot",
                    p.status === "green" ? "bg-emerald-500" : "bg-amber-500"
                  )}
                  title={p.status === "green" ? "Operational" : "Degraded"}
                />
              </div>
              <div className="mt-1 flex items-center gap-3 text-[0.7rem] text-muted-foreground">
                <span>{p.sessions.toLocaleString()} sessions</span>
                <span>{p.latency}ms</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel border-rose-500/20 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <ShieldAlert className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold">Danger zone</h3>
              <p className="text-xs text-muted-foreground">
                Restart core services. All active sessions drop briefly. Use only during incidents.
              </p>
            </div>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={restarting}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-500/15 disabled:opacity-50 dark:text-rose-400"
              >
                {restarting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                {restarting ? "Restarting…" : "Restart service"}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="glass-strong">
              <AlertDialogHeader>
                <AlertDialogTitle>Restart core services?</AlertDialogTitle>
                <AlertDialogDescription>
                  All {metrics.activeSessions.toLocaleString()} active sessions will be dropped for ~3 seconds. The audit log records this action with your admin credentials. Are you sure?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="btn-secondary">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={restartService}
                  className="bg-rose-500 text-white hover:bg-rose-600"
                >
                  Restart now
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </motion.div>
    </div>
  );
}

function PanelHeader({ icon: Icon, title, subtitle }: { icon: typeof Activity; title: string; subtitle: string }) {
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

function SessionRow({ label, value, pct }: { label: string; value: string; pct: number }) {
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

function ResourceBar({ icon: Icon, label, value, tint }: { icon: typeof Activity; label: string; value: number; tint: string }) {
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

/* =========================================================================
   7. SETTINGS
   ========================================================================= */

function SettingsView() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "System Administrator");
  const [email, setEmail] = useState(user?.email || "admin@gmail.com");
  const [phone, setPhone] = useState("+27 11 555 0142");
  const [maintenance, setMaintenance] = useState(false);
  const [signups, setSignups] = useState(true);
  const [language, setLanguage] = useState("en");
  const [twoFactor, setTwoFactor] = useState(true);
  const [auditEmails, setAuditEmails] = useState(true);

  const save = () => {
    updateUser({ name });
    toast.success("Settings saved", {
      description: "Platform configuration updated · audit entry logged",
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        kicker="Platform configuration"
        icon={SettingsIcon}
        title={
          <>
            Admin <span className="text-gradient-medical">settings</span>
          </>
        }
        subtitle="Your profile and the platform-wide toggles that govern MedLink SA."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Profile */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/10 text-medical">
              <Crown className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-sm font-semibold">Admin profile</h3>
              <p className="text-[0.7rem] text-muted-foreground">Your superuser account</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Full name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="input-premium mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} className="input-premium mt-1 h-9" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-premium mt-1 h-9" />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-medical" />
                <div>
                  <div className="text-sm font-medium">Two-factor authentication</div>
                  <div className="text-[0.7rem] text-muted-foreground">TOTP · enrolled 03 Jan 2025</div>
                </div>
              </div>
              <Switch checked={twoFactor} onCheckedChange={setTwoFactor} aria-label="Two-factor authentication" />
            </div>
          </div>
        </motion.div>

        {/* Platform */}
        <motion.div variants={fadeUp} custom={1} initial="hidden" animate="show" className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/10 text-medical">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-display text-sm font-semibold">Platform</h3>
              <p className="text-[0.7rem] text-muted-foreground">Network-wide toggles</p>
            </div>
          </div>
          <div className="space-y-3">
            <ToggleRow
              icon={AlertTriangle}
              title="Maintenance mode"
              desc="Block all sign-ins; show a maintenance banner."
              checked={maintenance}
              onCheckedChange={(v) => {
                setMaintenance(v);
                toast.info(v ? "Maintenance mode ON" : "Maintenance mode OFF", {
                  description: v ? "All sign-ins blocked" : "Sign-ins re-enabled",
                });
              }}
              tone="amber"
            />
            <ToggleRow
              icon={UserCheck}
              title="Open signups"
              desc="Allow new patient / doctor registrations."
              checked={signups}
              onCheckedChange={setSignups}
            />
            <ToggleRow
              icon={FileText}
              title="Daily audit digest"
              desc="Email a summary of audit events every morning."
              checked={auditEmails}
              onCheckedChange={setAuditEmails}
            />
            <div className="rounded-lg border border-border/60 bg-background/40 px-3 py-2.5">
              <Label className="flex items-center gap-1.5 text-xs">
                <Globe className="h-3 w-3" />
                Default language
              </Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="mt-1.5 h-9" aria-label="Default language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zu">isiZulu</SelectItem>
                  <SelectItem value="af">Afrikaans</SelectItem>
                  <SelectItem value="st">Sesotho</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Save bar */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Changes are cryptographically signed and added to the audit log.
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setName(user?.name || "System Administrator");
              setMaintenance(false);
              setSignups(true);
              setLanguage("en");
              toast.info("Changes reverted");
            }}
            className="btn-secondary rounded-lg px-4 py-2 text-sm font-medium"
          >
            Revert
          </button>
          <button
            onClick={save}
            className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium"
          >
            <Save className="h-3.5 w-3.5" />
            Save changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  title,
  desc,
  checked,
  onCheckedChange,
  tone = "medical",
}: {
  icon: typeof Activity;
  title: string;
  desc: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  tone?: "medical" | "amber" | "emerald";
}) {
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
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={title} />
    </div>
  );
}
