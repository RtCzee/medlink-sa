"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hospital,
  Stethoscope,
  Pill,
  Tablets,
  Search,
  SearchX,
  MapPin,
  Star,
  Clock,
  Navigation,
  Filter,
} from "lucide-react";
import { DIRECTORY } from "@/lib/data";
import type { DirectoryEntry } from "@/types";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Category = "all" | "hospital" | "doctor" | "pharmacy" | "medication";

const CATEGORIES: Array<{
  id: Category;
  label: string;
  icon: React.ElementType;
}> = [
  { id: "all", label: "All", icon: Filter },
  { id: "hospital", label: "Hospitals", icon: Hospital },
  { id: "doctor", label: "Doctors", icon: Stethoscope },
  { id: "pharmacy", label: "Pharmacies", icon: Pill },
  { id: "medication", label: "Medications", icon: Tablets },
];

const CATEGORY_META: Record<
  DirectoryEntry["category"],
  { icon: React.ElementType; tint: string; label: string }
> = {
  hospital: {
    icon: Hospital,
    tint: "from-medical/80 to-cyan-500/80",
    label: "Hospital",
  },
  doctor: {
    icon: Stethoscope,
    tint: "from-violet-500/80 to-medical/80",
    label: "Doctor",
  },
  pharmacy: {
    icon: Pill,
    tint: "from-emerald-500/80 to-teal-500/80",
    label: "Pharmacy",
  },
  medication: {
    icon: Tablets,
    tint: "from-amber-500/80 to-rose-500/80",
    label: "Medication",
  },
};

const EASE = [0.16, 1, 0.3, 1] as const;

/* ---------------- Animated map pins (decorative fallback) ---------------- */
const PINS = [
  { top: "22%", left: "30%", delay: "0s", label: "JHB" },
  { top: "38%", left: "62%", delay: "0.6s", label: "CPT" },
  { top: "58%", left: "44%", delay: "1.2s", label: "DBN" },
  { top: "70%", left: "70%", delay: "1.8s", label: "PE" },
  { top: "30%", left: "78%", delay: "0.9s", label: "BLO" },
];

function MapPins() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0">
      {PINS.map((p) => (
        <div
          key={p.label}
          className="absolute"
          style={{ top: p.top, left: p.left }}
        >
          <span className="relative flex h-3 w-3">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full bg-medical opacity-40"
              style={{ animationDelay: p.delay }}
            />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-medical ring-2 ring-background shadow-[0_0_12px_var(--glow-1)]" />
          </span>
        </div>
      ))}
      {/* connection lines */}
      <svg className="absolute inset-0 h-full w-full" aria-hidden>
        <defs>
          <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--medical)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--medical)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="30%" y1="22%" x2="62%" y2="38%" stroke="url(#line-grad)" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="30%" y1="22%" x2="44%" y2="58%" stroke="url(#line-grad)" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="44%" y1="58%" x2="70%" y2="70%" stroke="url(#line-grad)" strokeWidth="1" strokeDasharray="3 4" />
      </svg>
    </div>
  );
}

