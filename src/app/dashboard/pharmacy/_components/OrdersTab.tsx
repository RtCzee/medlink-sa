"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Truck,
  LayoutGrid,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader, OrderCard, OrderDetailDrawer } from "./shared";
import { ORDERS_INITIAL, STATUS_META } from "./mock-data";
import type { Order, OrderStatus, Driver } from "./types";

export default function OrdersTab() {
  const [orders, setOrders] = useState<Order[]>(ORDERS_INITIAL);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !searchQuery ||
        o.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.medicine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || o.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, filterStatus]);

  const grouped = useMemo(() => {
    const g: Record<OrderStatus, Order[]> = {
      new: [],
      preparing: [],
      ready: [],
      completed: [],
    };
    filtered.forEach((o) => g[o.status].push(o));
    return g;
  }, [filtered]);

  function updateStatus(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, updatedAt: "Just now" } : o))
    );
    setSelectedOrder((prev) =>
      prev && prev.id === id ? { ...prev, status, updatedAt: "Just now" } : prev
    );
  }

  function assignDriverToOrder(orderId: string, driver: Driver) {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, driver: driver.id, updatedAt: "Just now" } : o
      )
    );
    setSelectedOrder((prev) =>
      prev && prev.id === orderId ? { ...prev, driver: driver.id, updatedAt: "Just now" } : prev
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Orders"
        subtitle="Manage incoming prescriptions, track preparation, and coordinate dispatch."
        action={
          <div className="flex items-center gap-2">
            <Button
              variant={view === "kanban" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("kanban")}
              aria-label="Kanban view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setView("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search orders"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as OrderStatus | "all")}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(["new", "preparing", "ready", "completed"] as const).map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_META[s].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Kanban view */}
      {view === "kanban" && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(["new", "preparing", "ready", "completed"] as const).map((status) => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_META[status].dot)} />
                  <span className="text-sm font-semibold">{STATUS_META[status].label}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {grouped[status].length}
                </Badge>
              </div>
              <div className="space-y-3">
                {grouped[status].map((order) => (
                  <OrderCard key={order.id} order={order} onSelect={setSelectedOrder} />
                ))}
                {grouped[status].length === 0 && (
                  <div className="rounded-xl border border-dashed border-border/50 p-6 text-center text-xs text-muted-foreground">
                    No orders
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Medicine</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <ShoppingCart className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      <p className="text-sm">No orders match your filters.</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => {
                    const meta = STATUS_META[order.status];
                    return (
                      <tr
                        key={order.id}
                        className="cursor-pointer border-b border-border/30 transition-colors hover:bg-muted/30"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                        <td className="px-4 py-3 font-medium">{order.patient}</td>
                        <td className="px-4 py-3">
                          <div>{order.medicine}</div>
                          <div className="text-xs text-muted-foreground">R {order.price.toFixed(2)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className={cn("text-[10px]", meta.badge)}>
                            {meta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{order.createdAt}</td>
                        <td className="px-4 py-3 text-right">
                          {order.status === "new" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={(e) => { e.stopPropagation(); updateStatus(order.id, "preparing"); }}
                              aria-label={`Accept order ${order.id}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Accept
                            </Button>
                          )}
                          {order.status === "preparing" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={(e) => { e.stopPropagation(); updateStatus(order.id, "ready"); }}
                              aria-label={`Mark ${order.id} ready`}
                            >
                              <Clock className="h-3 w-3" />
                              Ready
                            </Button>
                          )}
                          {order.status === "ready" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              onClick={(e) => { e.stopPropagation(); updateStatus(order.id, "completed"); }}
                              aria-label={`Complete ${order.id}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </Button>
                          )}
                          {order.status === "completed" && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <OrderDetailDrawer
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={updateStatus}
        assignDriver={assignDriverToOrder}
      />
    </div>
  );
}
