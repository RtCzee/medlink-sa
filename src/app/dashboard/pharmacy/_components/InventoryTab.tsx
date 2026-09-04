"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Package,
  Plus,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionHeader, AddInventoryDialog } from "./shared";
import { INVENTORY_INITIAL, INV_STATUS_META } from "./mock-data";
import type { InventoryItem } from "./types";

export default function InventoryTab() {
  const [inventory, setInventory] = useState<InventoryItem[]>(INVENTORY_INITIAL);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | InventoryItem["status"]>("all");
  const [sortField, setSortField] = useState<"name" | "stock" | "lastRestocked">("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return inventory
      .filter((item) => {
        const matchesSearch =
          !searchQuery ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || item.status === filterStatus;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortField === "stock") return (a.stock - b.stock) * dir;
        if (sortField === "lastRestocked") return a.lastRestocked.localeCompare(b.lastRestocked) * dir;
        return a.name.localeCompare(b.name) * dir;
      });
  }, [inventory, searchQuery, filterStatus, sortField, sortDir]);

  function toggleSort(field: "name" | "stock" | "lastRestocked") {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  }

  function addItem(item: Omit<InventoryItem, "id" | "status" | "lastRestocked">) {
    const newItem: InventoryItem = {
      ...item,
      id: `inv-${Date.now()}`,
      status: item.stock <= 0 ? "critical" : item.stock < item.reorder ? "low" : "ok",
      lastRestocked: new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }),
    };
    setInventory((prev) => [newItem, ...prev]);
  }

  const criticalCount = inventory.filter((i) => i.status === "critical").length;
  const lowCount = inventory.filter((i) => i.status === "low").length;
  const okCount = inventory.filter((i) => i.status === "ok").length;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Inventory"
        subtitle="Stock levels, reorder points, and restock tracking."
        action={
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add item
          </Button>
        }
      />

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-xs">
          {okCount} in stock
        </Badge>
        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs">
          {lowCount} low
        </Badge>
        <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/20 text-xs">
          {criticalCount} critical
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search inventory"
          />
        </div>
        {(["all", "ok", "low", "critical"] as const).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? "default" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setFilterStatus(status)}
          >
            {status === "all" ? "All" : INV_STATUS_META[status].label}
          </Button>
        ))}
      </div>

      {/* Inventory table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="h-auto gap-1 p-0 hover:text-foreground" onClick={() => toggleSort("name")}>
                    Medicine <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </th>
                <th className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="h-auto gap-1 p-0 hover:text-foreground" onClick={() => toggleSort("stock")}>
                    Stock <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">
                  <Button variant="ghost" size="sm" className="h-auto gap-1 p-0 hover:text-foreground" onClick={() => toggleSort("lastRestocked")}>
                    Last restocked <ArrowUpDown className="h-3 w-3" />
                  </Button>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                    <Package className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">No inventory items found.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const meta = INV_STATUS_META[item.status];
                  const pct = meta.pct(item);
                  return (
                    <tr key={item.id} className="border-b border-border/30 transition-colors hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{item.stock}</span>
                          <span className="text-xs text-muted-foreground">/ {item.reorder * 4}</span>
                        </div>
                        <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full transition-all", meta.bar)}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={cn("text-[10px]", meta.badge)}>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.category}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{item.lastRestocked}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() =>
                            setInventory((prev) =>
                              prev.map((i) =>
                                i.id === item.id ? { ...i, stock: i.stock + i.reorder } : i
                              )
                            )
                          }
                          aria-label={`Restock ${item.name}`}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddInventoryDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={addItem} />
    </div>
  );
}
