"use client";

/* =========================================================================
   MedLink SA — Pharmacy Dashboard
   Task ID: 9-PHARMACY
   ========================================================================= */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Truck,
  Settings,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Check,
  CheckCircle2,
  X,
  MapPin,
  Navigation,
  Bike,
  Car,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  AlertTriangle,
  Pill,
  Tablets,
  Clock,
  Phone,
  Building2,
  Globe,
  Eye,
  EyeOff,
  UserCheck,
  Search,
  Filter,
  ChevronRight,
  MoreVertical,
  Sparkles,
  ShieldCheck,
  Box,
  Boxes,
  Save,
  Circle,
  CircleDot,
  Dot,
  FileText,
  Banknote,
  Route,
  PackageCheck,
  ScanLine,
  History,
  AlertCircle,
  Star,
  Pencil,
} from "lucide-react";

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
} from "recharts";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  PHARMACY_ORDERS,
  PHARMACY_INVENTORY,
  MEDICINES,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

/* -------------------------------------------------------------------------
   Types
   ------------------------------------------------------------------------- */

type TabId =
  | "overview"
  | "orders"
  | "inventory"
  | "pricing"
  | "delivery"
  | "settings";

type OrderStatus = "new" | "preparing" | "ready" | "completed";

type Order = {
  id: string;
  patient: string;
  medicine: string;
  price: number;
  status: OrderStatus;
  delivery: boolean;
  address: string;
  // extended (mock) detail fields
  rxId: string;
  prescribedBy: string;
  prescribedDate: string;
  schedule: number;
  qty: number;
  driver?: string;
  createdAt: string;
  updatedAt: string;
  timeline: { label: string; time: string; done: boolean }[];
};

type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  reorder: number;
  status: "ok" | "low" | "critical";
  category: string;
  lastRestocked: string;
};

type PricedMedicine = {
  id: string;
  name: string;
  generic: string;
  form: string;
  strength: string;
  pack: string;
  schedule: number;
  category: string;
  requiresPrescription: boolean;
  price: number;
  inStock: boolean;
  competitors: { pharmacy: string; price: number }[];
};

type Driver = { id: string; name: string; vehicle: "car" | "bike"; rating: number };

/* -------------------------------------------------------------------------
   Mock data — realistic SA pharmacy context
   ------------------------------------------------------------------------- */

const PHARMACY_PROFILE = {
  name: "Clicks Pharmacy — Rosebank",
  branch: "Rosebank Branch · #C-208",
  address: "Cradock Avenue, Rosebank, Johannesburg, 2196",
  phone: "+27 11 447 2233",
  hours: "Mon–Fri 08:00–21:00, Sat–Sun 09:00–18:00",
  deliveryRadiusKm: 5,
  deliveryFee: 25,
  publicVisible: true,
};

const DRIVERS: Driver[] = [
  { id: "d1", name: "Sipho Mokoena", vehicle: "bike", rating: 4.9 },
  { id: "d2", name: "Themba Khumalo", vehicle: "car", rating: 4.8 },
  { id: "d3", name: "Lebo Nkosi", vehicle: "bike", rating: 4.7 },
  { id: "d4", name: "Jabu Radebe", vehicle: "car", rating: 5.0 },
];

// Delivery pin coordinates (% of map area) — 3 active deliveries
const DELIVERY_PINS = [
  { id: "o1", top: 28, left: 38, label: "Rosebank" },
  { id: "o2", top: 52, left: 64, label: "Sandton" },
  { id: "o4", top: 70, left: 22, label: "Parktown" },
];

const ORDERS_INITIAL: Order[] = PHARMACY_ORDERS.map((o, i) => {
  const matched = MEDICINES.find((m) => o.medicine.toLowerCase().startsWith(m.name.toLowerCase()));
  const schedule = matched?.schedule ?? 0;
  return {
    ...o,
    rxId: `RX-2025-${4470 + i}`,
    prescribedBy: ["Dr. Sipho Dlamini", "Dr. Thandiwe Mokoena", "Dr. R. Naidoo", "Dr. A. Patel", "Walk-in"][i] ?? "Dr. Dlamini",
    prescribedDate: ["12 Jun 2025", "12 Jun 2025", "08 Jun 2025", "10 Jun 2025", "—"][i] ?? "12 Jun 2025",
    schedule,
    qty: [60, 14, 1, 20, 24][i] ?? 1,
    createdAt: ["08:14", "08:42", "07:55", "09:21", "Yesterday 17:30"][i] ?? "Today",
    updatedAt: ["08:14", "08:50", "09:10", "09:21", "Yesterday 17:48"][i] ?? "Today",
    driver: o.delivery && o.status === "preparing" ? undefined : undefined,
    timeline:
      o.status === "new"
        ? [{ label: "Order received", time: "08:14", done: true }]
        : o.status === "preparing"
        ? [
            { label: "Order received", time: "08:42", done: true },
            { label: "Accepted by pharmacist", time: "08:50", done: true },
            { label: "Prescription verified", time: "—", done: false },
            { label: "Dispensed & labelled", time: "—", done: false },
            { label: "Ready for pickup / dispatch", time: "—", done: false },
          ]
        : o.status === "ready"
        ? [
            { label: "Order received", time: "07:55", done: true },
            { label: "Accepted by pharmacist", time: "08:02", done: true },
            { label: "Prescription verified", time: "08:18", done: true },
            { label: "Dispensed & labelled", time: "09:05", done: true },
            { label: "Ready for pickup", time: "09:10", done: true },
          ]
        : [
            { label: "Order received", time: "Yesterday 17:30", done: true },
            { label: "Dispensed", time: "17:35", done: true },
            { label: "Collected in-store", time: "17:48", done: true },
            { label: "Completed", time: "17:48", done: true },
          ],
  };
});

const INVENTORY_INITIAL: InventoryItem[] = PHARMACY_INVENTORY.map((i) => ({
  ...i,
  category:
    i.name.includes("Augmentin") || i.name.includes("Glucophage")
      ? "Chronic"
      : i.name.includes("Ventolin")
      ? "Respiratory"
      : "OTC",
  lastRestocked: "11 Jun 2025",
}));

const PRICED_MEDICINES_INITIAL: PricedMedicine[] = MEDICINES.map((m) => {
  const ourPrice = m.prices.find((p) => p.pharmacy === "Clicks")?.price ?? m.prices[0].price;
  const ourStock = m.prices.find((p) => p.pharmacy === "Clicks")?.inStock ?? true;
  const competitors = m.prices
    .filter((p) => p.pharmacy !== "Clicks")
    .map((p) => ({ pharmacy: p.pharmacy, price: p.price }));
  return {
    id: m.id,
    name: m.name,
    generic: m.generic,
    form: m.form,
    strength: m.strength,
    pack: m.pack,
    schedule: m.schedule,
    category: m.category,
    requiresPrescription: m.requiresPrescription,
    price: ourPrice,
    inStock: ourStock,
    competitors,
  };
});

