"use client";

import { Pill } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PATIENT_PRESCRIPTIONS } from "@/lib/data";
import { StatusPill, ViewHeader } from "./shared-utils";

export function PrescriptionsView({ goToTab }: { goToTab: (t: string) => void }) {
  return (
    <div>
      <ViewHeader title="Prescriptions" subtitle="View your active and past medication prescriptions."
        action={<Button onClick={() => goToTab("medicine")} className="h-9 rounded-xl px-3 text-xs font-semibold">Order medicine</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PATIENT_PRESCRIPTIONS.map((p) => (
          <div key={p.id} className="glass-panel p-5">
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-medical/10 text-medical">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">{p.medicine}</div>
                <div className="text-xs text-muted-foreground">{p.dosage}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Prescribed by {p.prescribedBy}</span>
              <StatusPill status={p.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
