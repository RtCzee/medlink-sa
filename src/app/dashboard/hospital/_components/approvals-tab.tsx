"use client";

import { useState } from "react";
import {
  UserCheck,
  Check,
  X,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ViewHeader, StatusPill } from "./shared";

type Approval = {
  id: string;
  name: string;
  role: string;
  credentials: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  references?: string[];
};

const MOCK_APPROVALS: Approval[] = [
  {
    id: "app1",
    name: "Dr. Thabo Nkosi",
    role: "Cardiologist",
    credentials: "HPCSA: MP0456789",
    submittedAt: "2 hours ago",
    status: "pending",
    references: ["Prof. J. Mokoena – Wits Cardiology", "Dr. L. Pereira – Groote Schuur"],
  },
  {
    id: "app2",
    name: "Dr. Aisha Patel",
    role: "Paediatrician",
    credentials: "HPCSA: MP0467890",
    submittedAt: "1 day ago",
    status: "pending",
  },
  {
    id: "app3",
    name: "Sister Nomvula Dlamini",
    role: "ICU Charge Nurse",
    credentials: "SANC: DN0543210",
    submittedAt: "3 hours ago",
    status: "pending",
    references: ["Sister T. Mokoena – Baragwanath ICU"],
  },
];

export default function ApprovalsTab() {
  const [approvals, setApprovals] = useState<Approval[]>(MOCK_APPROVALS);

  function approve(a: Approval) {
    setApprovals((prev) => prev.filter((x) => x.id !== a.id));
    toast.success(`Approved ${a.name}`, {
      description: `${a.credentials} is now active on MedLink SA.`,
    });
  }

  function reject(a: Approval) {
    setApprovals((prev) => prev.filter((x) => x.id !== a.id));
    toast.error(`Rejected ${a.name}`, {
      description: "They can re-apply after addressing verification issues.",
    });
  }

  const pending = approvals.filter((a) => a.status === "pending");

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Approvals"
        subtitle={`${pending.length} pending verification requests`}
        icon={UserCheck}
      />

      {pending.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-500/10">
            <ShieldCheck className="h-7 w-7 text-emerald-500" />
          </span>
          <h3 className="mt-4 font-display text-lg font-semibold">
            All caught up
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No pending verification requests at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((a) => (
            <div
              key={a.id}
              className="glass-panel p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-sm font-bold text-white">
                  {a.name
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-display text-sm font-semibold">
                      {a.name}
                    </h4>
                    <StatusPill tone="amber">Pending</StatusPill>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {a.role} · {a.credentials} · {a.submittedAt}
                  </div>
                </div>
              </div>

              {a.references && a.references.length > 0 && (
                <Accordion type="single" collapsible className="mt-3">
                  <AccordionItem value="refs" className="border-none">
                    <AccordionTrigger className="py-0 text-xs text-medical hover:text-medical/80">
                      {a.references.length} professional reference
                      {a.references.length > 1 ? "s" : ""}
                    </AccordionTrigger>
                    <AccordionContent className="pt-2">
                      <ul className="mt-1 space-y-1">
                        {a.references.map((r, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-muted-foreground"
                          >
                            <UserCheck className="mt-0.5 h-3 w-3 shrink-0 text-medical" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              )}

              <div className="mt-4 flex gap-2">
                <Button
                  onClick={() => approve(a)}
                  variant="default"
                  className="flex-1 gap-2 rounded-lg px-3 py-2"
                  aria-label={`Approve ${a.name}`}
                >
                  <Check className="h-4 w-4" />
                  Approve
                </Button>
                <Button
                  onClick={() => reject(a)}
                  variant="secondary"
                  className="flex-1 gap-2 rounded-lg border-rose-500/30 px-3 py-2 text-rose-500 hover:bg-rose-500/10"
                  aria-label={`Reject ${a.name}`}
                >
                  <X className="h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
