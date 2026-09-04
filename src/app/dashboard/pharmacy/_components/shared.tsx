"use client";

import type React from "react";
import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Star,
  ChevronDown,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
// Tooltip — using native title attribute as fallback since @/components/ui/tooltip is not installed
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { Order, OrderStatus, StatusMeta, InventoryItem, InvStatusMeta, Driver } from "./types";
import { STATUS_META, DRIVERS } from "./mock-data";

/* -------------------------------------------------------------------------
   Stat Card
   ------------------------------------------------------------------------- */

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  trendUp,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  trendUp?: boolean;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card group relative overflow-hidden rounded-2xl p-5 transition-shadow hover:shadow-lg"
    >
      <div className={cn("absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-10 blur-2xl transition-opacity group-hover:opacity-20", color)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-3xl font-bold">{value}</p>
          {trend && (
            <p className={cn("mt-1 text-xs font-medium", trendUp ? "text-emerald-600" : "text-rose-600")}>
              {trendUp ? "↑" : "↓"} {trend}
            </p>
          )}
        </div>
        <span className={cn("grid h-10 w-10 place-items-center rounded-xl", color.replace("from-", "bg-").replace("to-", "").split(" ")[0])}>
          <Icon className="h-5 w-5 text-white" />
        </span>
      </div>
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   Section Header
   ------------------------------------------------------------------------- */

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Toggle Row
   ------------------------------------------------------------------------- */

export function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/60 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-medical/10 text-medical">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <div className="text-sm font-medium">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} aria-label={`Toggle ${label}`} />
    </div>
  );
}

/* -------------------------------------------------------------------------
   Order Card (Kanban)
   ------------------------------------------------------------------------- */

export function OrderCard({
  order,
  onSelect,
}: {
  order: Order;
  onSelect: (o: Order) => void;
}) {
  const meta = STATUS_META[order.status];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,.08)" }}
      className="glass-card cursor-pointer rounded-xl p-4 transition-colors hover:bg-muted/40"
      onClick={() => onSelect(order)}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono text-xs text-muted-foreground">{order.id}</span>
        <Badge variant="outline" className={cn("text-[10px]", meta.badge)}>
          {meta.label}
        </Badge>
      </div>
      <p className="text-sm font-semibold">{order.patient}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{order.medicine}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>R {order.price.toFixed(2)}</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {order.createdAt}
        </div>
      </div>
      {order.delivery && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-medical">
          <Truck className="h-3 w-3" /> Delivery
        </div>
      )}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   Order Detail Drawer
   ------------------------------------------------------------------------- */

