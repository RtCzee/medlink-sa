"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

import { TabBar } from "./_components/shared";
import type { TabId } from "./_components/types";

const OverviewTab = dynamic(
  () => import("./_components/overview-tab"),
  { ssr: false }
);
const BedsTab = dynamic(
  () => import("./_components/beds-tab"),
  { ssr: false }
);
const QueueTab = dynamic(
  () => import("./_components/queue-tab"),
  { ssr: false }
);
const StaffTab = dynamic(
  () => import("./_components/staff-tab"),
  { ssr: false }
);
const ApprovalsTab = dynamic(
  () => import("./_components/approvals-tab"),
  { ssr: false }
);
const DepartmentsTab = dynamic(
  () => import("./_components/departments-tab"),
  { ssr: false }
);
const SettingsTab = dynamic(
  () => import("./_components/settings-tab"),
  { ssr: false }
);

export default function HospitalDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-medical border-t-transparent" />
        </div>
      }
    >
      <HospitalDashboardInner />
      <SonnerToaster position="top-right" richColors closeButton />
    </Suspense>
  );
}

function HospitalDashboardInner() {
  const params = useSearchParams();
  const tabParam = (params.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  return (
    <DashboardLayout role="hospital">
      <div className="space-y-6">
        <TabBar tab={tab} setTab={setTab} />
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "overview" && <OverviewTab setTab={setTab} />}
            {tab === "beds" && <BedsTab />}
            {tab === "queue" && <QueueTab />}
            {tab === "staff" && <StaffTab setTab={setTab} />}
            {tab === "approvals" && <ApprovalsTab />}
            {tab === "departments" && <DepartmentsTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
