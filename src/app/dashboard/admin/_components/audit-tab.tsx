"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ScrollText,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Download,
  Globe,
  Smartphone,
  Hash,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, AUDIT_KIND_META, SectionHeader } from "./shared";
import { AUDIT_EXTENDED } from "./mock-data";
import type { AuditKind } from "./types";

/* ---------- filter config ---------- */

const KIND_FILTERS: { value: AuditKind | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "auth", label: "Auth" },
  { value: "edit", label: "Edit" },
  { value: "create", label: "Create" },
  { value: "delete", label: "Delete" },
  { value: "system", label: "System" },
  { value: "verify", label: "Verify" },
];

/* ---------- component ---------- */

export function AuditTab() {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<AuditKind | "all">("all");
  const [expandId, setExpandId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return AUDIT_EXTENDED.filter((e) => {
      const matchQ =
        !query ||
        e.actor.toLowerCase().includes(query.toLowerCase()) ||
        e.action.toLowerCase().includes(query.toLowerCase()) ||
        e.target.toLowerCase().includes(query.toLowerCase());
      const matchK = kindFilter === "all" || e.kind === kindFilter;
      return matchQ && matchK;
    });
  }, [query, kindFilter]);

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <SectionHeader
          kicker="Audit Trail"
          icon={ScrollText}
          title="System Audit Log"
          subtitle="Immutable record of all platform actions for POPIA compliance."
        />
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={fadeUp} className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actor, action, target…"
            className="w-full rounded-lg border border-border/60 bg-background/60 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical/30"
          />
        </div>

        {/* Kind filter pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {KIND_FILTERS.map((k) => {
            const meta = k.value !== "all" ? AUDIT_KIND_META[k.value] : null;
            return (
              <Button
                key={k.value}
                onClick={() => setKindFilter(k.value)}
                variant="ghost"
                size="sm"
                className={cn(
                  "rounded-full",
                  kindFilter === k.value
                    ? k.value === "all"
                      ? "bg-medical text-white hover:bg-medical/90"
                      : cn(meta?.bg, meta?.color, "ring-1", meta?.ring, "hover:opacity-90")
                    : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
                )}
              >
                {meta && <meta.icon className="h-3 w-3" />}
                {k.label}
              </Button>
            );
          })}
        </div>

        {/* Export mock */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast?.info?.("Export coming soon") ?? undefined}
          className="flex items-center gap-1.5 text-xs"
        >
          <Download className="h-3.5 w-3.5" /> Export
        </Button>
      </motion.div>

      {/* Results count */}
      <motion.div variants={fadeUp} className="text-xs text-muted-foreground">
        {filtered.length} event{filtered.length !== 1 && "s"}
      </motion.div>

      {/* Event list */}
      <motion.div variants={fadeUp} className="space-y-2">
        <AnimatePresence>
          {filtered.map((e) => {
            const meta = AUDIT_KIND_META[e.kind];
            const expanded = expandId === e.id;
            return (
              <motion.div
                key={e.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="glass-panel overflow-hidden rounded-xl"
              >
                {/* Row */}
                <Button
                  variant="ghost"
                  onClick={() => setExpandId(expanded ? null : e.id)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left h-auto hover:bg-foreground/[0.02]"
                >
                  <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-lg ring-1", meta.bg, meta.ring)}>
                    <meta.icon className={cn("h-4 w-4", meta.color)} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 text-sm">
                      <span className="font-medium">{e.actor}</span>
                      <span className="text-muted-foreground">{e.action}</span>
                      <span className="font-medium">{e.target}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{e.time}</div>
                  </div>
                  <span className={cn("rounded-full px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider ring-1", meta.bg, meta.ring, meta.color)}>
                    {meta.label}
                  </span>
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                </Button>

                {/* Expanded details */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border/40"
                    >
                      <div className="grid grid-cols-1 gap-3 px-4 py-3 sm:grid-cols-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Globe className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">IP:</span>
                          <span className="font-mono text-[0.7rem]">{e.ip}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Smartphone className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">Device:</span>
                          <span>{e.device}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Hash className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">Hash:</span>
                          <span className="font-mono text-[0.7rem]">{e.hash}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
