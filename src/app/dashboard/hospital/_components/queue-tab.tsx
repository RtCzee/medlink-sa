"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ListOrdered,
  Activity,
  Users,
  Clock,
  CheckCircle2,
  ArrowRight,
  X,
  ShieldAlert,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { HOSPITAL_QUEUE } from "@/lib/data";
import { ViewHeader, StatCard, StatusPill } from "./shared";

type QueueEntry = {
  number: number;
  name: string;
  service: string;
  status: "serving" | "called" | "waiting" | "missed" | "completed";
  waitMin: number;
};

export default function QueueTab() {
  const [entries, setEntries] = useState<QueueEntry[]>(
    HOSPITAL_QUEUE.map((q) => ({ ...q })) as QueueEntry[]
  );
  const [nowServing, setNowServing] = useState(37);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const waiting = entries.filter((e) => e.status === "waiting");
  const called = entries.filter((e) => e.status === "called");
  const serving = entries.filter((e) => e.status === "serving");
  const avgWait =
    waiting.length > 0
      ? Math.round(
          waiting.reduce((s, e) => s + e.waitMin, 0) / waiting.length
        )
      : 0;

  function callNext() {
    setEntries((prev) => {
      const next = [...prev];
      const firstWaiting = next.find((e) => e.status === "waiting");
      if (!firstWaiting) {
        toast.info("No patients waiting in queue");
        return prev;
      }
      firstWaiting.status = "called";
      firstWaiting.waitMin = 0;
      toast.success(`Calling #${firstWaiting.number} · ${firstWaiting.name}`, {
        description: `${firstWaiting.service} · please proceed to triage`,
      });
      return next;
    });
  }

  function startServing(num: number) {
    setEntries((prev) =>
      prev.map((e) => {
        if (e.status === "serving") {
          return { ...e, status: "completed" as const };
        }
        if (e.number === num) {
          setNowServing(num);
          setElapsed(0);
          return { ...e, status: "serving" as const };
        }
        return e;
      })
    );
    toast.success(`Now serving #${num}`);
  }

  function completeServing() {
    setEntries((prev) =>
      prev.map((e) =>
        e.status === "serving"
          ? { ...e, status: "completed" as const }
          : e
      )
    );
    toast.success("Consultation completed · patient discharged from queue");
  }

  function skipMissed(num: number) {
    setEntries((prev) => {
      const next = [...prev];
      const idx = next.findIndex((e) => e.number === num);
      if (idx === -1) return prev;
      const [entry] = next.splice(idx, 1);
      const requeued: QueueEntry = {
        ...entry,
        status: "waiting",
        waitMin: 0,
        number: next.length + 50,
      };
      next.push(requeued);
      return next;
    });
    toast.warning(`#${num} skipped — re-queued after 5 patients`, {
      description: "Per MedLink SA missed-turn rule",
    });
  }

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Queue management"
        subtitle="Live triage board · Chris Hani Baragwanath · OPD"
        icon={ListOrdered}
        action={
          <Button
            onClick={callNext}
            variant="default"
            className="gap-2 rounded-lg px-4 py-2"
            aria-label="Call next patient"
          >
            <ArrowRight className="h-4 w-4" />
            Call next
          </Button>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Now serving"
          value={`#${nowServing}`}
          hint={`${mm}:${ss} elapsed`}
          icon={Activity}
          accent="#2563eb"
          ariaLabel={`Now serving ticket number ${nowServing}`}
        />
        <StatCard
          label="In queue"
          value={waiting.length}
          hint={`${called.length} called`}
          icon={Users}
          accent="#f59e0b"
        />
        <StatCard
          label="Avg wait"
          value={`${avgWait}m`}
          hint="Across waiting room"
          icon={Clock}
          accent="#06b6d4"
        />
        <StatCard
          label="Completed today"
          value={entries.filter((e) => e.status === "completed").length}
          hint="Discharged from queue"
          icon={CheckCircle2}
          accent="#10b981"
        />
      </div>

      {/* Board: 3 columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <QueueColumn
          title="Now serving"
          accent="#2563eb"
          entries={serving}
          emptyText="No active consultation — call next to begin."
          renderActions={(e) => (
            <Button
              onClick={() => completeServing()}
              variant="default"
              size="sm"
              className="gap-1.5 rounded-md px-2.5"
              aria-label={`Mark #${e.number} as completed`}
            >
              <Check className="h-3.5 w-3.5" />
              Complete
            </Button>
          )}
        />

        <QueueColumn
          title="Called"
          accent="#f59e0b"
          entries={called}
          emptyText="No patients called yet."
          renderActions={(e) => (
            <div className="flex gap-1.5">
              <Button
                onClick={() => startServing(e.number)}
                variant="default"
                size="sm"
                className="gap-1.5 rounded-md px-2.5"
                aria-label={`Start serving #${e.number}`}
              >
                <ArrowRight className="h-3.5 w-3.5" />
                Start
              </Button>
              <Button
                onClick={() => skipMissed(e.number)}
                variant="secondary"
                size="sm"
                className="gap-1.5 rounded-md px-2.5"
                aria-label={`Skip #${e.number} — patient missed`}
              >
                <X className="h-3.5 w-3.5" />
                Skip
              </Button>
            </div>
          )}
        />

        <QueueColumn
          title="Waiting"
          accent="#8b5cf6"
          entries={waiting}
          emptyText="Queue is clear."
          renderActions={(e) => (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="font-semibold">{e.waitMin}m</span>
              <Button
                onClick={() => skipMissed(e.number)}
                variant="ghost"
                size="icon"
                className="ml-1"
                aria-label={`Mark #${e.number} as missed`}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        />
      </div>

      {/* Missed-turn rule note */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel flex items-start gap-3 p-4"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-medical/10 text-medical">
          <ShieldAlert className="h-4 w-4" />
        </span>
        <div className="text-sm">
          <div className="font-semibold">Missed-turn rule</div>
          <p className="mt-0.5 text-muted-foreground">
            Patients who miss their call are re-queued <strong>after 5 people</strong> —
            not at the back of the line, and not at the front. This balances fairness
            to those who arrived on time with the reality that ED waits can run long.
            Skipped tickets keep their original number for traceability.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function QueueColumn({
  title,
  accent,
  entries,
  emptyText,
  renderActions,
}: {
  title: string;
  accent: string;
  entries: QueueEntry[];
  emptyText: string;
  renderActions: (entry: QueueEntry) => React.ReactNode;
}) {
  return (
    <div className="glass-panel overflow-hidden">
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{ borderColor: `${accent}30` }}
      >
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: accent }}
        />
        <span className="text-sm font-semibold">{title}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {entries.length}
        </span>
      </div>
      <div className="divide-y divide-border/60">
        {entries.length === 0 && (
          <p className="px-4 py-6 text-center text-xs text-muted-foreground">
            {emptyText}
          </p>
        )}
        {entries.map((e) => (
          <div
            key={e.number}
            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-foreground/[0.02]"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-foreground/5 text-xs font-bold">
              {e.number}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{e.name}</div>
              <div className="text-xs text-muted-foreground">{e.service}</div>
            </div>
            <div className="shrink-0">
              {renderActions(e)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