const ORDERS_BY_STATUS_DATA = [
  { status: "New", count: 2, color: "var(--chart-1)" },
  { status: "Preparing", count: 1, color: "var(--chart-4)" },
  { status: "Ready", count: 1, color: "var(--chart-2)" },
  { status: "Completed", count: 1, color: "var(--chart-5)" },
];

const WEEKLY_REVENUE = [
  { d: "Mon", r: 4200 },
  { d: "Tue", r: 5100 },
  { d: "Wed", r: 4800 },
  { d: "Thu", r: 6200 },
  { d: "Fri", r: 7400 },
  { d: "Sat", r: 5900 },
  { d: "Sun", r: 3100 },
];

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "pricing", label: "Medicine & pricing", icon: Tag },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "settings", label: "Settings", icon: Settings },
];

/* -------------------------------------------------------------------------
   Style helpers
   ------------------------------------------------------------------------- */

const STATUS_META: Record<OrderStatus, { label: string; dot: string; badge: string; col: string }> = {
  new: {
    label: "New",
    dot: "bg-medical",
    badge: "bg-medical/10 text-medical border-medical/20",
    col: "var(--chart-1)",
  },
  preparing: {
    label: "Preparing",
    dot: "bg-amber-500",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    col: "var(--chart-4)",
  },
  ready: {
    label: "Ready",
    dot: "bg-cyan-500",
    badge: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    col: "var(--chart-2)",
  },
  completed: {
    label: "Completed",
    dot: "bg-emerald-500",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    col: "var(--chart-5)",
  },
};

const INV_STATUS_META: Record<
  InventoryItem["status"],
  { label: string; badge: string; dot: string; bar: string; pct: (i: InventoryItem) => number }
> = {
  ok: {
    label: "In stock",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
    bar: "bg-emerald-500",
    pct: (i) => Math.min(100, Math.round((i.stock / (i.reorder * 4)) * 100)),
  },
  low: {
    label: "Low",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
    bar: "bg-amber-500",
    pct: (i) => Math.min(100, Math.round((i.stock / (i.reorder * 2)) * 100)),
  },
  critical: {
    label: "Critical",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    dot: "bg-rose-500",
    bar: "bg-rose-500",
    pct: (i) => Math.min(100, Math.round((i.stock / i.reorder) * 100)),
  },
};

const rand = (n: number) => Math.round(n);

/* =========================================================================
   Page
   ========================================================================= */

export default function PharmacyDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-medical border-t-transparent" />
        </div>
      }
    >
      <PharmacyDashboardInner />
      <SonnerToaster position="top-right" richColors closeButton />
    </Suspense>
  );
}

