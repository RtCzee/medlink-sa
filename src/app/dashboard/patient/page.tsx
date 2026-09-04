"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster as SonnerToaster } from "sonner";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth-context";

import { OverviewView } from "./_components/overview-view";

const AppointmentsView = dynamic(() => import("./_components/appointments-view").then(m => m.AppointmentsView), { ssr: false });
const MedicineView = dynamic(() => import("./_components/medicine-view").then(m => m.MedicineView), { ssr: false });
const MessagesView = dynamic(() => import("./_components/messages-view").then(m => m.MessagesView), { ssr: false });
const PrescriptionsView = dynamic(() => import("./_components/prescriptions-view").then(m => m.PrescriptionsView), { ssr: false });
const QueueView = dynamic(() => import("./_components/queue-view").then(m => m.QueueView), { ssr: false });
const RecordsView = dynamic(() => import("./_components/records-view").then(m => m.RecordsView), { ssr: false });
const SettingsView = dynamic(() => import("./_components/settings-view").then(m => m.SettingsView), { ssr: false });
const VerifyView = dynamic(() => import("./_components/verify-view").then(m => m.VerifyView), { ssr: false });
const VideoView = dynamic(() => import("./_components/video-view").then(m => m.VideoView), { ssr: false });
const VideoCallModal = dynamic(() => import("./_components/video-call-modal").then(m => m.VideoCallModal), { ssr: false });

function PatientDashboardInner() {
  const { user, signOut, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "";
  const medicineId = searchParams.get("medicineId") ?? undefined;

  const [videoAppt, setVideoAppt] = useState<any>(null);

  const goToTab = (t: string, extra?: Record<string, string>) => {
    const params = new URLSearchParams();
    if (t) params.set("tab", t);
    if (extra) Object.entries(extra).forEach(([k, v]) => params.set(k, v));
    router.push(`/dashboard/patient?${params.toString()}`);
  };

  const startVideo = () => {
    setVideoAppt({
      doctor: "Dr. Sipho Dlamini",
      specialty: "Cardiology",
      date: "Now",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
  };

  const joinFromAppt = (a: { doctor: string; specialty: string; date: string; time: string }) => {
    setVideoAppt({
      doctor: a.doctor,
      specialty: a.specialty,
      date: a.date,
      time: a.time,
    });
  };

  const renderTab = () => {
    switch (tab) {
      case "appointments":
        return <AppointmentsView onJoinVideo={joinFromAppt} />;
      case "records":
        return <RecordsView />;
      case "prescriptions":
        return <PrescriptionsView goToTab={goToTab} />;
      case "medicine":
        return <MedicineView preselectId={medicineId} />;
      case "video":
        return <VideoView onStart={startVideo} />;
      case "queue":
        return <QueueView />;
      case "verify":
        return <VerifyView user={user} updateUser={updateUser} />;
      case "messages":
        return <MessagesView />;
      case "settings":
        return <SettingsView user={user} updateUser={updateUser} signOut={signOut} />;
      default:
        return <OverviewView user={user} goToTab={goToTab} />;
    }
  };

  return (
    <DashboardLayout role="patient">
      <SonnerToaster position="top-right" richColors closeButton />

      <AnimatePresence mode="wait">
        <motion.div
          key={tab || "overview"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>

      <VideoCallModal appt={videoAppt} onClose={() => setVideoAppt(null)} />
    </DashboardLayout>
  );
}

export default function PatientDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[100svh] place-items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-medical border-t-transparent" />
        </div>
      }
    >
      <PatientDashboardInner />
    </Suspense>
  );
}
