"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PATIENT_RECORDS } from "@/lib/data";
import { StatusPill, ViewHeader } from "./shared-utils";

const FILTERS = ["All", "Consultations", "Imaging", "Lab"];

export function RecordsView() {
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const records = PATIENT_RECORDS.filter((r) => {
    if (filter !== "All" && r.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return r.title.toLowerCase().includes(q) || r.facility.toLowerCase().includes(q) || r.doctor.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <ViewHeader title="Medical Records" subtitle="Access your consultations, lab results and imaging reports." />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            variant="ghost"
            size="sm"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 text-xs font-medium",
              filter === f ? "bg-medical text-white" : "bg-card/60 text-muted-foreground hover:bg-card"
            )}
          >
            {f}
          </Button>
        ))}
        <div className="input-premium flex h-8 flex-1 items-center gap-2 rounded-lg px-3">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="space-y-3">
        {records.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-panel flex items-center gap-4 p-4"
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-medical/10 text-medical">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{r.title}</div>
              <div className="text-xs text-muted-foreground">{r.doctor} · {r.facility}</div>
              <div className="mt-1 text-xs text-muted-foreground">{r.date}</div>
            </div>
            <StatusPill status={r.type} />
          </motion.div>
        ))}
        {records.length === 0 && <p className="text-sm text-muted-foreground">No records found.</p>}
      </div>
    </div>
  );
}
