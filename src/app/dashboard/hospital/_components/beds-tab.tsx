"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BedDouble,
  Bed,
  Activity,
  Baby,
  Scissors,
  Filter,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  DoorOpen,
  Stethoscope,
  HeartPulse,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { BED_GRID } from "@/lib/data";
import { BED_STATUS_META, bedDetail, WARDS } from "./mock-data";
import { ViewHeader, StatusPill } from "./shared";
import type { BedStatus, BedRow } from "./types";

export default function BedsTab() {
  const allBeds = useMemo(() => BED_GRID as BedRow[], []);
  const [wardFilter, setWardFilter] = useState<string>("all");
  const [selectedBed, setSelectedBed] = useState<BedRow | null>(null);

  const counts = useMemo(() => {
    const c = { occupied: 0, available: 0, cleaning: 0, reserved: 0 };
    allBeds.forEach((b) => {
      c[b.status] += 1;
    });
    return c;
  }, [allBeds]);

  const filteredBeds = useMemo(() => {
    if (wardFilter === "all") return allBeds;
    return allBeds.filter((b) => b.ward === wardFilter);
  }, [allBeds, wardFilter]);

  const bedsByWard = useMemo(() => {
    const map: Record<string, BedRow[]> = {};
    WARDS.forEach((w) => {
      map[w] = filteredBeds.filter((b) => b.ward === w);
    });
    return map;
  }, [filteredBeds]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Beds & wards"
        subtitle="Live bed heatmap · 80 beds across 5 wards"
        icon={BedDouble}
      />

      {/* Bed status summary bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-4"
      >
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <Bed className="h-4 w-4 text-medical" />
            <span className="text-sm font-semibold">
              {allBeds.length} beds total
            </span>
          </div>
          <div className="h-4 w-px bg-border" />
          {(["occupied", "available", "cleaning", "reserved"] as BedStatus[]).map(
            (s) => (
              <div key={s} className="flex items-center gap-2">
                <span
                  className={cn("h-3 w-3 rounded", BED_STATUS_META[s].dot)}
                />
                <span className="text-sm font-semibold">
                  {counts[s]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {BED_STATUS_META[s].label}
                </span>
              </div>
            )
          )}
          <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
            <span className="status-dot bg-emerald-500" />
            Updated 4s ago
          </div>
        </div>
        {/* Proportion bar */}
        <div className="mt-3 flex h-2.5 w-full overflow-hidden rounded-full bg-foreground/5">
          {(["occupied", "available", "cleaning", "reserved"] as BedStatus[]).map(
            (s) => (
              <div
                key={s}
                className={cn("h-full", BED_STATUS_META[s].dot)}
                style={{ width: `${(counts[s] / allBeds.length) * 100}%` }}
                title={`${BED_STATUS_META[s].label}: ${counts[s]}`}
              />
            )
          )}
        </div>
      </motion.div>

      {/* Ward filter + legend */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Button
            onClick={() => setWardFilter("all")}
            variant="outline"
            size="sm"
            className={cn(
              "rounded-lg px-3 py-1.5",
              wardFilter === "all"
                ? "border-medical bg-medical/10 text-medical"
                : "text-muted-foreground hover:bg-foreground/5"
            )}
            aria-pressed={wardFilter === "all"}
          >
            All wards
          </Button>
          {WARDS.map((w) => (
            <Button
              key={w}
              onClick={() => setWardFilter(w)}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-lg px-3 py-1.5",
                wardFilter === w
                  ? "border-medical bg-medical/10 text-medical"
                  : "text-muted-foreground hover:bg-foreground/5"
              )}
              aria-pressed={wardFilter === w}
            >
              {w}
              <span className="ml-1.5 text-[0.65rem] text-muted-foreground">
                ({allBeds.filter((b) => b.ward === w).length})
              </span>
            </Button>
          ))}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {(["occupied", "available", "cleaning", "reserved"] as BedStatus[]).map(
            (s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className={cn("h-3 w-3 rounded", BED_STATUS_META[s].dot)}
                />
                {BED_STATUS_META[s].label}
              </div>
            )
          )}
        </div>
      </div>

      {/* Heatmap grid grouped by ward */}
      <div className="space-y-5">
        {Object.values(bedsByWard).every((b) => b.length === 0) && (
          <p className="py-8 text-center text-sm text-muted-foreground">No beds match the current ward filter.</p>
        )}
        {WARDS.map((ward) => {
          const wardBeds = bedsByWard[ward] || [];
          if (wardBeds.length === 0) return null;
          const wardCounts = {
            occupied: wardBeds.filter((b) => b.status === "occupied").length,
            available: wardBeds.filter((b) => b.status === "available").length,
            cleaning: wardBeds.filter((b) => b.status === "cleaning").length,
            reserved: wardBeds.filter((b) => b.status === "reserved").length,
          };
          const occupancy = Math.round(
            (wardCounts.occupied / wardBeds.length) * 100
          );
          return (
            <motion.section
              key={ward}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/10 text-medical">
                    {ward === "ICU" && <Activity className="h-4 w-4" />}
                    {ward === "General" && <Bed className="h-4 w-4" />}
                    {ward === "Paediatrics" && <Baby className="h-4 w-4" />}
                    {ward === "Maternity" && <Baby className="h-4 w-4" />}
                    {ward === "Surgical" && <Scissors className="h-4 w-4" />}
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold">
                      {ward} ward
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {wardBeds.length} beds · {occupancy}% occupied
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-rose-500">
                    {wardCounts.occupied} occ
                  </span>
                  <span className="text-emerald-500">
                    {wardCounts.available} free
                  </span>
                  <span className="text-amber-500">
                    {wardCounts.cleaning} clean
                  </span>
                  <span className="text-violet-500">
                    {wardCounts.reserved} res
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-8 gap-2 sm:grid-cols-10 md:grid-cols-12 lg:grid-cols-16">
                {wardBeds.map((bed) => {
                  const meta = BED_STATUS_META[bed.status];
                  return (
                    <motion.button
                      key={bed.id}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setSelectedBed(bed)}
                      className={cn(
                        "relative aspect-square rounded-lg border text-[0.65rem] font-bold transition-shadow hover:ring-2",
                        meta.tile,
                        meta.ring,
                        "hover:ring-2"
                      )}
                      aria-label={`Bed ${bed.bedNumber}, ${ward}, ${meta.label}. Click for details.`}
                      title={`Bed ${bed.bedNumber} · ${meta.label}`}
                    >
                      {bed.bedNumber}
                    </motion.button>
                  );
                })}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Bed detail drawer */}
      <BedDetailSheet bed={selectedBed} onClose={() => setSelectedBed(null)} />
    </div>
  );
}

function BedDetailSheet({
  bed,
  onClose,
}: {
  bed: BedRow | null;
  onClose: () => void;
}) {
  const open = bed !== null;
  const detail = bed ? bedDetail(bed) : null;
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="glass-strong w-full overflow-y-auto border-l border-border/60 p-0 sm:max-w-md"
      >
        {bed && (
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-border/60 p-5">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-xl border text-sm font-bold",
                    BED_STATUS_META[bed.status].tile
                  )}
                >
                  <BedDouble className="h-5 w-5" />
                </span>
                <div>
                  <SheetTitle className="font-display text-lg">
                    Bed #{bed.bedNumber}
                  </SheetTitle>
                  <SheetDescription className="text-sm">
                    {bed.ward} ward · {BED_STATUS_META[bed.status].label}
                  </SheetDescription>
                </div>
              </div>
              <div className="mt-3">
                <StatusPill
                  tone={
                    bed.status === "occupied"
                      ? "rose"
                      : bed.status === "available"
                      ? "emerald"
                      : bed.status === "cleaning"
                      ? "amber"
                      : "violet"
                  }
                >
                  {BED_STATUS_META[bed.status].label}
                </StatusPill>
              </div>
            </SheetHeader>

            <div className="flex-1 space-y-5 p-5">
              {bed.status === "available" && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-emerald-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Bed ready for admission
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Last cleaned by Housekeeping at 11:42. Linen refreshed, vitals
                    monitor calibrated. Ready to receive next patient.
                  </p>
                </div>
              )}

              {bed.status === "cleaning" && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    Cleaning in progress
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Terminal disinfection underway. Estimated completion in 22
                    minutes. Housekeeping team notified.
                  </p>
                </div>
              )}

              {bed.status === "reserved" && detail && (
                <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 text-sm">
                  <div className="flex items-center gap-2 font-semibold text-violet-500">
                    <Clock className="h-4 w-4" />
                    Reserved · admission scheduled
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    Pre-admission booked for {detail.patient}, {detail.age} ·{" "}
                    {detail.diagnosis}. Expected arrival from ED within 1 hour.
                  </p>
                </div>
              )}

              {detail && (bed.status === "occupied" || bed.status === "reserved") && (
                <>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Patient
                    </div>
                    <div className="mt-1.5 flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-xs font-bold text-white">
                        {detail.patient
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <div>
                        <div className="font-semibold">
                          {detail.patient}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {detail.age} yrs · {detail.insurance}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <InfoTile
                      label="Admitted"
                      value={detail.admitted}
                      icon={Calendar}
                    />
                    <InfoTile
                      label="Expected discharge"
                      value={detail.expectedDischarge}
                      icon={DoorOpen}
                    />
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Attending clinician
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2">
                      <Stethoscope className="h-4 w-4 text-medical" />
                      <span className="flex-1 text-sm font-medium">
                        {detail.attending}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Diagnosis
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-border/60 bg-foreground/[0.02] px-3 py-2">
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                      <span className="flex-1 text-sm font-medium">
                        {detail.diagnosis}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="default"
                      className="flex-1 gap-2 rounded-lg px-3 py-2"
                      onClick={() => toast.success("Patient record opened")}
                    >
                      <FileText className="h-4 w-4" />
                      Open record
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 gap-2 rounded-lg px-3 py-2"
                      onClick={() => toast.success("Discharge planner notified")}
                    >
                      <DoorOpen className="h-4 w-4" />
                      Plan discharge
                    </Button>
                  </div>
                </>
              )}

              {bed.status === "available" && (
                <Button
                  variant="default"
                  className="w-full gap-2 rounded-lg px-3 py-2"
                  onClick={() => toast.success(`Bed #${bed.bedNumber} reserved for next admission`)}
                >
                  <Plus className="h-4 w-4" />
                  Reserve for admission
                </Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-foreground/[0.02] p-3">
      <div className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}
