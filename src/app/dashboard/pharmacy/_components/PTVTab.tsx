"use client";

import { useState, useMemo } from "react";
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { SectionHeader } from "./shared";
import { PTV_ORDERS_INITIAL, PTV_STATUS_META, MEDICINES } from "./mock-data";
import type { PTVOrder, PTVReviewStatus } from "./types";
import { runPTVReview } from "@/lib/ptv";
import { toast } from "sonner";

export default function PTVTab() {
  const [orders, setOrders] = useState<PTVOrder[]>(PTV_ORDERS_INITIAL);
  const [selectedOrder, setSelectedOrder] = useState<PTVOrder | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<PTVReviewStatus | "all">("all");

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !searchQuery ||
        o.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.medicine.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.rxId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === "all" || o.ptvStatus === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.ptvStatus === "pending").length;
    const approved = orders.filter((o) => o.ptvStatus === "approved").length;
    const flagged = orders.filter((o) => o.ptvStatus === "flagged").length;
    const rejected = orders.filter((o) => o.ptvStatus === "rejected").length;
    return { pending, approved, flagged, rejected };
  }, [orders]);

  function runReview(order: PTVOrder) {
    const matched = MEDICINES.find((m) => order.medicine.toLowerCase().startsWith(m.name.toLowerCase()));
    return runPTVReview({
      medicineName: matched?.name ?? order.medicine.split(" ")[0],
      generic: matched?.generic ?? order.medicine,
      dosage: matched?.strength ?? "500",
      frequency: "twice daily",
      quantity: order.qty,
      schedule: order.schedule,
      currentMedications: order.currentMedications ?? [],
    });
  }

  function handleApprove(order: PTVOrder) {
    const result = runReview(order);
    setOrders((prev) =>
      prev.map((o) => (o.id === order.id ? { ...o, ptvStatus: "approved" as const, ptvResult: result } : o))
    );
    toast.success(`PTV approved for ${order.patient}`, {
      description: `${order.medicine} — ${result.notes[0] ?? "Safe to dispense"}`,
    });
  }

  function handleFlag(order: PTVOrder) {
    const result = runReview(order);
    setSelectedOrder({ ...order, ptvResult: result });
    setReviewNotes("");
    setReviewDialogOpen(true);
  }

  function handleReject(order: PTVOrder) {
    const result = runReview(order);
    setSelectedOrder({ ...order, ptvResult: result });
    setReviewNotes("");
    setReviewDialogOpen(true);
  }

  function confirmFlag() {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id ? { ...o, ptvStatus: "flagged" as const, ptvResult: selectedOrder.ptvResult } : o
      )
    );
    setReviewDialogOpen(false);
    toast.warning(`PTV flagged for ${selectedOrder.patient}`, {
      description: reviewNotes || "Pharmacist flagged this prescription for review.",
    });
  }

  function confirmReject() {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === selectedOrder.id ? { ...o, ptvStatus: "rejected" as const, ptvResult: selectedOrder.ptvResult } : o
      )
    );
    setReviewDialogOpen(false);
    toast.error(`PTV rejected for ${selectedOrder.patient}`, {
      description: reviewNotes || "Prescription rejected — contact prescriber.",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-medical" />
          Pharmacotherapeutic Review (PTV)
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review prescriptions for drug interactions, dosage compliance, and SA schedule regulations before dispensing.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Pending Review", value: stats.pending, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
          { label: "Approved", value: stats.approved, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
          { label: "Flagged", value: stats.flagged, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10" },
          { label: "Rejected", value: stats.rejected, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10" },
        ].map((s) => (
          <div key={s.label} className="glass-card rounded-xl p-4">
            <div className={cn("text-2xl font-bold", s.color)}>{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by patient, medicine, or Rx ID…"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search prescriptions for PTV review"
          />
        </div>
        <div className="flex gap-1.5">
          {(["all", "pending", "approved", "flagged", "rejected"] as const).map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              className="text-xs"
              onClick={() => setFilterStatus(status)}
            >
              {status === "all" ? "All" : PTV_STATUS_META[status].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Orders table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 text-left text-xs font-medium text-muted-foreground">
                <th className="px-4 py-3">Rx ID</th>
                <th className="px-4 py-3">Patient</th>
                <th className="px-4 py-3">Medicine</th>
                <th className="px-4 py-3">Schedule</th>
                <th className="px-4 py-3">Prescriber</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    <ShieldCheck className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    <p className="text-sm">No prescriptions match your search.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const meta = PTV_STATUS_META[order.ptvStatus];
                  return (
                    <tr key={order.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs">{order.rxId}</td>
                      <td className="px-4 py-3 font-medium">{order.patient}</td>
                      <td className="px-4 py-3">
                        <div>{order.medicine}</div>
                        <div className="text-xs text-muted-foreground">Qty: {order.qty}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">S{order.schedule}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs">{order.prescribedBy}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.ptvStatus === "pending" && (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs text-emerald-600 hover:bg-emerald-500/10" onClick={() => handleApprove(order)} aria-label={`Approve prescription ${order.rxId}`}>
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs text-orange-600 hover:bg-orange-500/10" onClick={() => handleFlag(order)} aria-label={`Flag prescription ${order.rxId}`}>
                              <AlertTriangle className="h-3 w-3" /> Flag
                            </Button>
                            <Button variant="outline" size="sm" className="h-7 gap-1 text-xs text-rose-600 hover:bg-rose-500/10" onClick={() => handleReject(order)} aria-label={`Reject prescription ${order.rxId}`}>
                              <X className="h-3 w-3" /> Reject
                            </Button>
                          </div>
                        )}
                        {order.ptvStatus !== "pending" && (
                          <span className="text-xs text-muted-foreground">
                            {order.ptvResult?.notes[0] ?? "—"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-medical" />
              PTV Review — {selectedOrder?.rxId}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.patient} — {selectedOrder?.medicine}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder?.ptvResult && (
            <div className="space-y-3">
              {selectedOrder.ptvResult.drugInteractions.length > 0 && (
                <div className="rounded-lg bg-orange-500/10 p-3">
                  <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1">Drug Interactions</div>
                  {selectedOrder.ptvResult.drugInteractions.map((di, i) => (
                    <div key={i} className="text-xs text-muted-foreground">
                      <Badge variant="outline" className={cn(
                        "text-[10px] mr-1",
                        di.severity === "severe" && "bg-rose-500/10 text-rose-600 border-rose-500/20",
                        di.severity === "moderate" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                        di.severity === "mild" && "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      )}>
                        {di.severity}
                      </Badge>
                      {di.description}
                    </div>
                  ))}
                </div>
              )}

              {selectedOrder.ptvResult.dosageWarnings.length > 0 && (
                <div className="rounded-lg bg-amber-500/10 p-3">
                  <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">Dosage Warnings</div>
                  {selectedOrder.ptvResult.dosageWarnings.map((w, i) => (
                    <div key={i} className="text-xs text-muted-foreground">{w}</div>
                  ))}
                </div>
              )}

              {selectedOrder.ptvResult.scheduleIssues.length > 0 && (
                <div className="rounded-lg bg-blue-500/10 p-3">
                  <div className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">Schedule Compliance</div>
                  {selectedOrder.ptvResult.scheduleIssues.map((s, i) => (
                    <div key={i} className="text-xs text-muted-foreground">{s}</div>
                  ))}
                </div>
              )}

              {selectedOrder.ptvResult.notes.length > 0 && (
                <div className="rounded-lg bg-emerald-500/10 p-3">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Assessment</div>
                  {selectedOrder.ptvResult.notes.map((n, i) => (
                    <div key={i} className="text-xs text-muted-foreground">{n}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="ptv-notes">Review Notes</Label>
            <Textarea id="ptv-notes" placeholder="Enter reason for flagging or rejecting…" value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} rows={3} />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
            {selectedOrder?.ptvStatus === "pending" && (
              <>
                <Button variant="outline" className="gap-1 text-orange-600 hover:bg-orange-500/10" onClick={confirmFlag}>
                  <AlertTriangle className="h-3 w-3" /> Flag Prescription
                </Button>
                <Button variant="destructive" className="gap-1" onClick={confirmReject}>
                  <X className="h-3 w-3" /> Reject Prescription
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
