"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  UserCheck,
  Mail,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { HOSPITAL_STAFF } from "@/lib/data";
import { ViewHeader, StatusPill } from "./shared";
import type { TabId } from "./types";

type StaffRow = {
  id: string;
  name: string;
  role: string;
  status: "on-duty" | "off-duty" | "pending";
  patients: number;
  verified: boolean;
};

export default function StaffTab({ setTab }: { setTab: (t: TabId) => void }) {
  const [staff, setStaff] = useState<StaffRow[]>(
    HOSPITAL_STAFF.map((s) => ({ ...s })) as StaffRow[]
  );
  const [filter, setFilter] = useState<"all" | "on-duty" | "off-duty" | "pending">(
    "all"
  );
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = staff.filter((s) => {
    if (filter !== "all" && s.status !== filter) return false;
    if (query && !s.name.toLowerCase().includes(query.toLowerCase()) && !s.role.toLowerCase().includes(query.toLowerCase()))
      return false;
    return true;
  });

  function toggleVerified(id: string) {
    setStaff((prev) =>
      prev.map((s) => (s.id === id ? { ...s, verified: !s.verified } : s))
    );
    const target = staff.find((s) => s.id === id);
    if (target) {
      toast.success(
        `${target.name} ${target.verified ? "un-verified" : "verified"}`
      );
    }
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Staff directory"
        subtitle={`${staff.length} clinicians on the roster`}
        icon={Users}
        action={
          <Button
            onClick={() => setAddOpen(true)}
            variant="default"
            className="gap-2 rounded-lg px-4 py-2"
            aria-label="Add staff member"
          >
            <Plus className="h-4 w-4" />
            Add staff
          </Button>
        }
      />

      {/* Filters */}
      <div className="glass-panel flex flex-wrap items-center gap-3 p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or role…"
            className="input-premium h-9 w-full pl-9 pr-3 text-sm"
            aria-label="Search staff"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {(["all", "on-duty", "off-duty", "pending"] as const).map((f) => (
            <Button
              key={f}
              onClick={() => setFilter(f)}
              variant="outline"
              size="sm"
              className={cn(
                "rounded-lg px-3 py-1.5 capitalize",
                filter === f
                  ? "border-medical bg-medical/10 text-medical"
                  : "text-muted-foreground hover:bg-foreground/5"
              )}
              aria-pressed={filter === f}
            >
              {f === "all" ? "All staff" : f.replace("-", " ")}
            </Button>
          ))}
        </div>
      </div>

      {/* Staff table */}
      <div className="glass-panel overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent">
              <TableHead className="pl-5">Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">Patients</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead className="pr-5 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((s) => (
              <TableRow
                key={s.id}
                className="border-border/40"
              >
                <TableCell className="pl-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-[0.7rem] font-bold text-white">
                      {s.name
                        .replace(/^(Dr\.|Nurse)\s*/, "")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div>
                      <div className="text-sm font-semibold">{s.name}</div>
                      <div className="text-xs text-muted-foreground">
                        ID {s.id.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{s.role}</TableCell>
                <TableCell>
                  {s.status === "on-duty" && (
                    <StatusPill tone="emerald">On-duty</StatusPill>
                  )}
                  {s.status === "off-duty" && (
                    <StatusPill tone="slate">Off-duty</StatusPill>
                  )}
                  {s.status === "pending" && (
                    <Button
                      onClick={() => setTab("approvals")}
                      variant="outline"
                      className="inline-flex gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-amber-500 hover:bg-amber-500/20"
                      aria-label="Pending verification — open approvals tab"
                    >
                      Pending · verify
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
                <TableCell className="text-center text-sm font-semibold">
                  {s.patients}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {s.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-500">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        HPCSA
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Unverified
                      </span>
                    )}
                    <Switch
                      checked={s.verified}
                      onCheckedChange={() => toggleVerified(s.id)}
                      aria-label={`Toggle verification for ${s.name}`}
                    />
                  </div>
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-md"
                    aria-label={`More actions for ${s.name}`}
                    onClick={() => toast.info(`${s.name} · ${s.role}`)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No staff match your filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <InviteStaffDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function InviteStaffDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("doctor");
  const [sending, setSending] = useState(false);

  function send() {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      onOpenChange(false);
      toast.success(`Invite sent to ${email}`, {
        description: `They'll appear under Approvals once they accept and submit their HPCSA/SANC number.`,
      });
      setEmail("");
      setRole("doctor");
    }, 800);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/15 text-medical">
              <UserCheck className="h-4 w-4" />
            </span>
            Invite a clinician
          </DialogTitle>
          <DialogDescription>
            Send an invitation to a doctor or nurse to join your hospital on
            MedLink SA. They'll need to verify their HPCSA or SANC number before
            practising.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dr.khumalo@hpcsa.co.za"
                className="input-premium pl-9"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="input-premium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="doctor">Doctor / Specialist</SelectItem>
                <SelectItem value="nurse">Nurse</SelectItem>
                <SelectItem value="intern">Medical intern</SelectItem>
                <SelectItem value="allied">Allied health</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-medical/30 bg-medical/5 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-semibold text-medical">
              <ShieldCheck className="h-3.5 w-3.5" />
              POPIA compliant
            </div>
            <p className="mt-1">
              Invite links expire after 7 days. New staff must complete identity
              verification before their account activates.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={send}
            disabled={sending}
            className="gap-2"
          >
            {sending ? (
              <>
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending…
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
