"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Building2,
  BedDouble,
  Stethoscope,
  MapPin,
  Check,
  X,
  ShieldCheck,
  Clock,
  Users,
  Globe,
  Link2,
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
import type { AdminHospital } from "./types";

/* ---------- local helpers ---------- */

function StatsRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function InfoTile({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="glass-panel flex items-center gap-2.5 rounded-lg px-3 py-2">
      <span className="grid h-7 w-7 place-items-center rounded-md bg-medical/10 text-medical">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-xs font-medium">{value}</div>
      </div>
    </div>
  );
}

/* ---------- component ---------- */

interface HospitalsTabProps {
  hospitals: AdminHospital[];
  verifyHospital: (id: string) => void;
  revokeHospital: (id: string) => void;
}

export function HospitalsTab({ hospitals, verifyHospital, revokeHospital }: HospitalsTabProps) {
  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <SectionHeader
          kicker="Hospital Registry"
          icon={Building2}
          title="All Hospitals"
          subtitle="View and manage registered healthcare facilities across South Africa."
        />
      </motion.div>

      {/* Trust chain explainer */}
      <motion.div variants={fadeUp} className="glass-panel flex items-start gap-3 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-medical/10 text-medical">
          <Link2 className="h-4 w-4" />
        </span>
        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Trust Chain Verification</p>
          <p>
            Each hospital must be verified before its doctors and patients can be onboarded.
            Verification confirms facility registration with the Department of Health and valid contact details.
          </p>
        </div>
      </motion.div>

      {/* Hospital grid */}
      <motion.div variants={fadeUp} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hospitals.map((h) => (
          <motion.div
            key={h.id}
            variants={fadeUp}
            className="glass-panel group relative overflow-hidden rounded-xl p-5 transition-shadow hover:shadow-lg hover:shadow-medical/5"
          >
            {/* Verified badge */}
            <div className="mb-3 flex items-start justify-between">
              <div className="space-y-0.5">
                <h3 className="font-display text-sm font-semibold">{h.name}</h3>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {h.province}{h.district ? `, ${h.district}` : ""}
                </div>
              </div>
              {h.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[0.65rem] font-medium text-amber-600 dark:text-amber-400">
                  <Clock className="h-3 w-3" /> Pending
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5">
              <StatsRow icon={BedDouble} label="Beds" value={h.beds.toLocaleString()} />
              <StatsRow icon={Stethoscope} label="Doctors" value={h.doctors} />
              <StatsRow icon={Users} label="Joined" value={h.joined} />
            </div>

            {/* Info tiles */}
            {h.ceo && (
              <div className="mb-3">
                <InfoTile icon={Users} label="CEO" value={h.ceo} />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
              {!h.verified ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                      <Check className="h-3.5 w-3.5" /> Verify
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Verify {h.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the hospital as verified and allow its doctors and patients to be onboarded.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          verifyHospital(h.id);
                          toast.success(`${h.name} verified`);
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        Verify Hospital
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <X className="h-3.5 w-3.5" /> Revoke
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Revoke verification for {h.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        The hospital will lose verified status. Its doctors and patients will be unable to onboard until re-verified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          revokeHospital(h.id);
                          toast.success(`${h.name} verification revoked`);
                        }}
                        className="bg-rose-600 hover:bg-rose-700"
                      >
                        Revoke
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