/* ---------------- Stars ---------------- */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating ${rating} of 5`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            className={cn(
              "h-3 w-3",
              filled
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        );
      })}
      <span className="ml-1 text-[0.7rem] font-semibold tabular-nums text-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

/* ---------------- Directory card ---------------- */
function DirectoryCard({
  entry,
  index,
}: {
  entry: DirectoryEntry;
  index: number;
}) {
  const meta = CATEGORY_META[entry.category];
  const Icon = meta.icon;
  const initials = entry.name
    .replace(/^(Dr\.?|Hospital|Pharmacy)\s*/i, "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: EASE, delay: Math.min(index * 0.04, 0.2) }}
      className={cn(
        "group relative cursor-pointer rounded-2xl border border-border/60 bg-card/60 p-3 transition-all duration-300",
        "hover:-translate-y-1 hover:border-medical/40 hover:bg-medical/[0.03] hover:shadow-[0_18px_40px_-18px_rgba(2,6,23,0.18)]"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className={cn(
            "relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-sm",
            meta.tint
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>

        {/* Body */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="truncate text-sm font-semibold text-foreground">
              {entry.name}
            </h4>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[0.65rem] font-semibold",
                entry.open
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-500 dark:text-rose-400"
              )}
            >
              <span
                className={cn(
                  "status-dot",
                  entry.open ? "bg-emerald-500" : "bg-rose-500"
                )}
              />
              {entry.open ? "Open" : "Closed"}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.7rem] text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{entry.location}</span>
            </span>
            <span className="flex items-center gap-1">
              <Navigation className="h-3 w-3" />
              <span className="tabular-nums">
                {entry.distanceKm >= 100
                  ? `${(entry.distanceKm / 1000).toFixed(1)}k km`
                  : `${entry.distanceKm} km`}
              </span>
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2">
            <Stars rating={entry.rating} />
            {entry.nextAvailable && (
              <span className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="font-medium text-foreground">
                  {entry.nextAvailable}
                </span>
              </span>
            )}
          </div>

          {entry.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <span key={tag} className="chip py-0.5 text-[0.62rem]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Initials watermark (decorative) */}
        <span className="pointer-events-none absolute bottom-2 right-3 select-none font-display text-2xl font-bold tracking-tight text-foreground/[0.04]">
          {initials}
        </span>
      </div>
    </motion.div>
  );
}

/* ---------------- Empty state ---------------- */
function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background/40 px-6 py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-muted/60 text-muted-foreground">
        <SearchX className="h-6 w-6" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-foreground">No results found</h4>
        <p className="mt-1 max-w-xs text-xs text-muted-foreground">
          {query
            ? `Nothing matches "${query}" in this category. Try another search or switch tabs.`
            : "Nothing in this category yet. Try another tab or a different search."}
        </p>
      </div>
      <span className="chip mt-1">
        <Search className="h-3 w-3" />
        Try another search
      </span>
    </div>
  );
}

export default function ExploreSection() {
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<Category>("all");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return DIRECTORY.filter((entry) => {
      const matchesCat = category === "all" || entry.category === category;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        entry.name.toLowerCase().includes(q) ||
        entry.location.toLowerCase().includes(q) ||
        entry.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [query, category]);

  const total = DIRECTORY.length;

  return (
    <section id="explore" className="relative py-20 sm:py-28">
      {/* Ambient backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="glow-orb animate-float-slow"
          style={{
            width: 380,
            height: 380,
            background: "var(--glow-2)",
            top: "8%",
            right: "-8%",
          }}
        />
        <div
          className="glow-orb animate-float-slow"
          style={{
            width: 320,
            height: 320,
            background: "var(--glow-1)",
            bottom: "5%",
            left: "-6%",
            animationDelay: "-6s",
          }}
        />
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <div className="mb-10 flex flex-col items-start gap-3 sm:mb-12 sm:items-center sm:text-center">
          <span className="chip">
            <Navigation className="h-3 w-3 text-medical" />
            <span className="uppercase tracking-widest text-medical">
              Find care anywhere
            </span>
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-gradient sm:text-4xl lg:text-5xl">
            Explore the network
          </h2>
          <p className="max-w-2xl text-balance text-muted-foreground sm:text-lg">
            Hospitals, doctors, pharmacies and medications — searchable across
            all nine provinces, with live availability and distance.
          </p>
        </div>

        {/* Glass panel */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, ease: EASE }}
          className="glass-card overflow-hidden rounded-3xl p-4 sm:p-6"
        >
          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="input-premium relative flex h-11 flex-1 items-center gap-2 rounded-xl px-3.5">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, location or specialty…"
                aria-label="Search directory"
                className="h-full w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="btn-ghost grid h-6 w-6 place-items-center rounded-md text-xs"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <Tabs
              value={category}
              onValueChange={(v) => setCategory(v as Category)}
              className="w-full sm:w-auto"
            >
              <TabsList className="glass h-11 w-full flex-wrap justify-start gap-1 rounded-xl p-1 sm:w-auto">
                {CATEGORIES.map(({ id, label, icon: Icon }) => (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="h-9 flex-1 gap-1.5 rounded-lg px-2.5 text-xs font-semibold sm:flex-none"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Two column layout */}
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            {/* List */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <span className="font-semibold text-foreground">
                    {filtered.length}
                  </span>{" "}
                  of {total} facilities
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="status-dot bg-emerald-500" />
                  Live availability
                </span>
              </div>

              <div className="max-h-[460px] min-h-[300px] overflow-y-auto pr-1 [scrollbar-width:thin]">
                {filtered.length > 0 ? (
                  <AnimatePresence mode="popLayout" initial={false}>
                    <div className="flex flex-col gap-2.5">
                      {filtered.map((entry, i) => (
                        <DirectoryCard key={entry.id} entry={entry} index={i} />
                      ))}
                    </div>
                  </AnimatePresence>
                ) : (
                  <EmptyState query={query} />
                )}
              </div>
            </div>

            {/* Map */}
            <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-background/40">
              {/* Stylized fallback map background (shows through if iframe is blank) */}
              <div className="absolute inset-0 -z-0 bg-gradient-to-br from-medical/[0.06] via-background to-cyan-400/[0.04]" />
              <div className="bg-grid absolute inset-0 -z-0 opacity-40 dark:opacity-20" />
              {/* Decorative animated location pins */}
              <MapPins />

              <div className="pointer-events-none absolute inset-0 z-10 rounded-2xl ring-1 ring-inset ring-white/5" />
              <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
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
              {/* Floating live count chip */}
              <div className="absolute bottom-3 left-3 z-20">
                <span className="glass-card flex items-center gap-1.5 px-2.5 py-1 text-[0.7rem] font-semibold text-emerald-500">
                  <span className="status-dot bg-emerald-500" />
                  1,280 live facilities
                </span>
              </div>
              <iframe
                title="MedLink SA network map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=27.9,-26.2,28.1,-26.0&layer=mapnik&marker=-26.1,28.0"
                className="relative z-[1] h-[300px] w-full opacity-90 lg:h-full lg:min-h-[520px]"
                style={{ border: 0 }}
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-16 bg-gradient-to-t from-background/70 to-transparent" />
            </div>
          </div>

          {/* Footer row */}
          <div className="mt-5 flex flex-col items-center justify-between gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground sm:flex-row">
            <span>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {filtered.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-foreground">{total}</span>{" "}
              facilities
              {category !== "all" && (
                <>
                  {" "}
                  in{" "}
                  <span className="font-semibold text-medical">
                    {CATEGORIES.find((c) => c.id === category)?.label}
                  </span>
                </>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              Powered by OpenStreetMap
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
