"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ShieldCheck,
  Stethoscope,
  Users,
  Building2,
  Check,
  X,
  Clock,
  FileText,
  IdCard,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, SectionHeader } from "./shared";
import type { AdminHospital, PendingDoctor, PendingPatient } from "./types";

/* ---------- sub-tab config ---------- */

type SubTab = "doctors" | "patients" | "hospitals";

const SUB_TABS: { id: SubTab; label: string; icon: typeof Stethoscope }[] = [
  { id: "doctors", label: "Doctors", icon: Stethoscope },
  { id: "patients", label: "Patients", icon: Users },
  { id: "hospitals", label: "Hospitals", icon: Building2 },
];

/* ---------- helpers ---------- */

function VerificationItem({
  icon: Icon,
  iconTint,
  title,
  subtitle,
  meta,
  onApprove,
  onReject,
  approveLabel = "Approve",
}: {
  icon: typeof Stethoscope;
  iconTint: string;
  title: string;
  subtitle: string;
  meta: string;
  onApprove: () => void;
  onReject: () => void;
  approveLabel?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="glass-panel flex items-center gap-4 rounded-xl p-4 transition-shadow hover:shadow-md hover:shadow-medical/5"
    >
      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white", iconTint)}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="hidden text-right text-xs text-muted-foreground sm:block">
        <Clock className="mr-1 inline h-3 w-3" />
        {meta}
      </div>
      <div className="flex shrink-0 gap-1.5">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1">
              <Check className="h-3.5 w-3.5" /> {approveLabel}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Approve {title}?</AlertDialogTitle>
              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onApprove} className="bg-emerald-600 hover:bg-emerald-700">
                Approve
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" variant="outline" className="gap-1">
              <X className="h-3.5 w-3.5" /> Reject
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reject {title}?</AlertDialogTitle>
              <AlertDialogDescription>This will permanently decline the request.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={onReject} className="bg-rose-600 hover:bg-rose-700">
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}

function EmptyQueue({ label }: { label: string }) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center rounded-xl py-12 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-medical/10 text-medical">
        <ShieldCheck className="h-6 w-6" />
      </div>
      <p className="text-sm font-medium">All clear</p>
      <p className="text-xs text-muted-foreground">No pending {label} to review.</p>
    </div>
  );
}

/* ---------- component ---------- */

interface VerificationsTabProps {
  hospitals: AdminHospital[];
  verifyHospital: (id: string) => void;
  pendingDoctors: PendingDoctor[];
  approveDoctor: (id: string) => void;
  rejectDoctor: (id: string) => void;
  pendingPatients: PendingPatient[];
  approvePatient: (id: string) => void;
  rejectPatient: (id: string) => void;
}

export function VerificationsTab({
  hospitals,
  verifyHospital,
  pendingDoctors,
  approveDoctor,
  rejectDoctor,
  pendingPatients,
  approvePatient,
  rejectPatient,
}: VerificationsTabProps) {
  const [sub, setSub] = useState<SubTab>("doctors");
  const pendingHospitals = hospitals.filter((h) => !h.verified);

  const counts: Record<SubTab, number> = {
    doctors: pendingDoctors.length,
    patients: pendingPatients.length,
    hospitals: pendingHospitals.length,
  };

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <SectionHeader
          kicker="Verification Queue"
          icon={ShieldCheck}
          title="Pending Approvals"
          subtitle="Review and approve doctor, patient and hospital registrations."
        />
      </motion.div>

      {/* Sub-tab pills */}
      <motion.div variants={fadeUp} className="flex gap-2">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const active = sub === t.id;
          const count = counts[t.id];
          return (
            <Button
              key={t.id}
              variant="ghost"
              size="sm"
              onClick={() => setSub(t.id)}
              className={cn(
                "rounded-full gap-2",
                active ? "bg-medical text-white hover:bg-medical/90" : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              {count > 0 && (
                <span
                  className={cn(
                    "ml-1 rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold leading-none",
                    active ? "bg-white/20" : "bg-medical/10 text-medical"
                  )}
                >
                  {count}
                </span>
              )}
            </Button>
          );
        })}
      </motion.div>

      {/* Queue content */}
      <AnimatePresence mode="wait">
        {sub === "doctors" && (
          <motion.div
            key="doctors"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {pendingDoctors.length === 0 ? (
              <EmptyQueue label="doctors" />
            ) : (
              pendingDoctors.map((d) => (
                <VerificationItem
                  key={d.id}
                  icon={Stethoscope}
                  iconTint="from-emerald-500 to-cyan-400"
                  title={d.name}
                  subtitle={`${d.specialty} · ${d.hpcsa} · ${d.hospital}`}
                  meta={d.submitted}
                  onApprove={() => {
                    approveDoctor(d.id);
                    toast.success(`${d.name} approved`);
                  }}
                  onReject={() => {
                    rejectDoctor(d.id);
                    toast.success(`${d.name} rejected`);
                  }}
                />
              ))
            )}
          </motion.div>
        )}

        {sub === "patients" && (
          <motion.div
            key="patients"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {pendingPatients.length === 0 ? (
              <EmptyQueue label="patients" />
            ) : (
              pendingPatients.map((p) => (
                <VerificationItem
                  key={p.id}
                  icon={IdCard}
                  iconTint="from-medical to-cyan-400"
                  title={p.name}
                  subtitle={`${p.idType} · ${p.hospital}`}
                  meta={p.submitted}
                  onApprove={() => {
                    approvePatient(p.id);
                    toast.success(`${p.name} approved`);
                  }}
                  onReject={() => {
                    rejectPatient(p.id);
                    toast.success(`${p.name} rejected`);
                  }}
                />
              ))
            )}
          </motion.div>
        )}

        {sub === "hospitals" && (
          <motion.div
            key="hospitals"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            {pendingHospitals.length === 0 ? (
              <EmptyQueue label="hospitals" />
            ) : (
              pendingHospitals.map((h) => (
                <VerificationItem
                  key={h.id}
                  icon={Building2}
                  iconTint="from-violet-500 to-medical"
                  title={h.name}
                  subtitle={`${h.province}${h.district ? `, ${h.district}` : ""}`}
                  meta={h.joined}
                  approveLabel="Verify"
                  onApprove={() => {
                    verifyHospital(h.id);
                    toast.success(`${h.name} verified`);
                  }}
                  onReject={() => toast.info("Revoke not available for pending hospitals")}
                />
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
