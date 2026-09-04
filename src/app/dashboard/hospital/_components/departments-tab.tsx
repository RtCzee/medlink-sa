"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  ArrowRight,
  AlertTriangle,
  Stethoscope,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DEPARTMENTS } from "./mock-data";
import { ViewHeader, StatusPill } from "./shared";

export default function DepartmentsTab() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Departments"
        subtitle={`${DEPARTMENTS.length} clinical departments · last updated 2m ago`}
        icon={Building2}
        action={
          <Button
            onClick={() => setAddOpen(true)}
            variant="default"
            className="gap-2 rounded-lg px-4 py-2"
            aria-label="Add department"
          >
            <Plus className="h-4 w-4" />
            Add department
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DEPARTMENTS.map((d, i) => {
          const Icon = d.icon;
          return (
            <div
              key={d.id}
              className="glass-panel card-premium p-5"
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{
                    background: `color-mix(in oklab, ${d.color} 15%, transparent)`,
                    color: d.color,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {d.status === "critical" ? (
                  <StatusPill tone="rose">
                    <AlertTriangle className="h-3 w-3" />
                    Critical
                  </StatusPill>
                ) : (
                  <StatusPill tone="emerald">Active</StatusPill>
                )}
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">
                {d.name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Stethoscope className="h-3 w-3" />
                Head: <span className="font-medium text-foreground">{d.head}</span>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="font-display text-lg font-bold">
                    {d.beds}
                  </div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Beds
                  </div>
                </div>
                <div>
                  <div className="font-display text-lg font-bold">
                    {d.staff}
                  </div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Staff
                  </div>
                </div>
                <div>
                  <div className="font-display text-lg font-bold">
                    {d.patientsToday}
                  </div>
                  <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                    Today
                  </div>
                </div>
              </div>

              <Button
                onClick={() => toast.info(`Opening ${d.name} department view`)}
                variant="secondary"
                className="mt-4 w-full gap-2 rounded-lg px-3 py-2"
              >
                View department
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      <AddDepartmentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function AddDepartmentDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [head, setHead] = useState("");

  function submit() {
    if (!name.trim()) {
      toast.error("Department name is required");
      return;
    }
    onOpenChange(false);
    toast.success(`${name} department created`, {
      description: head ? `Head: ${head}` : "Assign a HoD from Staff.",
    });
    setName("");
    setHead("");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-strong max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/15 text-medical">
              <Building2 className="h-4 w-4" />
            </span>
            Add a department
          </DialogTitle>
          <DialogDescription>
            Register a new clinical department. You can assign a head of
            department and beds afterwards.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="dept-name">Department name</Label>
            <Input
              id="dept-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oncology"
              className="input-premium"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dept-head">Head of department (optional)</Label>
            <Input
              id="dept-head"
              value={head}
              onChange={(e) => setHead(e.target.value)}
              placeholder="e.g. Dr. M. Sithole"
              className="input-premium"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button variant="default" onClick={submit} className="gap-2">
            <Plus className="h-4 w-4" />
            Create department
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
