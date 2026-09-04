"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Tag,
  Plus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SectionHeader, AddMedicineDialog } from "./shared";
import { PRICED_MEDICINES_INITIAL } from "./mock-data";
import type { PricedMedicine } from "./types";

export default function PricingTab() {
  const [medicines, setMedicines] = useState<PricedMedicine[]>(PRICED_MEDICINES_INITIAL);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [compareMed, setCompareMed] = useState<PricedMedicine | null>(null);

  const categories = useMemo(() => {
    const cats = new Set(medicines.map((m) => m.category));
    return ["all", ...Array.from(cats)];
  }, [medicines]);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const matchesSearch =
        !searchQuery ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.generic.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === "all" || m.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [medicines, searchQuery, filterCategory]);

  function addMedicine(med: Omit<PricedMedicine, "id">) {
    setMedicines((prev) => [{ ...med, id: `med-${Date.now()}` }, ...prev]);
  }

  function getCheapestCompetitor(m: PricedMedicine) {
    if (m.competitors.length === 0) return null;
    return m.competitors.reduce((min, c) => (c.price < min.price ? c : min), m.competitors[0]);
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Medicine & Pricing"
        subtitle="Manage your medicine catalogue, set prices, and compare with competitors."
        action={
          <Button className="gap-2" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Add medicine
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search medicines"
          />
        </div>
        <div className="flex gap-1.5">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={filterCategory === cat ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFilterCategory(cat)}
            >
              {cat === "all" ? "All" : cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Medicine grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <div className="col-span-full rounded-xl border border-dashed border-border/50 p-12 text-center text-muted-foreground">
            <Tag className="mx-auto mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">No medicines found.</p>
          </div>
        ) : (
          filtered.map((med) => {
            const cheapest = getCheapestCompetitor(med);
            const priceDiff = cheapest ? ((med.price - cheapest.price) / cheapest.price) * 100 : 0;
            return (
              <div
                key={med.id}
                className="glass-card rounded-xl p-5 transition-shadow hover:shadow-lg cursor-pointer"
                onClick={() => setCompareMed(med)}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">{med.name}</h4>
                    <p className="text-xs text-muted-foreground">{med.generic}</p>
                  </div>
                  {med.requiresPrescription && (
                    <Badge variant="outline" className="text-[10px] bg-medical/10 text-medical border-medical/20">
                      Rx
                    </Badge>
                  )}
                </div>
                <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Form</span>
                    <p className="font-medium">{med.form}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Strength</span>
                    <p className="font-medium">{med.strength}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Schedule</span>
                    <p className="font-medium">S{med.schedule}</p>
                  </div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-muted-foreground">Our price</span>
                    <p className="text-xl font-bold">R {med.price.toFixed(2)}</p>
                  </div>
                  {cheapest && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-muted-foreground">Cheapest competitor</span>
                      <p className="text-sm font-medium text-muted-foreground">
                        R {cheapest.price.toFixed(2)} <span className="text-[10px]">({cheapest.pharmacy})</span>
                      </p>
                      <div className={cn("flex items-center gap-0.5 text-[10px] font-medium", priceDiff <= 0 ? "text-emerald-600" : "text-rose-600")}>
                        {priceDiff <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                        {Math.abs(priceDiff).toFixed(1)}%
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddMedicineDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} onAdd={addMedicine} />

      {/* Compare dialog */}
      <Dialog open={!!compareMed} onOpenChange={() => setCompareMed(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{compareMed?.name}</DialogTitle>
            <DialogDescription>
              {compareMed?.generic} — {compareMed?.strength} {compareMed?.form}
            </DialogDescription>
          </DialogHeader>
          {compareMed && (
            <div className="space-y-3">
              <div className="rounded-lg bg-medical/5 p-3">
                <p className="text-[10px] uppercase text-medical">Our price</p>
                <p className="text-2xl font-bold">R {compareMed.price.toFixed(2)}</p>
              </div>
              {compareMed.competitors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Competitor prices</p>
                  {compareMed.competitors.map((c) => {
                    const diff = ((compareMed.price - c.price) / c.price) * 100;
                    return (
                      <div key={c.pharmacy} className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2">
                        <span className="text-sm">{c.pharmacy}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">R {c.price.toFixed(2)}</span>
                          <span className={cn("text-[10px] font-medium", diff <= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {diff <= 0 ? "↓" : "↑"} {Math.abs(diff).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
