import {
  PHARMACY_ORDERS,
  PHARMACY_INVENTORY,
  MEDICINES,
} from "@/lib/data";
import type {
  Order,
  OrderStatus,
  InventoryItem,
  PricedMedicine,
  Driver,
  PTVOrder,
  PTVReviewStatus,
  StatusMeta,
  InvStatusMeta,
} from "./types";

export const PHARMACY_PROFILE = {
  name: "Clicks Pharmacy — Rosebank",
  branch: "Rosebank Branch · #C-208",
  address: "Cradock Avenue, Rosebank, Johannesburg, 2196",
  phone: "+27 11 447 2233",
  hours: "Mon–Fri 08:00–21:00, Sat–Sun 09:00–18:00",
  deliveryRadiusKm: 5,
  deliveryFee: 25,
  publicVisible: true,
};

export const DRIVERS: Driver[] = [
  { id: "d1", name: "Sipho Mokoena", vehicle: "bike", rating: 4.9 },
  { id: "d2", name: "Themba Khumalo", vehicle: "car", rating: 4.8 },
  { id: "d3", name: "Lebo Nkosi", vehicle: "bike", rating: 4.7 },
  { id: "d4", name: "Jabu Radebe", vehicle: "car", rating: 5.0 },
];

export const DELIVERY_PINS = [
  { id: "o1", top: 28, left: 38, label: "Rosebank" },
  { id: "o2", top: 52, left: 64, label: "Sandton" },
  { id: "o4", top: 70, left: 22, label: "Parktown" },
];

export const ORDERS_INITIAL: Order[] = PHARMACY_ORDERS.map((o, i) => {
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

export const INVENTORY_INITIAL: InventoryItem[] = PHARMACY_INVENTORY.map((i) => ({
  ...i,
  category:
    i.name.includes("Augmentin") || i.name.includes("Glucophage")
      ? "Chronic"
      : i.name.includes("Ventolin")
      ? "Respiratory"
      : "OTC",
  lastRestocked: "11 Jun 2025",
}));

export const PRICED_MEDICINES_INITIAL: PricedMedicine[] = MEDICINES.map((m) => {
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

export const ORDERS_BY_STATUS_DATA = [
  { status: "New", count: 2, color: "var(--chart-1)" },
  { status: "Preparing", count: 1, color: "var(--chart-4)" },
  { status: "Ready", count: 1, color: "var(--chart-2)" },
  { status: "Completed", count: 1, color: "var(--chart-5)" },
];

export const WEEKLY_REVENUE = [
  { d: "Mon", r: 4200 },
  { d: "Tue", r: 5100 },
  { d: "Wed", r: 4800 },
  { d: "Thu", r: 6200 },
  { d: "Fri", r: 7400 },
  { d: "Sat", r: 5900 },
  { d: "Sun", r: 3100 },
];

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
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

export const INV_STATUS_META: Record<
  InventoryItem["status"],
  InvStatusMeta
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

export const PTV_ORDERS_INITIAL: PTVOrder[] = ORDERS_INITIAL.filter(
  (o) => o.schedule >= 4 || o.prescribedBy !== "Walk-in"
).map((o) => ({
  ...o,
  ptvStatus: (o.timeline.some((t) => t.label === "Prescription verified" && t.done)
    ? "approved"
    : "pending") as PTVReviewStatus,
}));

export const PTV_STATUS_META: Record<PTVReviewStatus, { label: string; badge: string; dot: string }> = {
  pending: { label: "Pending", badge: "bg-amber-500/10 text-amber-600 border-amber-500/20", dot: "bg-amber-500" },
  approved: { label: "Approved", badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500" },
  flagged: { label: "Flagged", badge: "bg-orange-500/10 text-orange-600 border-orange-500/20", dot: "bg-orange-500" },
  rejected: { label: "Rejected", badge: "bg-rose-500/10 text-rose-600 border-rose-500/20", dot: "bg-rose-500" },
};

export { MEDICINES } from "@/lib/data";
