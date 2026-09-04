"use client";

/* =========================================================================
   MedLink SA — Admin Dashboard (Shell)
   Task ID: 10-ADMIN
   Thin orchestrator — tab routing, shared state, mutations.
   Tab views live in _components/*.tsx
   ========================================================================= */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Activity,
  Users,
  Building2,
  ShieldCheck,
  ScrollText,
  Server,
  Settings as SettingsIcon,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { ADMIN_USERS, ADMIN_HOSPITALS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";

import type { TabId, VerifiedStatus, AdminUser, AdminHospital, PendingDoctor, PendingPatient } from "./_components/types";
import { PENDING_DOCTORS, PENDING_PATIENTS } from "./_components/mock-data";

/* ---------- Dynamic imports (code-split per tab) ---------- */

const OverviewTab = dynamic(() => import("./_components/overview-tab").then((m) => m.OverviewTab), { loading: TabLoader });
const UsersTab = dynamic(() => import("./_components/users-tab").then((m) => m.UsersTab), { loading: TabLoader });
const HospitalsTab = dynamic(() => import("./_components/hospitals-tab").then((m) => m.HospitalsTab), { loading: TabLoader });
const VerificationsTab = dynamic(() => import("./_components/verifications-tab").then((m) => m.VerificationsTab), { loading: TabLoader });
const AuditTab = dynamic(() => import("./_components/audit-tab").then((m) => m.AuditTab), { loading: TabLoader });
const HealthTab = dynamic(() => import("./_components/health-tab").then((m) => m.HealthTab), { loading: TabLoader });
const SettingsTab = dynamic(() => import("./_components/settings-tab").then((m) => m.SettingsTab), { loading: TabLoader });

function TabLoader() {
  return (
    <div className="grid min-h-[40vh] place-items-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-medical border-t-transparent" />
    </div>
  );
}

/* ---------- Tab bar config ---------- */

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "users", label: "Users", icon: Users },
  { id: "hospitals", label: "Hospitals", icon: Building2 },
  { id: "verifications", label: "Verifications", icon: ShieldCheck },
  { id: "audit", label: "Audit log", icon: ScrollText },
  { id: "health", label: "System health", icon: Server },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

/* =========================================================================
   Page (Suspense wrapper)
   ========================================================================= */

export default function AdminDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-medical border-t-transparent" />
        </div>
      }
    >
      <AdminDashboardInner />
      <SonnerToaster position="top-right" richColors closeButton />
    </Suspense>
  );
}

/* =========================================================================
   Inner shell — state, mutations, tab routing
   ========================================================================= */

function AdminDashboardInner() {
  const params = useSearchParams();
  const tabParam = (params.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  /* ---- Mutable state ---- */

  const [users, setUsers] = useState<AdminUser[]>(
    ADMIN_USERS.map((u) => ({ ...u, role: u.role as AdminUser["role"], verified: u.verified as VerifiedStatus }))
  );
  const [hospitals, setHospitals] = useState<AdminHospital[]>(
    ADMIN_HOSPITALS.map((h) => ({
      ...h,
      ceo: h.id === "h4" ? "Dr. R. Pretorius" : h.id === "h5" ? "Dr. N. Mthethwa" : undefined,
      district: h.id === "h4" ? "Joburg Metro" : h.id === "h5" ? "eThekwini" : undefined,
    }))
  );
  const [pendingDoctors, setPendingDoctors] = useState<PendingDoctor[]>(PENDING_DOCTORS);
  const [pendingPatients, setPendingPatients] = useState<PendingPatient[]>(PENDING_PATIENTS);

  /* ---- Mutators ---- */

  const mutateUser = (id: string, patch: Partial<AdminUser>) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));

  const verifyHospital = (id: string) => {
    setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, verified: true } : h)));
    const h = hospitals.find((x) => x.id === id);
    toast.success("Hospital verified", {
      description: `${h?.name} can now approve their own doctors`,
    });
  };

  const revokeHospital = (id: string) => {
    setHospitals((prev) => prev.map((h) => (h.id === id ? { ...h, verified: false } : h)));
    const h = hospitals.find((x) => x.id === id);
    toast.error("Verification revoked", {
      description: `${h?.name} is now pending re-verification`,
    });
  };

  const approveDoctor = (id: string) => {
    const d = pendingDoctors.find((x) => x.id === id);
    setPendingDoctors((prev) => prev.filter((x) => x.id !== id));
    toast.success("Doctor approved", {
      description: `${d?.name} — ${d?.specialty} can now practise at ${d?.hospital}`,
    });
  };

  const rejectDoctor = (id: string) => {
    const d = pendingDoctors.find((x) => x.id === id);
    setPendingDoctors((prev) => prev.filter((x) => x.id !== id));
    toast.error("Doctor application rejected", { description: `${d?.name} notified by SMS` });
  };

  const approvePatient = (id: string) => {
    const p = pendingPatients.find((x) => x.id === id);
    setPendingPatients((prev) => prev.filter((x) => x.id !== id));
    toast.success("Patient ID verified", { description: `${p?.name} — ${p?.idType} check passed` });
  };

  const rejectPatient = (id: string) => {
    const p = pendingPatients.find((x) => x.id === id);
    setPendingPatients((prev) => prev.filter((x) => x.id !== id));
    toast.error("Patient ID check failed", { description: `${p?.name} asked to re-submit` });
  };

  /* ---- Render ---- */

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Tab bar */}
        <div className="glass-panel sticky top-20 z-20 flex gap-1 overflow-x-auto rounded-2xl p-1.5">
          {TABS.map((t) => {
            const active = tab === t.id;
            const Icon = t.icon;
            return (
              <Button
                key={t.id}
                onClick={() => setTab(t.id)}
                variant="ghost"
                aria-pressed={active}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative shrink-0 gap-2 rounded-xl px-3.5 py-2 text-sm font-medium sm:px-4",
                  active ? "text-medical-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="admin-tab-pill"
                    className="absolute inset-0 rounded-xl bg-gradient-to-br from-medical to-cyan-500 shadow-[0_6px_20px_var(--glow-1)]"
                    transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  />
                )}
                <Icon className="relative h-4 w-4" />
                <span className="relative hidden sm:inline">{t.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "overview" && (
              <OverviewTab
                users={users}
                hospitals={hospitals}
                pendingDoctors={pendingDoctors}
                pendingPatients={pendingPatients}
                setTab={setTab}
              />
            )}
            {tab === "users" && <UsersTab users={users} mutateUser={mutateUser} />}
            {tab === "hospitals" && (
              <HospitalsTab hospitals={hospitals} verifyHospital={verifyHospital} revokeHospital={revokeHospital} />
            )}
            {tab === "verifications" && (
              <VerificationsTab
                hospitals={hospitals}
                verifyHospital={verifyHospital}
                pendingDoctors={pendingDoctors}
                approveDoctor={approveDoctor}
                rejectDoctor={rejectDoctor}
                pendingPatients={pendingPatients}
                approvePatient={approvePatient}
                rejectPatient={rejectPatient}
              />
            )}
            {tab === "audit" && <AuditTab />}
            {tab === "health" && <HealthTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
