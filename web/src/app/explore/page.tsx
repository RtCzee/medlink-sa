"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Search,
  MapPin,
  Star,
  Clock,
  Navigation,
  Building2,
  Pill,
  Stethoscope,
  Truck,
  Check,
  X,
  ArrowRight,
  TrendingDown,
  Package,
  SearchX,
} from "lucide-react";
import SiteNavbar from "@/components/layout/site-navbar";
import SiteFooter from "@/components/layout/site-footer";
import { MEDICINES, FACILITIES, type Medicine } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const EASE = [0.16, 1, 0.3, 1] as const;

type Tab = "all" | "hospital" | "clinic" | "pharmacy" | "medication";

function ExploreContent() {
  const params = useSearchParams();
  const initialTab = (params.get("tab") as Tab) || "all";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"price" | "distance" | "stock">("price");
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);

  const meds = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MEDICINES.filter(
      (m) =>
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.generic.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
    );
  }, [query]);

  const facilities = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FACILITIES.filter((f) => {
      if (tab !== "all" && tab !== "medication" && f.category !== tab)
        return false;
      if (tab === "medication") return false;
      if (!q) return true;
      return (
        f.name.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q) ||
        f.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, tab]);

  const showMeds = tab === "all" || tab === "medication";
  const showFacilities = tab === "all" || tab !== "medication";

  return (
    <div className="min-h-[100svh] bg-background">
      <SiteNavbar />

      {/* ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-[0.25] dark:opacity-[0.08]" />
        <div
          className="glow-orb animate-float-slow"
          style={{ width: 460, height: 460, background: "var(--glow-1)", top: "8%", right: "-8%" }}
        />
        <div
          className="glow-orb animate-float-slow"
          style={{ width: 360, height: 360, background: "var(--glow-2)", bottom: "10%", left: "-6%", animationDelay: "-5s" }}
        />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-8 text-center"
        >
          <span className="chip mb-4">
            <Navigation className="h-3 w-3 text-medical" />
            Find care anywhere
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Explore the network
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Search medicines and compare prices across pharmacies, or find the
            nearest hospital, clinic or pharmacy — with live queue times and bed
            availability.
          </p>
        </motion.div>

        {/* Search + tabs */}
        <div className="glass-panel mb-6 p-4 sm:p-5">
          <div className="input-premium flex h-12 items-center gap-2 px-4">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search medicines, hospitals, doctors, pharmacies…"
              className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground sm:text-base"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="btn-ghost grid h-6 w-6 place-items-center rounded-md"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                { id: "all", label: "All", icon: Search },
                { id: "medication", label: "Medicines", icon: Pill },
                { id: "hospital", label: "Hospitals", icon: Building2 },
                { id: "clinic", label: "Clinics", icon: Stethoscope },
                { id: "pharmacy", label: "Pharmacies", icon: Pill },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  tab === t.id
                    ? "bg-medical text-white"
                    : "bg-card/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Medicines */}
        {showMeds && (
          <section className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                Medicines{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({meds.length})
                </span>
              </h2>
              {tab === "medication" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">Sort:</span>
                  {(
                    [
                      { id: "price", label: "Price" },
                      { id: "distance", label: "Distance" },
                      { id: "stock", label: "In stock" },
                    ] as const
                  ).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSort(s.id)}
                      className={cn(
                        "rounded-md px-2 py-1 font-semibold transition-colors",
                        sort === s.id
                          ? "bg-medical/12 text-medical"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {meds.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {meds.map((m, i) => {
                  const cheapest = [...m.prices]
                    .filter((p) => p.inStock)
                    .sort((a, b) => a.price - b.price)[0];
                  const avgPrice =
                    m.prices.reduce((s, p) => s + p.price, 0) / m.prices.length;
                  return (
                    <motion.button
                      key={m.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: EASE, delay: i * 0.04 }}
                      onClick={() => setSelectedMed(m)}
                      className="glass-card group p-4 text-left transition-all hover:-translate-y-1 hover:border-medical/40"
                    >
                      <div className="flex items-start justify-between">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-medical/20 to-cyan-400/10 text-medical transition-transform group-hover:scale-110">
                          <Pill className="h-5 w-5" />
                        </span>
                        {m.requiresPrescription ? (
                          <span className="chip border-amber-500/30 text-amber-500 py-0 text-[0.6rem]">
                            Rx
                          </span>
                        ) : (
                          <span className="chip border-emerald-500/30 text-emerald-500 py-0 text-[0.6rem]">
                            OTC
                          </span>
                        )}
                      </div>
                      <h3 className="mt-3 font-display text-base font-semibold">
                        {m.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {m.generic} · {m.strength}
                      </p>
                      <div className="mt-3 flex items-end justify-between">
                        <div>
                          <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                            From
                          </div>
                          <div className="font-display text-xl font-bold text-medical">
                            R{cheapest?.price.toFixed(2) ?? "—"}
                          </div>
                        </div>
                        <div className="text-right text-[0.65rem] text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            avg R{avgPrice.toFixed(0)}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {m.prices.filter((p) => p.inStock).length}/
                            {m.prices.length} in stock
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-medical opacity-0 transition-opacity group-hover:opacity-100">
                        Compare {m.prices.length} pharmacies
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Facilities */}
        {showFacilities && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">
                Facilities{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  ({facilities.length})
                </span>
              </h2>
            </div>

            {facilities.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                {/* list */}
                <div className="space-y-3">
                  {facilities.map((f, i) => (
                    <motion.div
                      key={f.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: EASE, delay: i * 0.05 }}
                      className="glass-card group p-4 transition-all hover:-translate-y-0.5 hover:border-medical/40"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm",
                            f.category === "hospital"
                              ? "from-medical to-cyan-400"
                              : f.category === "clinic"
                                ? "from-cyan-400 to-medical"
                                : "from-emerald-500 to-teal-400"
                          )}
                        >
                          {f.category === "pharmacy" ? (
                            <Pill className="h-5 w-5" />
                          ) : (
                            <Building2 className="h-5 w-5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="truncate text-sm font-semibold">
                              {f.name}
                            </h3>
                            <span
                              className={cn(
                                "chip shrink-0 py-0 text-[0.6rem]",
                                f.open
                                  ? "border-emerald-500/30 text-emerald-500"
                                  : "border-rose-500/30 text-rose-500"
                              )}
                            >
                              {f.open ? "Open" : "Closed"}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {f.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Navigation className="h-3 w-3" />
                              {f.distanceKm >= 100
                                ? `${(f.distanceKm / 1000).toFixed(1)}k km`
                                : `${f.distanceKm} km`}
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {f.rating}
                            </span>
                            {f.queueWait !== undefined && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                ~{f.queueWait}min
                              </span>
                            )}
                          </div>
                          {f.beds && (
                            <div className="mt-2 flex items-center gap-2 text-[0.7rem]">
                              <span className="text-muted-foreground">
                                Beds:
                              </span>
                              <span className="font-semibold text-emerald-500">
                                {f.beds.available} free
                              </span>
                              <span className="text-muted-foreground">
                                / {f.beds.total}
                              </span>
                              <div className="ml-1 h-1.5 w-20 overflow-hidden rounded-full bg-card">
                                <div
                                  className="h-full bg-emerald-500"
                                  style={{
                                    width: `${(f.beds.available / f.beds.total) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {f.tags.slice(0, 4).map((t) => (
                              <span key={t} className="chip py-0 text-[0.6rem]">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Map */}
                <div className="relative h-[400px] overflow-hidden rounded-2xl border border-border bg-card/40 lg:h-auto lg:min-h-[520px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-medical/[0.06] via-background to-cyan-400/[0.04]" />
                  <div className="bg-grid absolute inset-0 opacity-40 dark:opacity-20" />
                  <MapPins />
                  <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/5" />
                  <div className="absolute left-3 top-3 z-20">
                    <span className="glass-card flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] font-semibold">
                      <MapPin className="h-3 w-3 text-medical" />
                      Gauteng · Johannesburg
                    </span>
                  </div>
                  <div className="absolute right-3 top-3 z-20">
                    <span className="glass-card flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] font-semibold text-muted-foreground">
                      <Navigation className="h-3 w-3" />
                      SA network
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 z-20">
                    <span className="glass-card flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-500">
                      <span className="status-dot bg-emerald-500" />
                      {facilities.length} nearby
                    </span>
                  </div>
                  <iframe
                    title="MedLink SA network map"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=27.9,-26.2,28.1,-26.0&layer=mapnik&marker=-26.1,28.0"
                    className="relative z-[1] h-full w-full opacity-85"
                    style={{ border: 0 }}
                    loading="lazy"
                  />
                </div>
              </div>
            )}
          </section>
        )}
      </main>

      <SiteFooter />

      {/* Medicine detail / price comparison modal */}
      {selectedMed && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center p-4"
          onClick={() => setSelectedMed(null)}
        >
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong relative z-10 max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-6 sm:p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-display text-2xl font-semibold">
                  {selectedMed.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {selectedMed.generic} · {selectedMed.strength} ·{" "}
                  {selectedMed.pack}
                </p>
              </div>
              <button
                onClick={() => setSelectedMed(null)}
                className="btn-ghost grid h-8 w-8 place-items-center rounded-lg"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip border-amber-500/30 text-amber-500">
                Schedule {selectedMed.schedule}
              </span>
              <span className="chip">{selectedMed.category}</span>
              {selectedMed.requiresPrescription ? (
                <span className="chip border-amber-500/30 text-amber-500">
                  Prescription required
                </span>
              ) : (
                <span className="chip border-emerald-500/30 text-emerald-500">
                  Over-the-counter
                </span>
              )}
            </div>

            <h3 className="mt-6 font-display text-base font-semibold">
              Compare prices across pharmacies
            </h3>
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-card/60 text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left">Pharmacy</th>
                    <th className="px-4 py-2.5 text-right">Price</th>
                    <th className="px-4 py-2.5 text-center">Stock</th>
                    <th className="px-4 py-2.5 text-center">Delivery</th>
                    <th className="px-4 py-2.5 text-right">Distance</th>
                    <th className="px-4 py-2.5 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[...selectedMed.prices]
                    .sort((a, b) => {
                      if (sort === "price") return a.price - b.price;
                      if (sort === "distance") return a.distanceKm - b.distanceKm;
                      return Number(b.inStock) - Number(a.inStock);
                    })
                    .map((p, idx) => (
                      <tr
                        key={p.pharmacy}
                        className={cn(
                          "transition-colors hover:bg-foreground/[0.02]",
                          idx === 0 && "bg-emerald-500/[0.04]"
                        )}
                      >
                        <td className="px-4 py-3 font-semibold">
                          {p.pharmacy}
                          {idx === 0 && (
                            <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[0.6rem] font-bold text-emerald-500">
                              CHEAPEST
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold tabular-nums">
                          R{p.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.inStock ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-500" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-rose-500" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {p.delivery ? (
                            <Truck className="mx-auto h-4 w-4 text-medical" />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              —
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {p.distanceKm} km
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            disabled={!p.inStock}
                            onClick={() => {
                              toast.success(
                                `Order placed: ${selectedMed.name} from ${p.pharmacy} — R${p.price.toFixed(2)}`
                              );
                              setSelectedMed(null);
                            }}
                            className={cn(
                              "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                              p.inStock
                                ? "btn-primary"
                                : "cursor-not-allowed bg-muted text-muted-foreground"
                            )}
                          >
                            {p.inStock ? "Order" : "Out"}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-card/40 p-3 text-xs text-muted-foreground">
              <Truck className="h-4 w-4 text-medical" />
              Delivery available from pharmacies marked with the truck icon.
              Prescription medicines require a valid script from your doctor —
              e-prescriptions are sent automatically.
            </div>

            <Link
              href="/sign-up?role=patient"
              className="btn-secondary mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
            >
              Sign up to order & track deliveries
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background/40 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
        <SearchX className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-sm font-semibold">No results found</h4>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {query
            ? `Nothing matches "${query}". Try another search or switch tabs.`
            : "Try another tab or a different search."}
        </p>
      </div>
    </div>
  );
}

const PINS = [
  { top: "22%", left: "30%", delay: "0s" },
  { top: "38%", left: "62%", delay: "0.6s" },
  { top: "58%", left: "44%", delay: "1.2s" },
  { top: "70%", left: "70%", delay: "1.8s" },
  { top: "30%", left: "78%", delay: "0.9s" },
];

function MapPins() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {PINS.map((p, i) => (
        <div key={i} className="absolute" style={{ top: p.top, left: p.left }}>
          <span className="relative flex h-3 w-3">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-medical opacity-40"
              style={{ animationDelay: p.delay }}
            />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-medical ring-2 ring-background shadow-[0_0_12px_var(--glow-1)]" />
          </span>
        </div>
      ))}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="explore-line" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--medical)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--medical)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="30%" y1="22%" x2="62%" y2="38%" stroke="url(#explore-line)" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="30%" y1="22%" x2="44%" y2="58%" stroke="url(#explore-line)" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="44%" y1="58%" x2="70%" y2="70%" stroke="url(#explore-line)" strokeWidth="1" strokeDasharray="3 4" />
      </svg>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <ExploreContent />
    </Suspense>
  );
}
