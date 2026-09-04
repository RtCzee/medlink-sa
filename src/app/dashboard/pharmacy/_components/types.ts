import type { PTVResult } from "@/lib/ptv";

export type OrderStatus = "new" | "preparing" | "ready" | "completed";

export type Order = {
  id: string;
  patient: string;
  medicine: string;
  price: number;
  status: OrderStatus;
  delivery: boolean;
  address: string;
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

export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  reorder: number;
  status: "ok" | "low" | "critical";
  category: string;
  lastRestocked: string;
};

export type PricedMedicine = {
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

export type Driver = { id: string; name: string; vehicle: "car" | "bike"; rating: number };

export type PTVReviewStatus = "pending" | "approved" | "flagged" | "rejected";

export type PTVOrder = Order & {
  ptvStatus: PTVReviewStatus;
  ptvResult?: PTVResult;
  currentMedications?: string[];
};

export type StatusMeta = {
  label: string;
  dot: string;
  badge: string;
  col: string;
};

export type InvStatusMeta = {
  label: string;
  badge: string;
  dot: string;
  bar: string;
  pct: (i: InventoryItem) => number;
};
