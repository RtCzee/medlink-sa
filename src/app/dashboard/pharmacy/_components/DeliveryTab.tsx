"use client";

import { useState } from "react";
import {
  Truck,
  MapPin,
  CheckCircle2,
  Clock,
  Bike,
  Car,
  Star,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { SectionHeader } from "./shared";
import { ORDERS_INITIAL, DRIVERS, DELIVERY_PINS } from "./mock-data";
import type { Order, Driver } from "./types";

export default function DeliveryTab() {
  const [orders, setOrders] = useState<Order[]>(ORDERS_INITIAL);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const deliveryOrders = orders.filter((o) => o.delivery && o.status !== "completed");
  const completedDeliveries = orders.filter((o) => o.delivery && o.status === "completed");

  function assignDriver(orderId: string, driver: Driver) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, driver: driver.id, updatedAt: "Just now" } : o))
    );
  }

  function dispatch(orderId: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "preparing" as const, updatedAt: "Just now" } : o))
    );
  }

  function markDelivered(orderId: string) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "completed" as const, updatedAt: "Just now" } : o))
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Delivery Management"
        subtitle="Track deliveries, assign drivers, and manage the delivery queue."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Driver queue */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold">Delivery queue</h3>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Patient</th>
                    <th className="px-4 py-3">Address</th>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveryOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                        <Truck className="mx-auto mb-2 h-8 w-8 opacity-40" />
                        <p className="text-sm">No pending deliveries.</p>
                      </td>
                    </tr>
                  ) : (
                    deliveryOrders.map((order) => {
                      const assignedDriver = order.driver ? DRIVERS.find((d) => d.id === order.driver) : null;
                      return (
                        <tr key={order.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{order.patient}</div>
                            <div className="text-xs text-muted-foreground">{order.medicine}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs">
                              <MapPin className="h-3 w-3 shrink-0 text-medical" />
                              {order.address}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {assignedDriver ? (
                              <div className="flex items-center gap-2">
                                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-[0.6rem] font-bold text-white">
                                  {assignedDriver.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                                </span>
                                <div>
                                  <div className="text-xs font-medium">{assignedDriver.name}</div>
                                  <div className="flex items-center gap-1 text-[0.6rem] text-muted-foreground">
                                    {assignedDriver.vehicle === "bike" ? <Bike className="h-2.5 w-2.5" /> : <Car className="h-2.5 w-2.5" />}
                                    <Star className="h-2.5 w-2.5 text-amber-500" />
                                    {assignedDriver.rating}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <Select onValueChange={(v) => { const d = DRIVERS.find((x) => x.id === v); if (d) assignDriver(order.id, d); }}>
                                <SelectTrigger className="h-8 w-40 text-xs" aria-label={`Assign driver to ${order.id}`}>
                                  <SelectValue placeholder="Assign driver" />
                                </SelectTrigger>
                                <SelectContent>
                                  {DRIVERS.map((d) => (
                                    <SelectItem key={d.id} value={d.id} className="text-xs">
                                      <span className="flex items-center gap-2">
                                        {d.vehicle === "bike" ? <Bike className="h-3 w-3" /> : <Car className="h-3 w-3" />}
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
                              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => dispatch(order.id)} aria-label={`Dispatch ${order.id}`}>
                                <Truck className="h-3 w-3" /> Dispatch
                              </Button>
                              <Button size="sm" className="gap-1 text-xs" onClick={() => markDelivered(order.id)} aria-label={`Mark ${order.id} delivered`}>
                                <CheckCircle2 className="h-3 w-3" /> Delivered
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Delivery map */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Delivery map</h3>
          <div className="glass-card rounded-xl p-4 relative overflow-hidden" style={{ minHeight: 320 }}>
            <div className="absolute inset-0 bg-gradient-to-br from-medical/5 to-cyan-500/5">
              <div className="absolute inset-0 opacity-20" style={{
                backgroundImage: "radial-gradient(circle, hsl(var(--medial) / 0.15) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }} />
            </div>

            {DELIVERY_PINS.map((pin) => (
              <div
                key={pin.id}
                className={cn(
                  "absolute z-10 flex flex-col items-center cursor-pointer transition-transform hover:scale-110",
                  selectedPin === pin.id && "scale-110"
                )}
                style={{ top: `${pin.top}%`, left: `${pin.left}%`, transform: "translate(-50%, -50%)" }}
                onClick={() => setSelectedPin(selectedPin === pin.id ? null : pin.id)}
              >
                <div className="grid h-7 w-7 place-items-center rounded-full bg-medical text-[0.55rem] font-bold text-white shadow-lg shadow-medical/30">
                  {pin.id.replace("o", "")}
                </div>
                <div className="mt-0.5 h-1.5 w-1.5 rounded-full bg-medical/40" />
                <span className="mt-0.5 text-[0.55rem] font-medium text-muted-foreground">{pin.label}</span>
              </div>
            ))}

            <div className="absolute bottom-3 left-3 rounded-lg bg-background/80 px-3 py-2 text-[0.6rem] text-muted-foreground backdrop-blur">
              <div className="font-medium">Delivery zones</div>
              <div>Rosebank · Sandton · Parktown</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
