"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MEDICINES } from "@/lib/data";
import { ViewHeader } from "./shared-utils";
import { OrderDialog } from "./order-dialog";

type MedicineDisplay = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  pharmacy: string;
  image: string;
};

const CATEGORIES = ["All", "Chronic", "Acute", "Supplement", "Antibiotic", "OTC"];
const SORT = [
  { label: "Name", value: "name" },
  { label: "Price ↑", value: "price-asc" },
  { label: "Price ↓", value: "price-desc" },
] as const;

function toDisplayMedicine(m: typeof MEDICINES[number]): MedicineDisplay {
  const best = m.prices.reduce((a, b) => (a.price < b.price ? a : b));
  return {
    id: m.id,
    name: m.name,
    category: m.category,
    price: best.price,
    stock: m.prices.filter((p) => p.inStock).length,
    pharmacy: best.pharmacy,
    image: "",
  };
}

export function MedicineView({ preselectId }: { preselectId?: string }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState<string>("name");
  const [orderMed, setOrderMed] = useState<MedicineDisplay | null>(null);

  useEffect(() => {
    if (preselectId) {
      const found = MEDICINES.find((m) => m.id === preselectId);
      if (found) setOrderMed(toDisplayMedicine(found));
    }
  }, [preselectId]);

  let items = MEDICINES.filter((m) => {
    if (category !== "All" && m.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q);
    }
    return true;
  }).map(toDisplayMedicine);

  if (sort === "price-asc") items = [...items].sort((a, b) => a.price - b.price);
  else if (sort === "price-desc") items = [...items].sort((a, b) => b.price - a.price);
  else items = [...items].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <ViewHeader title="Medicine" subtitle="Browse, search and order prescription or OTC medication." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="input-premium flex h-9 flex-1 items-center gap-2 rounded-lg px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search medicine…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        {CATEGORIES.map((c) => (
          <Button
            key={c}
            variant="ghost"
            size="sm"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium",
              category === c ? "bg-medical text-white" : "bg-card/60 text-muted-foreground hover:bg-card"
            )}
          >
            {c}
          </Button>
        ))}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="input-premium h-9 rounded-lg border border-border bg-card/60 px-2 text-xs"
        >
          {SORT.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div key={m.id} className="glass-panel p-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">{m.name}</div>
                <div className="text-xs text-muted-foreground">{m.category} · {m.pharmacy}</div>
              </div>
              <span className="text-lg font-bold text-medical">R{m.price.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className={cn("text-xs font-medium", m.stock > 0 ? "text-emerald-500" : "text-rose-500")}>
                {m.stock > 0 ? `${m.stock} pharmacies in stock` : "Out of stock"}
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={() => setOrderMed(m)}
                disabled={m.stock === 0}
                className="gap-1 rounded-lg"
              >
                <ShoppingCart className="h-3.5 w-3.5" /> Order
              </Button>
            </div>
          </div>
        ))}
      </div>

      <OrderDialog medicine={orderMed} open={!!orderMed} onClose={() => setOrderMed(null)} />
    </div>
  );
}