function PharmacyDashboardInner() {
  const params = useSearchParams();
  const tabParam = (params.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  return (
    <DashboardLayout role="pharmacy">
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
            {tab === "orders" && <OrdersTab />}
            {tab === "inventory" && <InventoryTab />}
            {tab === "pricing" && <PricingTab />}
            {tab === "delivery" && <DeliveryTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

/* =========================================================================
   Tab bar (shared)
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
                ? "text-medical-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
            aria-current={active ? "page" : undefined}
            aria-label={t.label}
          >
            {active && (
              <motion.span
                layoutId="pharmacy-tab-pill"
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
   Shared sub-components
   ========================================================================= */

function StatCard({
  label,
  value,
  delta,
  trend,
  icon: Icon,
  accent,
  ariaLabel,
}: {
  label: string;
  value: string;
  delta?: string;
  trend?: "up" | "down";
  icon: typeof LayoutDashboard;
  accent: string;
  ariaLabel?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 16 },
        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
      }}
      className="stat-card relative overflow-hidden p-5"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold tracking-tight">{value}</p>
        </div>
        <span
          className="grid h-10 w-10 place-items-center rounded-xl"
          style={{ background: `color-mix(in oklab, ${accent} 12%, transparent)`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {delta && (
        <div className="mt-3 flex items-center gap-1.5 text-xs">
          {trend === "up" ? (
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          ) : trend === "down" ? (
            <TrendingDown className="h-3.5 w-3.5 text-rose-500" />
          ) : null}
          <span
            className={cn(
              trend === "up" && "text-emerald-600 dark:text-emerald-400",
              trend === "down" && "text-rose-600 dark:text-rose-400",
              !trend && "text-muted-foreground"
            )}
          >
            {delta}
          </span>
        </div>
      )}
      <span className="sr-only">{ariaLabel ?? `${label}: ${value}`}</span>
    </motion.div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function GlassTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-card rounded-lg border border-border/60 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-foreground">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span>
            {p.name}: <span className="font-medium text-foreground">{p.value}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   1. OVERVIEW TAB
   ========================================================================= */

function OverviewTab({ setTab }: { setTab: (t: TabId) => void }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>(ORDERS_INITIAL);
  const [inventory] = useState<InventoryItem[]>(INVENTORY_INITIAL);

  const newCount = orders.filter((o) => o.status === "new").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const outForDelivery = orders.filter(
    (o) => o.delivery && (o.status === "preparing" || o.status === "ready")
  ).length;
  const lowStockCount = inventory.filter((i) => i.status !== "ok").length;
  const todayRevenue = orders
    .filter((o) => o.status !== "new")
    .reduce((sum, o) => sum + o.price, 0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-panel relative overflow-hidden p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-32 h-48 w-48 rounded-full bg-medical/10 blur-3xl" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">
                <Pill className="h-3 w-3" />
                Pharmacy workspace
              </span>
              {user?.verified === "approved" && (
                <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  SAPC verified
                </span>
              )}
              <span className="chip border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                <CircleDot className="h-3 w-3" />
                Open now · until 21:00
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {greeting}, <span className="text-gradient-medical">{PHARMACY_PROFILE.name}</span>
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {PHARMACY_PROFILE.branch} · {PHARMACY_PROFILE.address}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="glass-card rounded-xl px-4 py-3 text-right">
              <div className="text-xs text-muted-foreground">Today&apos;s revenue</div>
              <div className="font-display text-2xl font-semibold text-gradient-medical">
                R {todayRevenue.toFixed(2)}
              </div>
              <div className="mt-0.5 flex items-center justify-end gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                +18% vs yesterday
              </div>
            </div>
            <Button
              onClick={() => setTab("orders")}
              className="btn-primary gap-2"
              aria-label="View orders"
            >
              <ShoppingCart className="h-4 w-4" />
              View orders
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.07 } } }}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <StatCard
          label="New orders"
          value={String(newCount)}
          delta="Needs acceptance"
          trend="up"
          icon={ShoppingCart}
          accent="var(--medical)"
        />
        <StatCard
          label="Ready for pickup"
          value={String(readyCount)}
          delta="Awaiting collection"
          icon={PackageCheck}
          accent="var(--chart-2)"
        />
        <StatCard
          label="Out for delivery"
          value={String(outForDelivery)}
          delta="In dispatch queue"
          icon={Truck}
          accent="var(--chart-4)"
        />
        <StatCard
          label="Low-stock alerts"
          value={String(lowStockCount)}
          delta="Reorder recommended"
          trend="down"
          icon={AlertTriangle}
          accent="var(--chart-3)"
        />
      </motion.div>

      {/* Charts + low stock + recent orders */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Orders by status donut + bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <SectionHeader
            title="Orders by status"
            subtitle="Live distribution across the fulfilment pipeline"
          />
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="relative h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ORDERS_BY_STATUS_DATA}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={56}
                    outerRadius={86}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {ORDERS_BY_STATUS_DATA.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RTooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <div className="font-display text-2xl font-semibold">{orders.length}</div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Total today
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-2">
              {ORDERS_BY_STATUS_DATA.map((s) => {
                const meta = STATUS_META[s.status.toLowerCase() as OrderStatus];
                return (
                  <div key={s.status} className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
                    <span className={cn("status-dot", meta.dot)} />
                    <span className="flex-1 text-sm font-medium">{s.status}</span>
                    <span className="font-display text-lg font-semibold">{s.count}</span>
                    <span className="text-xs text-muted-foreground">
                      {Math.round((s.count / orders.length) * 100)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly revenue bar */}
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">Revenue this week</h3>
              <span className="text-xs text-muted-foreground">All branches · ZAR</span>
            </div>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={WEEKLY_REVENUE} margin={{ top: 6, right: 6, bottom: 0, left: -22 }}>
                  <defs>
                    <linearGradient id="rev-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--medical)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--medical)" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="d" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <RTooltip content={<GlassTooltip />} cursor={{ fill: "color-mix(in oklab, var(--medical) 8%, transparent)" }} />
                  <Bar dataKey="r" name="Revenue (R)" fill="url(#rev-fill)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Low stock alerts */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="glass-panel flex flex-col p-5"
        >
          <SectionHeader
            title="Low stock alerts"
            subtitle="Items at or below reorder level"
            action={
              <Button
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-medical"
                onClick={() => setTab("inventory")}
                aria-label="Open inventory"
              >
                Manage <ChevronRight className="h-3 w-3" />
              </Button>
            }
          />
          <div className="mt-4 max-h-[300px] space-y-2 overflow-y-auto pr-1">
            {inventory
              .filter((i) => i.status !== "ok")
              .map((i) => {
                const meta = INV_STATUS_META[i.status];
                return (
                  <div
                    key={i.id}
                    className="card-premium flex items-center gap-3 rounded-xl border border-border/60 p-3"
                  >
                    <span
                      className="grid h-9 w-9 place-items-center rounded-lg"
                      style={{
                        background: `color-mix(in oklab, ${meta.dot === "bg-rose-500" ? "#f43f5e" : "#f59e0b"} 12%, transparent)`,
                        color: meta.dot === "bg-rose-500" ? "#f43f5e" : "#f59e0b",
                      }}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{i.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {i.stock} units · reorder at {i.reorder}
                      </div>
                    </div>
                    <Badge variant="outline" className={meta.badge}>
                      {meta.label}
                    </Badge>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>

      {/* Recent orders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="glass-panel p-5"
      >
        <SectionHeader
          title="Recent orders"
          subtitle="Last 5 prescriptions routed to this pharmacy"
          action={
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs text-medical"
              onClick={() => setTab("orders")}
              aria-label="Open all orders"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Button>
          }
        />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {orders.slice(0, 5).map((o) => {
            const meta = STATUS_META[o.status];
            return (
              <button
                key={o.id}
                onClick={() => setTab("orders")}
                className="card-premium group rounded-xl border border-border/60 p-4 text-left"
                aria-label={`Order ${o.id} for ${o.patient}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-muted-foreground">{o.rxId}</span>
                  <Badge variant="outline" className={meta.badge}>
                    <span className={cn("status-dot mr-1", meta.dot)} />
                    {meta.label}
                  </Badge>
                </div>
                <div className="mt-2 font-medium">{o.medicine}</div>
                <div className="mt-1 text-xs text-muted-foreground">{o.patient}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="font-display font-semibold">R {o.price.toFixed(2)}</span>
                  {o.delivery ? (
                    <span className="flex items-center gap-1 text-xs text-medical">
                      <Truck className="h-3 w-3" /> Delivery
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="h-3 w-3" /> Pickup
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
   2. ORDERS TAB (Kanban + List + Detail Drawer)
   ========================================================================= */

function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>(ORDERS_INITIAL);
  const [view, setView] = useState<"board" | "list">("board");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const advance = (id: string, to: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === id
          ? {
              ...o,
              status: to,
              updatedAt: new Date().toLocaleTimeString("en-ZA", {
                hour: "2-digit",
                minute: "2-digit",
              }),
              timeline: [
                ...o.timeline.map((t) => ({ ...t, done: true })),
                {
                  label:
                    to === "preparing"
                      ? "Accepted by pharmacist"
                      : to === "ready"
                      ? "Ready for pickup / dispatch"
                      : "Completed",
                  time: new Date().toLocaleTimeString("en-ZA", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  done: true,
                },
              ],
            }
          : o
      )
    );
    const labels: Record<OrderStatus, string> = {
      new: "Order received",
      preparing: "Accepted & in preparation",
      ready: "Marked ready",
      completed: "Completed",
    };
    toast.success(`Order ${id} → ${labels[to]}`, {
      description: to === "preparing" ? "Patient notified by SMS." : undefined,
    });
  };

  const columns: { id: OrderStatus; label: string; accent: string }[] = [
    { id: "new", label: "New", accent: "var(--chart-1)" },
    { id: "preparing", label: "Preparing", accent: "var(--chart-4)" },
    { id: "ready", label: "Ready", accent: "var(--chart-2)" },
    { id: "completed", label: "Completed", accent: "var(--chart-5)" },
  ];

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Orders"
        subtitle="Kanban view of prescriptions routed to this pharmacy. Drag-style flow with quick accept / ready / complete actions."
        action={
          <div className="flex items-center gap-2">
            <div className="glass-card flex items-center gap-1 rounded-lg p-1">
              <button
                onClick={() => setView("board")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  view === "board" ? "bg-medical text-medical-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="Board view"
                aria-pressed={view === "board"}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-md transition-colors",
                  view === "list" ? "bg-medical text-medical-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                aria-label="List view"
                aria-pressed={view === "list"}
              >
                <ListIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        }
      />

      <AnimatePresence mode="wait">
        {view === "board" ? (
          <motion.div
            key="board"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            {columns.map((col) => {
              const items = orders.filter((o) => o.status === col.id);
              const meta = STATUS_META[col.id];
              return (
                <div key={col.id} className="glass-panel flex flex-col p-3">
                  <div className="mb-3 flex items-center justify-between px-1.5">
                    <div className="flex items-center gap-2">
                      <span className={cn("status-dot", meta.dot)} />
                      <span className="text-sm font-semibold">{col.label}</span>
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-foreground/5 px-1.5 text-[0.65rem] font-semibold text-muted-foreground">
                        {items.length}
                      </span>
                    </div>
                    <button
                      className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-foreground/5"
                      aria-label={`Filter ${col.label} column`}
                    >
                      <Filter className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2.5">
                    <AnimatePresence mode="popLayout">
                      {items.map((o) => (
                        <OrderCard
                          key={o.id}
                          order={o}
                          onClick={() => setSelectedId(o.id)}
                          onAdvance={advance}
                        />
                      ))}
                    </AnimatePresence>
                    {items.length === 0 && (
                      <div className="rounded-xl border border-dashed border-border/60 px-3 py-8 text-center text-xs text-muted-foreground">
                        No {col.label.toLowerCase()} orders
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-foreground/[0.02] text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Order</th>
                    <th className="px-4 py-3 text-left font-medium">Patient</th>
                    <th className="px-4 py-3 text-left font-medium">Medicine</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Address</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Price</th>
                    <th className="px-4 py-3 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => {
                    const meta = STATUS_META[o.status];
                    const next =
                      o.status === "new"
                        ? "Accept"
                        : o.status === "preparing"
                        ? "Mark ready"
                        : o.status === "ready"
                        ? "Complete"
                        : null;
                    const nextTo: OrderStatus | null =
                      o.status === "new"
                        ? "preparing"
                        : o.status === "preparing"
                        ? "ready"
                        : o.status === "ready"
                        ? "completed"
                        : null;
                    return (
                      <tr
                        key={o.id}
                        className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-medical/[0.04]"
                        onClick={() => setSelectedId(o.id)}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-xs text-muted-foreground">{o.rxId}</div>
                          <div className="text-xs text-muted-foreground">{o.createdAt}</div>
                        </td>
                        <td className="px-4 py-3 font-medium">{o.patient}</td>
                        <td className="px-4 py-3">{o.medicine}</td>
                        <td className="px-4 py-3">
                          {o.delivery ? (
                            <span className="inline-flex items-center gap-1 text-xs text-medical">
                              <Truck className="h-3 w-3" /> Delivery
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <Building2 className="h-3 w-3" /> Pickup
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{o.address}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={meta.badge}>
                            <span className={cn("status-dot mr-1", meta.dot)} />
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right font-display font-semibold">
                          R {o.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {next && nextTo ? (
                            <Button
                              size="sm"
                              className="btn-primary gap-1 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                advance(o.id, nextTo);
                              }}
                              aria-label={`${next} order ${o.id}`}
                            >
                              {next}
                              <ArrowUpRight className="h-3 w-3" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <OrderDetailDrawer
        order={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelectedId(null)}
        onAdvance={advance}
      />
    </div>
  );
}

function OrderCard({
  order,
  onClick,
  onAdvance,
}: {
  order: Order;
  onClick: () => void;
  onAdvance: (id: string, to: OrderStatus) => void;
}) {
  const nextLabel =
    order.status === "new"
      ? "Accept"
      : order.status === "preparing"
      ? "Mark ready"
      : order.status === "ready"
      ? "Complete"
      : null;
  const nextTo: OrderStatus | null =
    order.status === "new"
      ? "preparing"
      : order.status === "preparing"
      ? "ready"
      : order.status === "ready"
      ? "completed"
      : null;

  return (
    <motion.div
      layout
      layoutId={`order-${order.id}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", damping: 26, stiffness: 320 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="card-premium cursor-pointer rounded-xl border border-border/60 p-3.5"
      role="button"
      tabIndex={0}
      aria-label={`Order ${order.id} for ${order.patient}, ${order.medicine}, ${STATUS_META[order.status].label}`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[0.65rem] text-muted-foreground">{order.rxId}</span>
        {order.delivery ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-medical/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-medical">
            <Truck className="h-2.5 w-2.5" /> Delivery
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-foreground/5 px-1.5 py-0.5 text-[0.6rem] font-medium text-muted-foreground">
            <Building2 className="h-2.5 w-2.5" /> Pickup
          </span>
        )}
      </div>
      <div className="mt-1.5 text-sm font-semibold leading-tight">{order.medicine}</div>
      <div className="mt-1 text-xs text-muted-foreground">{order.patient}</div>
      {order.delivery && (
        <div className="mt-1.5 flex items-start gap-1 text-[0.65rem] text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
          <span className="line-clamp-1">{order.address}</span>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2.5">
        <span className="font-display text-sm font-semibold">R {order.price.toFixed(2)}</span>
        {nextLabel && nextTo ? (
          <Button
            size="sm"
            className="btn-primary gap-1 px-2.5 py-1 text-[0.7rem]"
            onClick={(e) => {
              e.stopPropagation();
              onAdvance(order.id, nextTo);
            }}
            aria-label={`${nextLabel} order ${order.id}`}
          >
            {nextLabel}
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        ) : (
          <span className="inline-flex items-center gap-1 text-[0.65rem] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Done
          </span>
        )}
      </div>
    </motion.div>
  );
}

function OrderDetailDrawer({
  order,
  open,
  onOpenChange,
  onAdvance,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdvance: (id: string, to: OrderStatus) => void;
}) {
  const nextLabel =
    order?.status === "new"
      ? "Accept"
      : order?.status === "preparing"
      ? "Mark ready"
      : order?.status === "ready"
      ? "Complete"
      : null;
  const nextTo: OrderStatus | null =
    order?.status === "new"
      ? "preparing"
      : order?.status === "preparing"
      ? "ready"
      : order?.status === "ready"
      ? "completed"
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="glass-strong w-full overflow-y-auto p-0 sm:max-w-lg">
        {order && (
          <>
            <SheetHeader className="border-b border-border/60 p-5">
              <div className="flex items-center justify-between">
                <SheetTitle className="font-display text-lg">Order {order.rxId}</SheetTitle>
                <Badge variant="outline" className={STATUS_META[order.status].badge}>
                  <span className={cn("status-dot mr-1", STATUS_META[order.status].dot)} />
                  {STATUS_META[order.status].label}
                </Badge>
              </div>
              <SheetDescription className="sr-only">
                Prescription details and fulfilment timeline for order {order.rxId}.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-5 p-5">
              {/* Patient + medicine summary */}
              <div className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-gradient-to-br from-medical to-cyan-500 text-white">
                      {order.patient
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{order.patient}</div>
                    <div className="text-xs text-muted-foreground">{order.address}</div>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="text-muted-foreground">Medicine</div>
                    <div className="mt-0.5 font-medium text-foreground">{order.medicine}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Quantity</div>
                    <div className="mt-0.5 font-medium text-foreground">{order.qty} units</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Schedule</div>
                    <div className="mt-0.5 font-medium text-foreground">S{order.schedule}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="mt-0.5 font-display font-semibold text-foreground">
                      R {order.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescription link */}
              <div className="rounded-xl border border-border/60 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-medical/10 text-medical">
                      <FileText className="h-4 w-4" />
                    </span>
                    <div>
                      <div className="text-sm font-medium">Prescription {order.rxId}</div>
                      <div className="text-xs text-muted-foreground">
                        Signed by {order.prescribedBy} · {order.prescribedDate}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs text-medical"
                    aria-label="View prescription PDF"
                    onClick={() => toast.info("Opening prescription PDF…")}
                  >
                    View <ArrowUpRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem]">
                  <span className="chip">POPIA compliant</span>
                  <span className="chip">FHIR R4</span>
                  <span className="chip">E-prescription</span>
                </div>
              </div>

              {/* Fulfilment timeline */}
              <div>
                <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <History className="h-4 w-4 text-medical" />
                  Fulfilment timeline
                </h4>
                <ol className="relative space-y-4 border-l border-border/60 pl-5">
                  {order.timeline.map((t, i) => (
                    <li key={i} className="relative">
                      <span
                        className={cn(
                          "absolute -left-[1.4rem] top-0.5 grid h-4 w-4 place-items-center rounded-full border-2",
                          t.done
                            ? "border-medical bg-medical text-medical-foreground"
                            : "border-border bg-background"
                        )}
                      >
                        {t.done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                      </span>
                      <div className={cn("text-sm", t.done ? "font-medium" : "text-muted-foreground")}>
                        {t.label}
                      </div>
                      <div className="text-xs text-muted-foreground">{t.time}</div>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Action */}
              {nextLabel && nextTo && (
                <Button
                  className="btn-primary w-full gap-2"
                  onClick={() => {
                    onAdvance(order.id, nextTo);
                    onOpenChange(false);
                  }}
                  aria-label={`${nextLabel} order ${order.id}`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {nextLabel} order
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

/* =========================================================================
   3. INVENTORY TAB
   ========================================================================= */

function InventoryTab() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INVENTORY_INITIAL);
  const [filter, setFilter] = useState<"all" | InventoryItem["status"]>("all");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = inventory.filter((i) => filter === "all" || i.status === filter);

  const restock = (i: InventoryItem) => {
    setInventory((prev) =>
      prev.map((it) =>
        it.id === i.id
          ? {
              ...it,
              stock: it.stock + 100,
              status: (it.stock + 100 >= it.reorder * 2 ? "ok" : it.stock + 100 >= it.reorder ? "low" : "critical") as InventoryItem["status"],
              lastRestocked: new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }),
            }
          : it
      )
    );
    toast.success(`Restock order placed for ${i.name}`, {
      description: "+100 units · ETA tomorrow 10:00 · PO #PO-3391",
    });
  };

  const counts = {
    all: inventory.length,
    ok: inventory.filter((i) => i.status === "ok").length,
    low: inventory.filter((i) => i.status === "low").length,
    critical: inventory.filter((i) => i.status === "critical").length,
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Inventory"
        subtitle="Live stock levels with reorder thresholds and restock actions."
        action={
          <Button className="btn-primary gap-2" onClick={() => setAddOpen(true)} aria-label="Add inventory item">
            <Plus className="h-4 w-4" />
            Add inventory
          </Button>
        }
      />

      {/* Filter chips */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: "all", label: `All (${counts.all})` },
            { id: "ok", label: `In stock (${counts.ok})` },
            { id: "low", label: `Low (${counts.low})` },
            { id: "critical", label: `Critical (${counts.critical})` },
          ] as { id: typeof filter; label: string }[]
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.id
                ? "border-medical bg-medical/10 text-medical"
                : "border-border/60 bg-background/50 text-muted-foreground hover:text-foreground"
            )}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="input-premium flex h-9 w-56 items-center gap-2 px-3 text-sm">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
            <input
              placeholder="Search medicines…"
              className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
              aria-label="Search inventory"
            />
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-foreground/[0.02] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Medicine</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Reorder at</th>
                <th className="px-4 py-3 text-left font-medium">Stock level</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const meta = INV_STATUS_META[i.status];
                const pct = meta.pct(i);
                const isLow = i.status !== "ok";
                return (
                  <tr
                    key={i.id}
                    className="border-b border-border/40 transition-colors last:border-0 hover:bg-medical/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/10 text-medical">
                          {i.name.includes("Inhaler") ? (
                            <ScanLine className="h-4 w-4" />
                          ) : (
                            <Pill className="h-4 w-4" />
                          )}
                        </span>
                        <div>
                          <div className="font-medium">{i.name}</div>
                          <div className="text-xs text-muted-foreground">Last restocked {i.lastRestocked}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{i.category}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={cn(
                          "font-display font-semibold",
                          isLow && i.status === "critical" && "text-rose-600 dark:text-rose-400",
                          isLow && i.status === "low" && "text-amber-600 dark:text-amber-400",
                          !isLow && "text-foreground"
                        )}
                      >
                        {i.stock}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">units</span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{i.reorder}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative h-2 w-32 overflow-hidden rounded-full bg-foreground/10">
                          <div
                            className={cn("absolute inset-y-0 left-0 rounded-full", meta.bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={meta.badge}>
                        <span className={cn("status-dot mr-1", meta.dot)} />
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isLow ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1 text-xs"
                          onClick={() => restock(i)}
                          aria-label={`Restock ${i.name}`}
                        >
                          <Package className="h-3 w-3" />
                          Restock
                        </Button>
                      ) : (
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground"
                          aria-label={`Edit ${i.name}`}
                          onClick={() => toast.info(`Editing ${i.name}`)}
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">No items match this filter.</div>
        )}
      </div>

      <AddInventoryDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(name, stock, reorder) => {
          const status: InventoryItem["status"] =
            stock >= reorder * 2 ? "ok" : stock >= reorder ? "low" : "critical";
          setInventory((prev) => [
            ...prev,
            {
              id: `i${prev.length + 1}-${Date.now()}`,
              name,
              stock,
              reorder,
              status,
              category: "OTC",
              lastRestocked: new Date().toLocaleDateString("en-ZA", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            },
          ]);
          toast.success(`${name} added to inventory`, {
            description: `${stock} units · reorder at ${reorder}`,
          });
        }}
      />
    </div>
  );
}

function AddInventoryDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (name: string, stock: number, reorder: number) => void;
}) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState("");
  const [reorder, setReorder] = useState("");

  const reset = () => {
    setName("");
    setStock("");
    setReorder("");
  };

  const submit = () => {
    if (!name || !stock || !reorder) {
      toast.error("All fields are required");
      return;
    }
    onAdd(name, Number(stock), Number(reorder));
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="glass-strong p-0">
        <DialogHeader className="border-b border-border/60 p-5">
          <DialogTitle className="font-display">Add inventory item</DialogTitle>
          <DialogDescription>Create a new stock-tracked medicine line.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <div className="space-y-2">
            <Label htmlFor="inv-name">Medicine name</Label>
            <Input
              id="inv-name"
              className="input-premium"
              placeholder="e.g. Betnovate Cream 30g"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="inv-stock">Initial stock</Label>
              <Input
                id="inv-stock"
                className="input-premium"
                type="number"
                placeholder="100"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-reorder">Reorder level</Label>
              <Input
                id="inv-reorder"
                className="input-premium"
                type="number"
                placeholder="30"
                value={reorder}
                onChange={(e) => setReorder(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-border/60 p-5">
          <Button variant="ghost" onClick={() => onOpenChange(false)} aria-label="Cancel">
            Cancel
          </Button>
          <Button className="btn-primary gap-2" onClick={submit} aria-label="Add item">
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   4. MEDICINE & PRICING TAB
   ========================================================================= */

function PricingTab() {
  const [meds, setMeds] = useState<PricedMedicine[]>(PRICED_MEDICINES_INITIAL);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);

  const updatePrice = (m: PricedMedicine) => {
    const raw = drafts[m.id];
    const val = Number(raw);
    if (!raw || isNaN(val) || val <= 0) {
      toast.error("Enter a valid price");
      return;
    }
    setMeds((prev) => prev.map((x) => (x.id === m.id ? { ...x, price: val } : x)));
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[m.id];
      return next;
    });
    toast.success(`${m.name} price updated to R ${val.toFixed(2)}`, {
      description: "Now visible to patients searching the medicine directory.",
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Medicine & pricing"
        subtitle="Set the prices patients see in the explore / medicine search. Competitor prices are shown as reference."
        action={
          <Button className="btn-primary gap-2" onClick={() => setAddOpen(true)} aria-label="Add medicine to catalogue">
            <Plus className="h-4 w-4" />
            Add medicine to catalogue
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Catalogue items</div>
          <div className="mt-1 font-display text-2xl font-semibold">{meds.length}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Avg price position</div>
          <div className="mt-1 flex items-center gap-1.5 font-display text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingDown className="h-4 w-4" />
            2nd cheapest
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-muted-foreground">Price updates today</div>
          <div className="mt-1 font-display text-2xl font-semibold">3</div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-foreground/[0.02] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Medicine</th>
                <th className="px-4 py-3 text-left font-medium">Strength</th>
                <th className="px-4 py-3 text-left font-medium">Schedule</th>
                <th className="px-4 py-3 text-left font-medium">Competitor prices</th>
                <th className="px-4 py-3 text-right font-medium">Your price (R)</th>
                <th className="px-4 py-3 text-left font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((m) => {
                const minComp = Math.min(...m.competitors.map((c) => c.price));
                const belowCompetitors = m.price < minComp;
                return (
                  <tr
                    key={m.id}
                    className="border-b border-border/40 transition-colors last:border-0 hover:bg-medical/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {m.form === "Inhaler" ? <ScanLine className="h-4 w-4" /> : <Tablets className="h-4 w-4" />}
                        </span>
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-muted-foreground">{m.generic} · {m.pack}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{m.strength}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          m.schedule >= 4
                            ? "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            : m.schedule >= 2
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        )}
                      >
                        S{m.schedule}
                        {m.requiresPrescription && " · Rx"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {m.competitors.map((c) => (
                          <span
                            key={c.pharmacy}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.65rem]",
                              c.price === minComp
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-border/60 bg-foreground/[0.03] text-muted-foreground"
                            )}
                          >
                            {c.pharmacy} R{c.price.toFixed(2)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {belowCompetitors && (
                          <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[0.6rem] font-medium text-emerald-600 dark:text-emerald-400">
                            <TrendingDown className="h-2.5 w-2.5" /> Lowest
                          </span>
                        )}
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={m.price.toFixed(2)}
                          value={drafts[m.id] ?? m.price.toFixed(2)}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          className="input-premium h-8 w-24 text-right font-mono text-sm"
                          aria-label={`Price for ${m.name}`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {m.inStock ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <span className="status-dot bg-emerald-500" /> In stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
                          <span className="status-dot bg-rose-500" /> Out
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        size="sm"
                        className="btn-primary gap-1 text-xs"
                        onClick={() => updatePrice(m)}
                        aria-label={`Update price for ${m.name}`}
                      >
                        <Banknote className="h-3 w-3" />
                        Update price
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass-card flex items-start gap-3 rounded-xl p-4 text-sm">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-medical" />
        <div className="text-muted-foreground">
          <span className="font-medium text-foreground">Smart pricing tip:</span> Your{" "}
          <span className="font-medium text-foreground">Panado</span> is currently R0.49 above Dis-Chem.
          Lowering by R1.00 would make you the cheapest in a 5km radius and projected to add ~22 orders/week.
        </div>
      </div>

      <AddMedicineDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(name, generic, strength, price) => {
          setMeds((prev) => [
            ...prev,
            {
              id: `m${prev.length + 1}-${Date.now()}`,
              name,
              generic,
              form: "Tablet",
              strength,
              pack: "30 tablets",
              schedule: 0,
              category: "OTC",
              requiresPrescription: false,
              price,
              inStock: true,
              competitors: [],
            },
          ]);
          toast.success(`${name} added to catalogue`, {
            description: `Published at R ${price.toFixed(2)} for patients to see.`,
          });
        }}
      />
    </div>
  );
}

function AddMedicineDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (name: string, generic: string, strength: string, price: number) => void;
}) {
  const [name, setName] = useState("");
  const [generic, setGeneric] = useState("");
  const [strength, setStrength] = useState("");
  const [price, setPrice] = useState("");

  const reset = () => {
    setName("");
    setGeneric("");
    setStrength("");
    setPrice("");
  };

  const submit = () => {
    if (!name || !generic || !strength || !price) {
      toast.error("All fields are required");
      return;
    }
    onAdd(name, generic, strength, Number(price));
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="glass-strong p-0">
        <DialogHeader className="border-b border-border/60 p-5">
          <DialogTitle className="font-display">Add medicine to catalogue</DialogTitle>
          <DialogDescription>
            Publish a new medicine that patients can find in the explore directory.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="med-name">Brand name</Label>
              <Input
                id="med-name"
                className="input-premium"
                placeholder="e.g. Betnovate"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-generic">Generic</Label>
              <Input
                id="med-generic"
                className="input-premium"
                placeholder="e.g. Betamethasone"
                value={generic}
                onChange={(e) => setGeneric(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-strength">Strength</Label>
              <Input
                id="med-strength"
                className="input-premium"
                placeholder="e.g. 0.1%"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-price">Your price (R)</Label>
              <Input
                id="med-price"
                className="input-premium"
                type="number"
                step="0.01"
                placeholder="e.g. 84.99"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter className="border-t border-border/60 p-5">
          <Button variant="ghost" onClick={() => onOpenChange(false)} aria-label="Cancel">
            Cancel
          </Button>
          <Button className="btn-primary gap-2" onClick={submit} aria-label="Publish medicine">
            <Plus className="h-4 w-4" />
            Publish medicine
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   5. DELIVERY TAB
   ========================================================================= */

function DeliveryTab() {
  const [orders, setOrders] = useState<Order[]>(ORDERS_INITIAL);
  const deliveryOrders = orders.filter((o) => o.delivery);

  const assignDriver = (orderId: string, driver: Driver) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, driver: driver.name } : o))
    );
    toast.success(`${driver.name} assigned to ${orderId}`, {
      description: `${driver.vehicle === "bike" ? "Motorbike" : "Car"} · ★ ${driver.rating}`,
    });
  };

  const dispatch = (orderId: string) => {
    const o = orders.find((x) => x.id === orderId);
    if (!o?.driver) {
      toast.error("Assign a driver first");
      return;
    }
    toast.success(`Order ${orderId} dispatched`, {
      description: `${o.driver} en route to ${o.address}`,
    });
  };

  const markDelivered = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: "completed" as OrderStatus, updatedAt: "Just now" } : o
      )
    );
    toast.success(`Order ${orderId} marked delivered`, {
      description: "Patient notified · POD captured",
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Delivery"
        subtitle="Dispatch queue, driver assignment and live route view for in-flight deliveries."
        action={
          <div className="flex items-center gap-2">
            <span className="chip">
              <Route className="h-3 w-3" />
              Optimised for shortest path
            </span>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Map area */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel relative overflow-hidden p-0 lg:col-span-2"
        >
          <div className="relative h-[360px] w-full overflow-hidden sm:h-[420px]">
            {/* gradient map */}
            <div className="absolute inset-0 bg-gradient-to-br from-medical/[0.08] via-cyan-500/[0.05] to-emerald-500/[0.08]" />
            <div
              className="absolute inset-0 opacity-[0.4]"
              style={{
                backgroundImage:
                  "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
                maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
              }}
            />
            {/* Pharmacy origin marker */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative grid place-items-center">
                <span className="absolute h-16 w-16 animate-ping rounded-full bg-medical/20" />
                <span className="absolute h-10 w-10 rounded-full bg-medical/30" />
                <span className="relative grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-white shadow-lg">
                  <Building2 className="h-4 w-4" />
                </span>
                <span className="mt-2 whitespace-nowrap rounded-md bg-background/80 px-2 py-0.5 text-[0.65rem] font-medium backdrop-blur">
                  Clicks Pharmacy
                </span>
              </div>
            </div>
            {/* Delivery pins + connection lines */}
            <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
              {DELIVERY_PINS.map((p) => (
                <line
                  key={`line-${p.id}`}
                  x1="50%"
                  y1="50%"
                  x2={`${p.left}%`}
                  y2={`${p.top}%`}
                  stroke="var(--medical)"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  opacity={0.5}
                />
              ))}
            </svg>
            {DELIVERY_PINS.map((p) => {
              const o = orders.find((x) => x.id === p.id);
              return (
                <div
                  key={p.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2"
                  style={{ top: `${p.top}%`, left: `${p.left}%` }}
                >
                  <div className="relative grid place-items-center">
                    <span className="absolute h-10 w-10 animate-ping rounded-full bg-emerald-500/20" />
                    <span className="relative grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-lg">
                      <MapPin className="h-3.5 w-3.5" />
                    </span>
                    <span className="mt-1.5 whitespace-nowrap rounded-md bg-background/80 px-1.5 py-0.5 text-[0.6rem] font-medium backdrop-blur">
                      {p.label}
                    </span>
                    {o?.driver && (
                      <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-medical text-[0.55rem] text-white">
                        <Truck className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 rounded-lg border border-border/60 bg-background/80 p-3 text-[0.65rem] backdrop-blur">
              <div className="flex items-center gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500" />
                <span className="font-medium">Pharmacy (origin)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500" />
                <span className="font-medium">Delivery destination</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-0.5 w-4 border-t border-dashed border-medical" />
                <span>Optimised route</span>
              </div>
            </div>
            <div className="absolute right-4 top-4 flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-2.5 py-1.5 text-xs backdrop-blur">
              <CircleDot className="h-3 w-3 text-emerald-500" />
              <span className="font-medium">{deliveryOrders.length}</span>
              <span className="text-muted-foreground">active</span>
            </div>
          </div>
        </motion.div>

        {/* Stats + route note */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="stat-card p-4">
              <div className="text-xs text-muted-foreground">In dispatch</div>
              <div className="mt-1 font-display text-2xl font-semibold">
                {deliveryOrders.filter((o) => o.driver && o.status !== "completed").length}
              </div>
            </div>
            <div className="stat-card p-4">
              <div className="text-xs text-muted-foreground">Avg ETA</div>
              <div className="mt-1 font-display text-2xl font-semibold">14m</div>
            </div>
            <div className="stat-card p-4">
              <div className="text-xs text-muted-foreground">Drivers online</div>
              <div className="mt-1 font-display text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                {DRIVERS.length}
              </div>
            </div>
            <div className="stat-card p-4">
              <div className="text-xs text-muted-foreground">Radius</div>
              <div className="mt-1 font-display text-2xl font-semibold">{PHARMACY_PROFILE.deliveryRadiusKm}km</div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-medical/10 text-medical">
                <Route className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-medium">Route optimisation</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Multi-stop routes are auto-sequenced via nearest-neighbour with traffic weighting.
                  Today&apos;s 3-stop run saves an estimated <span className="font-medium text-foreground">8.4km</span>{" "}
                  vs sequential dispatch.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Delivery orders list */}
      <div className="glass-panel overflow-hidden">
        <div className="border-b border-border/60 px-5 py-3.5">
          <h3 className="text-sm font-semibold">Delivery queue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/40 bg-foreground/[0.02] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Order</th>
                <th className="px-4 py-3 text-left font-medium">Patient</th>
                <th className="px-4 py-3 text-left font-medium">Address</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Driver</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryOrders.map((o) => {
                const meta = STATUS_META[o.status];
                const assignedDriver = DRIVERS.find((d) => d.name === o.driver);
                return (
                  <tr
                    key={o.id}
                    className="border-b border-border/40 transition-colors last:border-0 hover:bg-medical/[0.04]"
                  >
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-muted-foreground">{o.rxId}</div>
                      <div className="text-xs text-muted-foreground">{o.medicine}</div>
                    </td>
                    <td className="px-4 py-3 font-medium">{o.patient}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-1.5 text-xs">
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-medical" />
                        <span>{o.address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={meta.badge}>
                        <span className={cn("status-dot mr-1", meta.dot)} />
                        {meta.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {assignedDriver ? (
                        <div className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-[0.6rem] font-bold text-white">
                            {assignedDriver.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                          <div>
                            <div className="text-xs font-medium">{assignedDriver.name}</div>
                            <div className="flex items-center gap-1 text-[0.6rem] text-muted-foreground">
                              {assignedDriver.vehicle === "bike" ? (
                                <Bike className="h-2.5 w-2.5" />
                              ) : (
                                <Car className="h-2.5 w-2.5" />
                              )}
                              <Star className="h-2.5 w-2.5 text-amber-500" />
                              {assignedDriver.rating}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Select
                          onValueChange={(v) => {
                            const d = DRIVERS.find((x) => x.id === v);
                            if (d) assignDriver(o.id, d);
                          }}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs" aria-label={`Assign driver to ${o.id}`}>
                            <SelectValue placeholder="Assign driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {DRIVERS.map((d) => (
                              <SelectItem key={d.id} value={d.id} className="text-xs">
                                <span className="flex items-center gap-2">
                                  {d.vehicle === "bike" ? (
                                    <Bike className="h-3 w-3" />
                                  ) : (
                                    <Car className="h-3 w-3" />
                                  )}
                                  {d.name} · ★ {d.rating}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {o.status !== "completed" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-xs"
                              onClick={() => dispatch(o.id)}
                              aria-label={`Dispatch ${o.id}`}
                            >
                              <Truck className="h-3 w-3" />
                              Dispatch
                            </Button>
                            <Button
                              size="sm"
                              className="btn-primary gap-1 text-xs"
                              onClick={() => markDelivered(o.id)}
                              aria-label={`Mark ${o.id} delivered`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Delivered
                            </Button>
                          </>
                        )}
                        {o.status === "completed" && (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Delivered
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   6. SETTINGS TAB
   ========================================================================= */

function SettingsTab() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(PHARMACY_PROFILE.name);
  const [branch, setBranch] = useState(PHARMACY_PROFILE.branch);
  const [address, setAddress] = useState(PHARMACY_PROFILE.address);
  const [phone, setPhone] = useState(PHARMACY_PROFILE.phone);
  const [hours, setHours] = useState(PHARMACY_PROFILE.hours);
  const [radius, setRadius] = useState(String(PHARMACY_PROFILE.deliveryRadiusKm));
  const [fee, setFee] = useState(String(PHARMACY_PROFILE.deliveryFee));
  const [visible, setVisible] = useState(PHARMACY_PROFILE.publicVisible);

  const save = () => {
    if (user) updateUser({ name });
    toast.success("Pharmacy profile saved", {
      description: visible
        ? "Your pharmacy is visible to patients searching the directory."
        : "Your pharmacy is hidden from public search.",
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Settings"
        subtitle="Pharmacy profile, operating hours, delivery configuration and public visibility."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <h3 className="mb-4 text-sm font-semibold">Pharmacy profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ph-name">Pharmacy name</Label>
              <Input
                id="ph-name"
                className="input-premium"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-branch">Branch</Label>
              <Input
                id="ph-branch"
                className="input-premium"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-phone">Phone</Label>
              <Input
                id="ph-phone"
                className="input-premium"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ph-address">Address</Label>
              <Textarea
                id="ph-address"
                className="input-premium min-h-[68px] resize-none"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ph-hours">Operating hours</Label>
              <Input
                id="ph-hours"
                className="input-premium"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-radius">Delivery radius (km)</Label>
              <Input
                id="ph-radius"
                className="input-premium"
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-fee">Delivery fee (R)</Label>
              <Input
                id="ph-fee"
                className="input-premium"
                type="number"
                step="0.01"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between rounded-xl border border-border/60 p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-medical/10 text-medical">
                {visible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </span>
              <div>
                <div className="text-sm font-medium">Public visibility</div>
                <div className="text-xs text-muted-foreground">
                  {visible
                    ? "Patients can find you in the explore directory."
                    : "Hidden from public search."}
                </div>
              </div>
            </div>
            <Switch checked={visible} onCheckedChange={setVisible} aria-label="Toggle public visibility" />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="ghost" aria-label="Discard changes">
              Discard
            </Button>
            <Button className="btn-primary gap-2" onClick={save} aria-label="Save pharmacy profile">
              <Save className="h-4 w-4" />
              Save changes
            </Button>
          </div>
        </motion.div>

        {/* Side cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">SAPC verified</div>
                <div className="text-xs text-muted-foreground">Pharm licence #40082179</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Your pharmacy is verified by the South African Pharmacy Council. Verification status is shown
              to patients as a trust signal.
            </p>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-medical/10 text-medical">
                <Globe className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">Public profile</div>
                <div className="text-xs text-muted-foreground">medlink.sa/clicks-rosebank</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2 text-xs"
              onClick={() => toast.info("Opening public profile preview…")}
              aria-label="Preview public profile"
            >
              <Eye className="h-3 w-3" />
              Preview public profile
            </Button>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">Responsible pharmacist</div>
                <div className="text-xs text-muted-foreground">On duty: M. Khumalo</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="text-sm font-semibold">Danger zone</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Closing the pharmacy temporarily hides you from search and pauses new orders.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 text-xs"
              onClick={() =>
                toast.error("Confirm temporary closure", {
                  description: "This will pause new orders immediately.",
                })
              }
              aria-label="Close pharmacy temporarily"
            >
              <X className="h-3 w-3" />
              Close pharmacy temporarily
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
