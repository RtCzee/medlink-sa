"use client";

import { Users, Clock, ArrowRight } from "lucide-react";

import { QUEUE_STATE, CURRENT_TICKET } from "@/lib/data";
import { ViewHeader, StatCard } from "./shared-utils";
import { QRTile } from "./qr-tile";

export function QueueView() {
  return (
    <div>
      <ViewHeader title="Live Queue" subtitle="Track your position in real time across departments." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="glass-panel p-6 text-center">
          <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Your ticket</div>
          <div className="mb-2 text-5xl font-black text-medical">{CURRENT_TICKET.number}</div>
          <div className="text-xs text-muted-foreground">Issued {CURRENT_TICKET.issuedAt}</div>
          <div className="mt-1 text-xs text-muted-foreground">Est. wait: {CURRENT_TICKET.estimatedWaitMin} min</div>
        </div>
        <div className="glass-panel flex items-center justify-center p-6">
          <QRTile ticket={CURRENT_TICKET.number} />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Now serving" value={String(QUEUE_STATE.nowServing)} sub="Current ticket" accent="medical" index={0} />
        <StatCard icon={ArrowRight} label="Ahead of you" value={String(QUEUE_STATE.totalAhead)} sub="In the queue" accent="amber" index={1} />
        <StatCard icon={Users} label="Total in queue" value={String(QUEUE_STATE.totalInQueue)} sub="All departments" accent="cyan" index={2} />
        <StatCard icon={Clock} label="Avg wait" value={`${QUEUE_STATE.avgWaitMin} min`} sub={`Updated ${QUEUE_STATE.lastUpdated}`} accent="emerald" index={3} />
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your position</span>
          <span className="font-mono font-bold text-medical">{QUEUE_STATE.totalAhead} ahead of you</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-medical transition-all"
            style={{ width: `${Math.max(5, 100 - (QUEUE_STATE.totalAhead / QUEUE_STATE.totalInQueue) * 100)}%` }}
          />
        </div>
        <div className="mt-1 text-[10px] text-muted-foreground">Ticket {CURRENT_TICKET.number} · {CURRENT_TICKET.service} at {CURRENT_TICKET.facility}</div>
      </div>
    </div>
  );
}