export function OrderDetailDrawer({
  order,
  onClose,
  onStatusChange,
  assignDriver,
}: {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  assignDriver: (orderId: string, driver: Driver) => void;
}) {
  const assignedDriver = order?.driver ? DRIVERS.find((d) => d.id === order.driver) : null;
  return (
    <AnimatePresence>
      {order && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex justify-end"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative h-full w-full max-w-md glass-panel border-l border-border/60 bg-background/95 p-6 backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4 h-8 w-8 text-muted-foreground hover:bg-muted"
              aria-label="Close order detail"
            >
              <X className="h-5 w-5" />
            </Button>

            <div className="mb-6">
              <p className="font-mono text-xs text-muted-foreground">{order.id}</p>
              <h3 className="text-xl font-bold">{order.patient}</h3>
              <p className="text-sm text-muted-foreground">{order.medicine}</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Price</p>
                <p className="text-lg font-bold">R {order.price.toFixed(2)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Qty</p>
                <p className="text-lg font-bold">{order.qty}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Rx</p>
                <p className="text-sm font-mono">{order.rxId}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Schedule</p>
                <p className="text-sm font-semibold">S{order.schedule}</p>
              </div>
            </div>

            {order.delivery && (
              <div className="mb-6 rounded-lg bg-medical/5 p-3">
                <p className="text-[10px] uppercase text-medical">Delivery Address</p>
                <p className="mt-1 flex items-start gap-1.5 text-sm">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-medical" />
                  {order.address}
                </p>
                {assignedDriver && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {assignedDriver.vehicle === "bike" ? (
                      <Truck className="h-3 w-3" />
                    ) : (
                      <Truck className="h-3 w-3" />
                    )}
                    {assignedDriver.name} · ★ {assignedDriver.rating}
                  </p>
                )}
              </div>
            )}

            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Timeline</p>
              <div className="space-y-2">
                {order.timeline.map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn("h-2.5 w-2.5 rounded-full", step.done ? "bg-emerald-500" : "bg-muted-foreground/30")} />
                    <div className="flex-1">
                      <p className={cn("text-xs", step.done ? "font-medium" : "text-muted-foreground")}>{step.label}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{step.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.status !== "completed" && (
              <div className="flex gap-2">
                {order.status === "new" && (
                  <Button size="sm" className="flex-1 gap-1" onClick={() => onStatusChange(order.id, "preparing")}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Accept
                  </Button>
                )}
                {order.status === "preparing" && (
                  <Button size="sm" className="flex-1 gap-1" onClick={() => onStatusChange(order.id, "ready")}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Ready
                  </Button>
                )}
                {order.status === "ready" && (
                  <Button size="sm" className="flex-1 gap-1" onClick={() => onStatusChange(order.id, "completed")}>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Complete
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* -------------------------------------------------------------------------
   Add Inventory Dialog
   ------------------------------------------------------------------------- */

export function AddInventoryDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (item: Omit<InventoryItem, "id" | "status" | "lastRestocked">) => void;
}) {
  const [name, setName] = useState("");
  const [stock, setStock] = useState(0);
  const [reorder, setReorder] = useState(0);
  const [category, setCategory] = useState("OTC");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({ name: name.trim(), stock, reorder, category });
    setName("");
    setStock(0);
    setReorder(0);
    setCategory("OTC");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add inventory item</DialogTitle>
          <DialogDescription>Record a new medicine or supply in your inventory.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-name">Name</Label>
            <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Amoxicillin 500 mg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-stock">Stock</Label>
              <Input id="inv-stock" type="number" min={0} value={stock} onChange={(e) => setStock(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inv-reorder">Reorder point</Label>
              <Input id="inv-reorder" type="number" min={0} value={reorder} onChange={(e) => setReorder(+e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OTC">OTC</SelectItem>
                <SelectItem value="Chronic">Chronic</SelectItem>
                <SelectItem value="Respiratory">Respiratory</SelectItem>
                <SelectItem value="Antibiotic">Antibiotic</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add item</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------
   Add Medicine Dialog (Pricing tab)
   ------------------------------------------------------------------------- */

export function AddMedicineDialog({
  open,
  onOpenChange,
  onAdd,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (med: { name: string; generic: string; form: string; strength: string; pack: string; schedule: number; category: string; requiresPrescription: boolean; price: number; inStock: boolean; competitors: { pharmacy: string; price: number }[] }) => void;
}) {
  const [name, setName] = useState("");
  const [generic, setGeneric] = useState("");
  const [form, setForm] = useState("Tablet");
  const [strength, setStrength] = useState("");
  const [pack, setPack] = useState("");
  const [schedule, setSchedule] = useState(0);
  const [price, setPrice] = useState(0);

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      generic: generic.trim() || name.trim(),
      form,
      strength: strength.trim() || "—",
      pack: pack.trim() || "1",
      schedule,
      category: "OTC",
      requiresPrescription: schedule >= 4,
      price,
      inStock: true,
      competitors: [],
    });
    setName("");
    setGeneric("");
    setStrength("");
    setPack("");
    setSchedule(0);
    setPrice(0);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add medicine</DialogTitle>
          <DialogDescription>Add a new medicine to your pricing catalogue.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="med-name">Name</Label>
              <Input id="med-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Augmentin" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-generic">Generic</Label>
              <Input id="med-generic" value={generic} onChange={(e) => setGeneric(e.target.value)} placeholder="e.g. Amoxicillin + Clavulanic Acid" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Form</Label>
              <Select value={form} onValueChange={setForm}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Tablet">Tablet</SelectItem>
                  <SelectItem value="Capsule">Capsule</SelectItem>
                  <SelectItem value="Syrup">Syrup</SelectItem>
                  <SelectItem value="Injection">Injection</SelectItem>
                  <SelectItem value="Inhaler">Inhaler</SelectItem>
                  <SelectItem value="Cream">Cream</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-strength">Strength</Label>
              <Input id="med-strength" value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 625 mg" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-pack">Pack</Label>
              <Input id="med-pack" value={pack} onChange={(e) => setPack(e.target.value)} placeholder="e.g. 30" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="med-schedule">Schedule</Label>
              <Input id="med-schedule" type="number" min={0} max={6} value={schedule} onChange={(e) => setSchedule(+e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="med-price">Price (R)</Label>
              <Input id="med-price" type="number" min={0} step={0.01} value={price} onChange={(e) => setPrice(+e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAdd}>Add medicine</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
