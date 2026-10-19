"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { toast, Toaster as SonnerToaster } from "sonner";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bell,
  Building2,
  Calendar,
  CalendarPlus,
  ChevronDown,
  ChevronRight,
  Clock,
  FileCheck,
  FileImage,
  FileText,
  Filter,
  FlaskConical,
  HeartPulse,
  Lock,
  LogOut,
  MessageSquare,
  Mic,
  MicOff,
  Phone,
  PhoneCall,
  PhoneOff,
  Pill,
  QrCode,
  Save,
  ScreenShare,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Trash2,
  Truck,
  Upload,
  Video,
  VideoOff,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import { PATIENT_APPOINTMENTS, PATIENT_VITALS } from "@/lib/data";
import type { AppointmentDto } from "@/lib/api/appointments";
import type { PractitionerDto } from "@/lib/api/directory";
import type { MedicalRecordDto } from "@/lib/api/medical-records";
import type { MedicineDto, MedicinePriceDto } from "@/lib/api/medicines";
import type { PrescriptionDetailDto, PrescriptionSummaryDto } from "@/lib/api/prescriptions";
import type { QueueDto, TicketDto } from "@/lib/api/queues";
import {
  ApiRequestError,
  apiFetch,
  formatPrice,
  priceLabel,
  sastParts,
  sastSlotToUtc,
  sessionExpiredUrl,
  useApi,
} from "@/lib/client/api";
import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

/* =========================================================================
   CONSTANTS
   ========================================================================= */

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
];


const LANGS = [
  { code: "en", label: "English" },
  { code: "zu", label: "isiZulu" },
  { code: "af", label: "Afrikaans" },
  { code: "st", label: "Sesotho" },
];

type Conversation = {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  messages: { from: "me" | "them"; text: string; time: string }[];
};

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    name: "Dr. Sipho Dlamini",
    role: "Cardiologist",
    avatar: "SD",
    lastMessage: "Your ECG looks normal. See you Thursday at 16:00.",
    time: "10:42",
    unread: 1,
    online: true,
    messages: [
      { from: "them", text: "Good morning Thandiwe. I've reviewed your latest BP readings.", time: "10:30" },
      { from: "me", text: "Thank you doctor. I was a bit concerned about the spike on Thursday.", time: "10:35" },
      { from: "them", text: "A single spike isn't alarming — your weekly average is 127/75, which is well controlled on the current dose.", time: "10:40" },
      { from: "them", text: "Your ECG looks normal. See you Thursday at 16:00.", time: "10:42" },
    ],
  },
  {
    id: "c2",
    name: "Clicks Pharmacy — Rosebank",
    role: "Pharmacy",
    avatar: "CL",
    lastMessage: "Your Glucophage refill is ready for pickup.",
    time: "Yesterday",
    unread: 0,
    online: true,
    messages: [
      { from: "them", text: "Hi Thandiwe, your Glucophage refill has been authorised by Dr. Dlamini.", time: "16:10" },
      { from: "me", text: "Great — can I collect after work?", time: "16:22" },
      { from: "them", text: "Yes, we're open until 21:00. Just quote order #CL-4821 at the counter.", time: "16:24" },
      { from: "them", text: "Your Glucophage refill is ready for pickup.", time: "16:25" },
    ],
  },
  {
    id: "c3",
    name: "Dr. Thandiwe Mokoena",
    role: "General Practitioner",
    avatar: "TM",
    lastMessage: "Please book a follow-up in 2 weeks.",
    time: "Mon",
    unread: 2,
    online: false,
    messages: [
      { from: "me", text: "Hi doctor, the Brufen you prescribed has helped with the knee pain.", time: "09:02" },
      { from: "them", text: "Good to hear. Any swelling returning in the evenings?", time: "09:15" },
      { from: "me", text: "A little, after long walks.", time: "09:18" },
      { from: "them", text: "Please book a follow-up in 2 weeks.", time: "09:20" },
    ],
  },
  {
    id: "c4",
    name: "Ampath Lab Results",
    role: "Lab bot",
    avatar: "AL",
    lastMessage: "Your HbA1c result is in. View it under Records.",
    time: "28 May",
    unread: 0,
    online: false,
    messages: [
      { from: "them", text: "Your blood panel from 28 May has been processed.", time: "14:00" },
      { from: "them", text: "HbA1c: 6.4% (normal range < 5.7%, prediabetes 5.7–6.4%).", time: "14:00" },
      { from: "them", text: "Your HbA1c result is in. View it under Records.", time: "14:01" },
    ],
  },
];

const VIDEO_PRESCRIPTIONS = [
  { name: "Glucophage 850mg", dose: "1 tab twice daily", qty: "60 tablets" },
  { name: "Aspegic 100mg", dose: "1 tab at night", qty: "30 tablets" },
];

const HEALTH_TIPS = [
  "Your average BP this week is 127/75 — well within target.",
  "30 minutes of brisk walking, 5× a week, lowers HbA1c by ~0.5%.",
  "Keep salt under 5g/day to support your blood pressure goals.",
];

/* =========================================================================
   HELPERS
   ========================================================================= */

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string }> = {
    confirmed: { cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", label: "Confirmed" },
    pending: { cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", label: "Pending" },
    cancelled: { cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30", label: "Cancelled" },
    active: { cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", label: "Active" },
    completed: { cls: "bg-foreground/10 text-muted-foreground border-border", label: "Completed" },
    waiting: { cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30", label: "Waiting" },
    called: { cls: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30", label: "Called" },
    serving: { cls: "bg-medical/15 text-medical border-medical/30", label: "Serving" },
    missed: { cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30", label: "Missed" },
    approved: { cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30", label: "Approved" },
    submitted: { cls: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30", label: "Submitted" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold", s.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </span>
  );
}

function GlassTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-semibold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

/* =========================================================================
   STAT CARD
   ========================================================================= */
function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = "medical",
  index = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  accent?: "medical" | "cyan" | "amber" | "emerald" | "rose";
  index?: number;
}) {
  const accentMap: Record<string, string> = {
    medical: "from-medical to-cyan-400",
    cyan: "from-cyan-400 to-teal-400",
    amber: "from-amber-400 to-orange-400",
    emerald: "from-emerald-400 to-teal-400",
    rose: "from-rose-400 to-pink-400",
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="stat-card group"
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg",
            accentMap[accent]
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="mt-3 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tracking-tight text-gradient">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

/* =========================================================================
   VIDEO CALL MODAL (Zoom/Meet-style full screen)
   ========================================================================= */
function VideoCallModal({
  appt,
  onClose,
}: {
  appt: { doctor: string; specialty: string; date: string; time: string } | null;
  onClose: () => void;
}) {
  const [seconds, setSeconds] = useState(0);
  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [panel, setPanel] = useState<"chat" | "rx" | null>("chat");
  const [chat, setChat] = useState<{ from: "me" | "them"; text: string }[]>([
    { from: "them", text: "Hello Thandiwe, can you hear me clearly?" },
    { from: "me", text: "Yes doctor, loud and clear." },
    { from: "them", text: "Good. Let's review your vitals from this week." },
  ]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (!appt) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [appt]);

  useEffect(() => {
    if (!appt) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [appt, onClose]);

  if (!appt) return null;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const sendChat = () => {
    if (!draft.trim()) return;
    setChat((c) => [...c, { from: "me", text: draft.trim() }]);
    setDraft("");
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex flex-col bg-[#05070d]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-medical to-cyan-400">
              <ShieldCheck className="h-4 w-4 text-white" />
            </span>
            <div>
              <div className="text-sm font-semibold text-white">{appt.doctor}</div>
              <div className="text-[0.7rem] text-white/60">{appt.specialty} · MedLink Telehealth</div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="chip border-white/10 bg-white/5 text-white/80">
              <span className="status-dot bg-emerald-400" style={{ background: "#34d399" }} /> Encrypted
            </span>
            <span className="hidden font-mono text-sm text-white sm:inline">{mm}:{ss}</span>
            <button
              onClick={onClose}
              className="grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="End call"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* Main video */}
          <div className="relative flex-1 bg-gradient-to-br from-medical/30 via-[#0a0e18] to-cyan-500/20">
            {/* Doctor video placeholder */}
            <div className="absolute inset-0 grid place-items-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <div className="relative">
                  <div className="absolute -inset-4 animate-pulse rounded-full bg-medical/20 blur-2xl" />
                  <Avatar className="relative h-28 w-28 border-4 border-white/20 sm:h-32 sm:w-32">
                    <AvatarFallback className="bg-gradient-to-br from-medical to-cyan-400 text-3xl font-bold text-white sm:text-4xl">
                      {appt.doctor.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="mt-4 text-center">
                  <div className="text-lg font-semibold text-white">{appt.doctor}</div>
                  <div className="text-sm text-white/60">{appt.specialty}</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Connected · HD
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Self-preview PIP */}
            <div className="absolute bottom-4 right-4 h-32 w-44 overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-cyan-500/30 to-medical/30 shadow-2xl sm:h-40 sm:w-56">
              <div className="grid h-full place-items-center">
                {camOff ? (
                  <div className="flex flex-col items-center text-white/80">
                    <VideoOff className="h-6 w-6" />
                    <span className="mt-1 text-[0.65rem]">Camera off</span>
                  </div>
                ) : (
                  <Avatar className="h-12 w-12 border-2 border-white/30">
                    <AvatarFallback className="bg-gradient-to-br from-amber-400 to-rose-400 text-sm font-bold text-white">
                      TM
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
              <div className="absolute bottom-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
                You
              </div>
            </div>

            {/* Controls */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-xl sm:gap-3 sm:px-4">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full transition",
                    muted ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  aria-label={muted ? "Unmute mic" : "Mute mic"}
                >
                  {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => setCamOff((v) => !v)}
                  className={cn(
                    "grid h-11 w-11 place-items-center rounded-full transition",
                    camOff ? "bg-rose-500 text-white" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  aria-label={camOff ? "Turn camera on" : "Turn camera off"}
                >
                  {camOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                </button>
                <button
                  className="hidden h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:grid"
                  aria-label="Screen share"
                >
                  <ScreenShare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPanel((p) => (p === "chat" ? null : "chat"))}
                  className={cn(
                    "relative grid h-11 w-11 place-items-center rounded-full transition",
                    panel === "chat" ? "bg-medical text-white" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  aria-label="Toggle chat"
                >
                  <MessageSquare className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPanel((p) => (p === "rx" ? null : "rx"))}
                  className={cn(
                    "hidden h-11 w-11 place-items-center rounded-full transition sm:grid",
                    panel === "rx" ? "bg-medical text-white" : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  aria-label="Toggle prescription"
                >
                  <FileText className="h-4 w-4" />
                </button>
                <div className="mx-1 h-6 w-px bg-white/15" />
                <button
                  onClick={onClose}
                  className="flex h-11 items-center gap-2 rounded-full bg-rose-500 px-4 font-medium text-white transition hover:bg-rose-600"
                  aria-label="End call"
                >
                  <PhoneOff className="h-4 w-4" />
                  <span className="hidden text-sm sm:inline">End</span>
                </button>
              </div>
            </div>
          </div>

          {/* Side panel */}
          {panel && (
            <motion.aside
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="flex w-full flex-col border-t border-white/10 bg-[#0a0e18] lg:w-80 lg:border-l lg:border-t-0"
            >
              <div className="flex items-center gap-1 border-b border-white/10 p-2">
                <button
                  onClick={() => setPanel("chat")}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-medium transition",
                    panel === "chat" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  Chat
                </button>
                <button
                  onClick={() => setPanel("rx")}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-medium transition",
                    panel === "rx" ? "bg-white/10 text-white" : "text-white/60 hover:text-white"
                  )}
                >
                  Prescription
                </button>
              </div>

              {panel === "chat" ? (
                <>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-3">
                      {chat.map((m, i) => (
                        <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                              m.from === "me"
                                ? "rounded-br-sm bg-medical text-white"
                                : "rounded-bl-sm bg-white/10 text-white"
                            )}
                          >
                            {m.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="border-t border-white/10 p-3">
                    <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2">
                      <input
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendChat()}
                        placeholder="Message your doctor…"
                        className="flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40"
                      />
                      <button
                        onClick={sendChat}
                        className="grid h-7 w-7 place-items-center rounded-lg bg-medical text-white"
                        aria-label="Send message"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <ScrollArea className="flex-1 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-medical" />
                    <span className="text-sm font-semibold text-white">Active prescription</span>
                  </div>
                  <div className="space-y-2">
                    {VIDEO_PRESCRIPTIONS.map((p) => (
                      <div key={p.name} className="rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        <div className="mt-0.5 text-xs text-white/60">{p.dose}</div>
                        <div className="mt-1 text-xs text-medical">{p.qty}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => toast.success("Prescription signed and sent to pharmacy", { description: "You'll be notified when it's ready." })}
                    className="btn-primary mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold"
                  >
                    <BadgeCheck className="h-4 w-4" /> Sign & send to pharmacy
                  </button>
                  <div className="mt-3 rounded-lg bg-white/5 p-3 text-[0.7rem] text-white/50">
                    Prescriptions are e-signed with the doctor's HPCSA number and routed directly to your chosen pharmacy via the MedLink network.
                  </div>
                </ScrollArea>
              )}
            </motion.aside>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* =========================================================================
   SECTION HEADER
   ========================================================================= */
/* =========================================================================
   LIVE API STATE (loading / empty / error / session expiry)
   ========================================================================= */
const PATIENT_HOME = "/dashboard/patient";

function ApiState({
  loading,
  error,
  empty,
  emptyText,
  onRetry,
}: {
  loading: boolean;
  error: ApiRequestError | null;
  empty: boolean;
  emptyText: string;
  onRetry: () => void;
}) {
  if (error?.isSessionExpired) {
    return (
      <div className="glass-panel flex flex-col items-center gap-3 p-8 text-center" role="alert">
        <Lock className="h-6 w-6 text-medical" />
        <div className="text-sm font-semibold">Your session has expired</div>
        <div className="text-xs text-muted-foreground">Sign in again to see your information.</div>
        <Link href={sessionExpiredUrl(PATIENT_HOME)} className="btn-primary rounded-xl px-4 py-2 text-sm font-medium">
          Sign in again
        </Link>
      </div>
    );
  }
  if (error) {
    return (
      <div className="glass-panel flex flex-col items-center gap-3 p-8 text-center" role="alert">
        <AlertCircle className="h-6 w-6 text-rose-500" />
        <div className="text-sm font-semibold">{error.message}</div>
        {error.requestId && <div className="text-[0.7rem] text-muted-foreground">Reference: {error.requestId}</div>}
        <Button variant="outline" size="sm" onClick={onRetry} className="rounded-lg">Try again</Button>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="glass-panel grid place-items-center p-10" aria-busy="true">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-medical border-t-transparent" />
      </div>
    );
  }
  if (empty) {
    return <div className="glass-panel p-10 text-center text-sm text-muted-foreground">{emptyText}</div>;
  }
  return null;
}

/** Shows a failed write: session expiry gets a sign-in link, anything else the server's message. */
function toastApiError(error: unknown, title: string) {
  const e = error instanceof ApiRequestError ? error : null;
  if (e?.isSessionExpired) {
    toast.error("Your session has expired", {
      description: "Sign in again to continue.",
      action: { label: "Sign in", onClick: () => window.location.assign(sessionExpiredUrl(PATIENT_HOME)) },
    });
    return;
  }
  toast.error(title, { description: e?.message ?? "Something went wrong. Please try again." });
}

function initials(name: string) {
  return name.replace(/^Dr\.?\s+/i, "").split(/\s+/).map((n) => n[0] ?? "").join("").slice(0, 2).toUpperCase();
}

function ViewHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="mb-6 flex flex-wrap items-end justify-between gap-4"
    >
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </motion.div>
  );
}

/* =========================================================================
   OVERVIEW VIEW
   ========================================================================= */
function OverviewView({ user, goToTab }: { user: any; goToTab: (t: string, extra?: Record<string, string>) => void }) {
  // "Upcoming" = from the moment the page opened; the API orders by scheduledAt ascending.
  const [openedAt] = useState(() => new Date().toISOString());
  const appts = useApi<AppointmentDto[]>(`/api/appointments?from=${encodeURIComponent(openedAt)}&pageSize=20`);
  const rx = useApi<PrescriptionSummaryDto[]>("/api/prescriptions?status=active&pageSize=1");
  const tickets = useApi<TicketDto[]>("/api/queue-tickets?status=waiting&pageSize=1");
  const records = useApi<MedicalRecordDto[]>("/api/medical-records?pageSize=3");
  const upcoming = (appts.data ?? []).filter((a) => a.status === "requested" || a.status === "confirmed").slice(0, 3);
  const nextAppt = upcoming[0];
  const nextWhen = nextAppt ? sastParts(nextAppt.scheduledAt) : null;
  const activeRx = rx.meta?.total;
  const ticket = tickets.data?.[0];
  const healthScore = 87;
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-muted-foreground">{greeting()},</div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-gradient sm:text-4xl">
              {user?.name?.split(" ")[0] ?? "Patient"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.identityVerified ? (
              <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <BadgeCheck className="h-3.5 w-3.5" /> ID verified
              </span>
            ) : null}
            <span className="chip">
              <HeartPulse className="h-3.5 w-3.5 text-medical" /> Health score {healthScore}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Verify banner */}
      {!user?.identityVerified && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => goToTab("verify")}
          className="flex w-full items-center gap-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-left transition hover:border-amber-500/50"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
            <Shield className="h-5 w-5" />
          </span>
          <div className="flex-1">
            <div className="font-semibold text-amber-700 dark:text-amber-300">Verify your SA ID</div>
            <div className="text-sm text-amber-600/80 dark:text-amber-400/80">
              Verified citizens get priority queue access and prescription privileges.
            </div>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        </motion.button>
      )}

      {/* Stat grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Calendar}
          label="Next appointment"
          value={appts.loading && !appts.data ? "…" : nextWhen ? `${nextWhen.date}` : "None"}
          sub={nextAppt && nextWhen ? `${nextWhen.time} SAST · ${nextAppt.practitionerName}` : appts.error ? "Couldn't load appointments" : "No upcoming appointments"}
          accent="medical"
          index={0}
        />
        <StatCard
          icon={Pill}
          label="Active prescriptions"
          value={activeRx === undefined ? (rx.error ? "—" : "…") : String(activeRx)}
          sub={rx.error ? "Couldn't load prescriptions" : "Issued to your account"}
          accent="cyan"
          index={1}
        />
        <StatCard
          icon={QrCode}
          label="Queue position"
          value={ticket ? `#${ticket.ticketNumber}` : tickets.loading && !tickets.data ? "…" : "—"}
          sub={ticket ? `${ticket.waitingAhead ?? 0} ahead · ${ticket.facilityName}` : tickets.error ? "Couldn't load your ticket" : "Not in a queue"}
          accent="amber"
          index={2}
        />
        <StatCard
          icon={HeartPulse}
          label="Health score"
          value={`${healthScore}/100`}
          sub="Up 3 from last week"
          accent="emerald"
          index={3}
        />
      </div>

      {/* Vitals + appointments */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Vitals this week</h3>
              <p className="text-xs text-muted-foreground">Sample data (vitals aren&apos;t recorded by MedLink yet)</p>
            </div>
            <div className="hidden items-center gap-3 sm:flex">
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-medical" /> BP
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-cyan-400" /> HR
              </span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> SpO₂
              </span>
            </div>
          </div>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PATIENT_VITALS} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="gBp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--medical)" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="var(--medical)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gHr" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gSpo2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="bp" name="BP (mmHg)" stroke="var(--medical)" strokeWidth={2} fill="url(#gBp)" />
                <Area type="monotone" dataKey="hr" name="HR (bpm)" stroke="#06b6d4" strokeWidth={2} fill="url(#gHr)" />
                <Area type="monotone" dataKey="spo2" name="SpO₂ (%)" stroke="#10b981" strokeWidth={2} fill="url(#gSpo2)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Upcoming appointments */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="glass-panel p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Upcoming</h3>
            <button onClick={() => goToTab("appointments")} className="text-xs font-medium text-medical hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-3">
            {upcoming.length === 0 && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                {appts.loading && !appts.data ? "Loading…" : appts.error ? appts.error.message : "No upcoming appointments."}
              </div>
            )}
            {upcoming.map((a) => {
              const when = sastParts(a.scheduledAt);
              return (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-medical/10 text-medical">
                    <Stethoscope className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{a.practitionerName}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {when.date} · {when.time} SAST · {a.specialty}
                    </div>
                  </div>
                  <StatusPill status={a.status === "requested" ? "pending" : a.status} />
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent records + order medicine */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Recent records</h3>
            <button onClick={() => goToTab("records")} className="text-xs font-medium text-medical hover:underline">
              View all
            </button>
          </div>
          <div className="space-y-2">
            {(records.data ?? []).length === 0 && (
              <div className="rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
                {records.loading && !records.data ? "Loading…" : records.error ? records.error.message : "No medical records yet."}
              </div>
            )}
            {(records.data ?? []).map((r) => {
              const Icon = recordIcon(r.category);
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-foreground/5 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[r.category, r.provider, r.recordedOn].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Order medicine quick action */}
        <motion.button
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, delay: 0.08 }}
          onClick={() => goToTab("medicine")}
          className="glass-panel group relative overflow-hidden p-5 text-left"
        >
          <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-medical/20 blur-3xl transition group-hover:bg-medical/30" />
          <div className="relative">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-medical to-cyan-400 text-white shadow-lg">
              <Truck className="h-6 w-6" />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold">Medicines</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Look up medicines and compare sample (demo) pharmacy prices.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-medical">
              Browse medicines
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </div>
          </div>
        </motion.button>
      </div>

      {/* Health tip */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="glass-panel flex items-center gap-4 p-5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-400 text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div>
          <div className="text-sm font-semibold">Today's health insight</div>
          <div className="text-sm text-muted-foreground">{HEALTH_TIPS[0]}</div>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
   APPOINTMENTS VIEW
   ========================================================================= */
function AppointmentsView() {
  const appts = useApi<AppointmentDto[]>("/api/appointments?pageSize=100");
  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduling, setRescheduling] = useState<AppointmentDto | null>(null);
  const [cancelling, setCancelling] = useState<AppointmentDto | null>(null);
  const [busy, setBusy] = useState(false);
  const list = appts.data ?? [];

  const cancel = async (a: AppointmentDto) => {
    setBusy(true);
    try {
      await apiFetch<AppointmentDto>(`/api/appointments/${a.id}/cancel`, { method: "POST", body: {} });
      toast.success("Appointment cancelled", { description: `${a.practitionerName} · ${sastParts(a.scheduledAt).date}` });
      appts.reload();
    } catch (error) {
      toastApiError(error, "Could not cancel the appointment");
    } finally {
      setBusy(false);
      setCancelling(null);
    }
  };

  return (
    <div>
      <ViewHeader
        title="Appointments"
        subtitle="Your appointment requests and visits. Times are South African time (SAST)."
        action={
          <Button onClick={() => setBookOpen(true)} className="btn-primary gap-2 rounded-xl">
            <CalendarPlus className="h-4 w-4" /> Book new
          </Button>
        }
      />

      {appts.error || appts.loading || list.length === 0 ? (
        <ApiState
          loading={appts.loading && !appts.data}
          error={appts.error}
          empty={list.length === 0}
          emptyText="You have no appointments yet. Use “Book new” to request one."
          onRetry={appts.reload}
        />
      ) : null}

      {list.length > 0 && !appts.error && (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-foreground/[0.02] text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Doctor</th>
                  <th className="px-4 py-3 font-semibold">Facility</th>
                  <th className="px-4 py-3 font-semibold">Date / time</th>
                  <th className="px-4 py-3 font-semibold">Reason</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a) => {
                  const when = sastParts(a.scheduledAt);
                  const open = a.status === "requested" || a.status === "confirmed";
                  return (
                    <tr key={a.id} className="border-b border-border/60 last:border-0 transition hover:bg-foreground/[0.02]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-gradient-to-br from-medical to-cyan-400 text-xs font-bold text-white">
                              {initials(a.practitionerName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold">{a.practitionerName}</div>
                            <div className="text-xs text-muted-foreground">{a.specialty}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{a.facilityName}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{when.date}</div>
                        <div className="text-xs text-muted-foreground">{when.time} SAST</div>
                      </td>
                      <td className="max-w-[220px] truncate px-4 py-3 text-muted-foreground">{a.reason ?? "—"}</td>
                      <td className="px-4 py-3"><StatusPill status={a.status === "requested" ? "pending" : a.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {a.status === "requested" && (
                            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setRescheduling(a)} className="rounded-lg">
                              Reschedule
                            </Button>
                          )}
                          {open && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={busy}
                              onClick={() => setCancelling(a)}
                              className="rounded-lg text-rose-500 hover:bg-rose-500/10"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AppointmentDialog
        key={rescheduling?.id ?? (bookOpen ? "book" : "closed")}
        open={bookOpen || !!rescheduling}
        appointment={rescheduling}
        onClose={() => {
          setBookOpen(false);
          setRescheduling(null);
        }}
        onSaved={appts.reload}
      />

      <AlertDialog open={!!cancelling} onOpenChange={(v) => !v && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelling ? `${cancelling.practitionerName} · ${sastParts(cancelling.scheduledAt).date} ${sastParts(cancelling.scheduledAt).time} SAST. This can't be undone.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Keep it</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => cancelling && cancel(cancelling)}>Cancel appointment</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** Book (appointment = null) or reschedule (appointment set) through the real API. */
function AppointmentDialog({
  open,
  appointment,
  onClose,
  onSaved,
}: {
  open: boolean;
  appointment: AppointmentDto | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const rescheduling = !!appointment;
  const practitioners = useApi<PractitionerDto[]>(open && !rescheduling ? "/api/practitioners?pageSize=100" : null);
  const [specialty, setSpecialty] = useState("");
  const [practitionerId, setPractitionerId] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const all = practitioners.data ?? [];
  const specialties = [...new Set(all.map((p) => p.specialty))].sort();
  const choices = all.filter((p) => !specialty || p.specialty === specialty);

  const submit = async () => {
    const scheduledAt = date && slot ? sastSlotToUtc(date, slot) : null;
    if ((!rescheduling && !practitionerId) || !scheduledAt) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      const { data } = rescheduling
        ? await apiFetch<AppointmentDto>(`/api/appointments/${appointment.id}`, { method: "PATCH", body: { scheduledAt } })
        : await apiFetch<AppointmentDto>("/api/appointments", {
            method: "POST",
            body: { practitionerId, scheduledAt, ...(reason.trim() ? { reason: reason.trim() } : {}) },
          });
      const when = sastParts(data.scheduledAt);
      toast.success(rescheduling ? "Appointment moved" : "Appointment requested", {
        description: `${data.practitionerName} at ${data.facilityName} on ${when.date}, ${when.time} SAST.`,
      });
      onSaved();
      onClose();
    } catch (error) {
      toastApiError(error, rescheduling ? "Could not reschedule" : "Could not book the appointment");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{rescheduling ? "Reschedule appointment" : "Book an appointment"}</DialogTitle>
          <DialogDescription>
            {rescheduling
              ? `${appointment.practitionerName} · ${appointment.facilityName}`
              : "Choose a practitioner and a time (SAST). The practice confirms your request."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!rescheduling && (
            <>
              {(practitioners.error || practitioners.loading || all.length === 0) && (
                <ApiState
                  loading={practitioners.loading}
                  error={practitioners.error}
                  empty={all.length === 0}
                  emptyText="No practitioners are listed yet, so appointments can't be booked."
                  onRetry={practitioners.reload}
                />
              )}
              {all.length > 0 && (
                <>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium">Specialty</Label>
                    <Select value={specialty || "all"} onValueChange={(v) => { setSpecialty(v === "all" ? "" : v); setPractitionerId(""); }}>
                      <SelectTrigger className="input-premium h-10"><SelectValue placeholder="Any specialty" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Any specialty</SelectItem>
                        {specialties.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-xs font-medium">Practitioner</Label>
                    <Select value={practitionerId} onValueChange={setPractitionerId}>
                      <SelectTrigger className="input-premium h-10"><SelectValue placeholder="Select a practitioner" /></SelectTrigger>
                      <SelectContent>
                        {choices.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.fullName} · {p.specialty}{p.facility ? ` · ${p.facility.name}` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <Label className="mb-1.5 block text-xs font-medium">{rescheduling ? "New date" : "Preferred date"}</Label>
            <CalendarUI
              mode="single"
              selected={date}
              onSelect={setDate}
              disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
              className="input-premium rounded-xl border p-2"
            />
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium">Time slot (SAST)</Label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {TIME_SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={cn(
                    "rounded-lg border py-2 text-sm font-medium transition",
                    slot === s ? "border-medical bg-medical text-white" : "border-border bg-card/40 hover:border-medical/50"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {!rescheduling && (
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Reason for visit (optional)</Label>
              <Textarea
                value={reason}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Briefly describe your symptoms or reason…"
                className="input-premium min-h-[80px] resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Close</Button>
          <Button onClick={submit} disabled={saving} className="btn-primary">
            {saving ? "Saving…" : rescheduling ? "Move appointment" : "Request appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* =========================================================================
   RECORDS VIEW
   ========================================================================= */
function recordIcon(category: string) {
  const c = category.toLowerCase();
  return c.includes("imag") || c.includes("x-ray") ? FileImage : c.includes("lab") ? FlaskConical : FileText;
}

function RecordsView() {
  const records = useApi<MedicalRecordDto[]>("/api/medical-records?pageSize=100");
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MedicalRecordDto | null>(null);

  const all = records.data ?? [];
  const filterChips = ["All", ...[...new Set(all.map((r) => r.category))].sort()];
  const needle = q.trim().toLowerCase();
  const filtered = all.filter((r) => {
    const matchFilter = filter === "All" || r.category === filter;
    const matchQ =
      !needle ||
      r.title.toLowerCase().includes(needle) ||
      (r.provider ?? "").toLowerCase().includes(needle) ||
      r.category.toLowerCase().includes(needle);
    return matchFilter && matchQ;
  });

  return (
    <div>
      <ViewHeader title="Medical records" subtitle="Records saved on your MedLink account. Only you can see them." />

      {records.error || records.loading || all.length === 0 ? (
        <ApiState
          loading={records.loading && !records.data}
          error={records.error}
          empty={all.length === 0}
          emptyText="No medical records on your account yet."
          onRetry={records.reload}
        />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="input-premium flex h-10 flex-1 items-center gap-2 px-3 sm:max-w-xs">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search records…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {filterChips.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilter(c)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    filter === c ? "border-medical bg-medical text-white" : "border-border bg-card/40 hover:border-medical/40"
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-foreground/[0.02] text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-semibold">Record</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold">Provider</th>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 text-right font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const Icon = recordIcon(r.category);
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="cursor-pointer border-b border-border/60 last:border-0 transition hover:bg-foreground/[0.02]"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="grid h-9 w-9 place-items-center rounded-lg bg-foreground/5 text-muted-foreground">
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="font-semibold">{r.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-medical/30 bg-medical/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-medical">
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.provider ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">{r.recordedOn}</td>
                        <td className="px-4 py-3 text-right">
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                        No records match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="glass-strong w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{selected.title}</SheetTitle>
                <SheetDescription>{selected.category} · {selected.recordedOn}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                {selected.provider && (
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-medical to-cyan-400 text-xs font-bold text-white">
                        {initials(selected.provider)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold">{selected.provider}</div>
                      <div className="text-xs text-muted-foreground">Provider (as recorded)</div>
                    </div>
                  </div>
                )}
                <div className="rounded-xl border border-border bg-card/40 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">{selected.notes ?? "No notes."}</p>
                </div>
                <div className="rounded-xl bg-medical/5 p-3 text-xs text-muted-foreground">
                  <Lock className="mr-1.5 inline h-3 w-3 text-medical" />
                  Visible only to you (enforced by the API and database row-level security).
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* =========================================================================
   PRESCRIPTIONS VIEW
   ========================================================================= */
function PrescriptionsView({ goToTab }: { goToTab: (t: string, extra?: Record<string, string>) => void }) {
  const list = useApi<PrescriptionSummaryDto[]>("/api/prescriptions?pageSize=100");
  const [openId, setOpenId] = useState<string | null>(null);
  const items = list.data ?? [];

  return (
    <div>
      <ViewHeader title="Prescriptions" subtitle="Prescriptions issued to you. Refill requests and dispensing are not available online yet." />

      {list.error || list.loading || items.length === 0 ? (
        <ApiState
          loading={list.loading && !list.data}
          error={list.error}
          empty={items.length === 0}
          emptyText="No prescriptions on your account yet."
          onRetry={list.reload}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.06 }}
              className="glass-panel flex flex-col p-5"
            >
              <div className="flex items-start justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-medical to-cyan-400 text-white shadow-lg">
                  <Pill className="h-5 w-5" />
                </span>
                <StatusPill status={p.status === "expired" ? "cancelled" : p.status} />
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">
                {p.itemCount} item{p.itemCount === 1 ? "" : "s"}
              </h3>
              {p.notes && <div className="mt-1 text-sm text-muted-foreground">{p.notes}</div>}

              <div className="my-4 hairline" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Prescribed by</span>
                  <span className="text-right font-medium">{p.practitioner?.fullName ?? "—"}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-muted-foreground">Facility</span>
                  <span className="text-right font-medium">{p.facility?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issued</span>
                  <span className="font-medium">{p.issuedOn}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium">{p.expiresOn ?? "—"}</span>
                </div>
              </div>

              {openId === p.id && <PrescriptionItems id={p.id} />}

              <div className="mt-5 flex flex-col gap-2">
                <Button variant="outline" onClick={() => setOpenId(openId === p.id ? null : p.id)} className="rounded-xl">
                  <FileText className="h-4 w-4" /> {openId === p.id ? "Hide items" : "View items"}
                </Button>
                <Button variant="outline" onClick={() => goToTab("medicine")} className="rounded-xl">
                  <Pill className="h-4 w-4" /> Look up medicines
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function PrescriptionItems({ id }: { id: string }) {
  const detail = useApi<PrescriptionDetailDto>(`/api/prescriptions/${id}`);
  const items = detail.data?.items ?? [];
  if (detail.error || detail.loading || items.length === 0) {
    return (
      <div className="mt-4">
        <ApiState loading={detail.loading} error={detail.error} empty={items.length === 0} emptyText="No items." onRetry={detail.reload} />
      </div>
    );
  }
  return (
    <ul className="mt-4 space-y-2">
      {items.map((it) => (
        <li key={it.id} className="rounded-xl border border-border bg-card/40 p-3 text-sm">
          <div className="font-semibold">{it.medicineName}</div>
          <div className="text-muted-foreground">{it.dosage}{it.quantity !== null ? ` · qty ${it.quantity}` : ""}</div>
          {it.instructions && <div className="text-xs text-muted-foreground">{it.instructions}</div>}
          <div className="text-xs text-muted-foreground">Refills: {it.refills}</div>
        </li>
      ))}
    </ul>
  );
}


/* =========================================================================
   MEDICINE MARKETPLACE VIEW
   ========================================================================= */
function MedicineView({ preselectId }: { preselectId?: string }) {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [rxOnly, setRxOnly] = useState<"all" | "true" | "false">("all");
  const [expanded, setExpanded] = useState<string | null>(preselectId ?? null);

  const params = new URLSearchParams({ pageSize: "100" });
  if (search.length >= 2) params.set("q", search);
  if (rxOnly !== "all") params.set("requiresPrescription", rxOnly);
  const medicines = useApi<MedicineDto[]>(`/api/medicines?${params.toString()}`);
  const list = medicines.data ?? [];

  return (
    <div>
      <ViewHeader
        title="Medicines"
        subtitle="Look up medicines and compare sample pharmacy prices. Online ordering isn't available yet."
      />

      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-700 dark:text-amber-300" role="note">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Demo prices.</strong> Prices shown here are sample data for this prototype, not current retail prices.
          Always confirm the price with the pharmacy.
        </span>
      </div>

      <form
        className="mb-4 flex flex-wrap items-center gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
      >
        <div className="input-premium flex h-10 flex-1 items-center gap-2 px-3 sm:max-w-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => setSearch(q.trim())}
            placeholder="Search medicines (2+ letters)…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={rxOnly} onValueChange={(v) => setRxOnly(v as "all" | "true" | "false")}>
            <SelectTrigger className="input-premium h-10 w-[190px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All medicines</SelectItem>
              <SelectItem value="true">Prescription only</SelectItem>
              <SelectItem value="false">Over the counter</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </form>

      {medicines.error || medicines.loading || list.length === 0 ? (
        <ApiState
          loading={medicines.loading && !medicines.data}
          error={medicines.error}
          empty={list.length === 0}
          emptyText="No medicines found. Try a different search."
          onRetry={medicines.reload}
        />
      ) : (
        <div className="space-y-3">
          {list.map((m, i) => {
            const isOpen = expanded === m.id;
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                className="glass-panel overflow-hidden"
              >
                <button onClick={() => setExpanded(isOpen ? null : m.id)} className="flex w-full items-center gap-4 p-4 text-left">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-medical to-cyan-400 text-white shadow-lg">
                    <Pill className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-display text-base font-semibold">{m.name}</span>
                      {m.strength && <span className="chip">{m.strength}</span>}
                      {m.requiresPrescription && (
                        <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <FileCheck className="h-3 w-3" /> Prescription required
                        </span>
                      )}
                      {m.source === "demo" && <span className="chip">Demo data</span>}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {[m.genericName, m.form, m.category].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition", isOpen && "rotate-180")} />
                </button>
                {isOpen && <MedicinePrices medicineId={m.id} />}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MedicinePrices({ medicineId }: { medicineId: string }) {
  const prices = useApi<MedicinePriceDto[]>(`/api/medicines/${medicineId}/prices?pageSize=100`);
  const rows = prices.data ?? [];
  return (
    <div className="border-t border-border/60 p-4">
      {prices.error || prices.loading || rows.length === 0 ? (
        <ApiState loading={prices.loading} error={prices.error} empty={rows.length === 0} emptyText="No prices listed for this medicine." onRetry={prices.reload} />
      ) : (
        <>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sample price comparison · {rows.length} entries
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 font-semibold">Pharmacy</th>
                  <th className="px-2 py-2 font-semibold">Price</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-border/40">
                    <td className="px-2 py-2.5 font-medium">{p.pharmacyName}</td>
                    <td className="px-2 py-2.5 font-semibold">{formatPrice(p.amount, p.currency)}</td>
                    <td className="px-2 py-2.5 text-xs text-muted-foreground">{priceLabel(p)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* =========================================================================
   VIDEO / TELEMEDICINE VIEW
   ========================================================================= */
function VideoView({ onStart }: { onStart: () => void }) {
  const videoAppts = PATIENT_APPOINTMENTS.filter((a) => a.type === "video");
  const past = [
    { id: "v1", doctor: "Dr. Sipho Dlamini", specialty: "Cardiology", date: "05 Jun 2025", duration: "18 min", summary: "Quarterly cardiac review. ECG normal." },
    { id: "v2", doctor: "Dr. Thandiwe Mokoena", specialty: "General Practice", date: "22 May 2025", duration: "12 min", summary: "Knee pain follow-up. Brufen prescribed." },
  ];

  return (
    <div>
      <ViewHeader title="Telemedicine" subtitle="Connect with your doctors from anywhere in South Africa." />

      {/* Start card */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onStart}
        className="glass-panel group relative mb-6 w-full overflow-hidden p-6 text-left"
      >
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-medical/20 blur-3xl transition group-hover:bg-medical/30" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-medical to-cyan-400 text-white shadow-xl">
            <Video className="h-7 w-7" />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-xl font-semibold">Start a video consult</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Connect instantly with an on-call GP. Average wait: 4 minutes. Encrypted end-to-end.
            </p>
          </div>
          <div className="btn-primary flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold">
            <PhoneCall className="h-4 w-4" /> Start now
          </div>
        </div>
      </motion.button>

      {/* Upcoming video */}
      <h3 className="mb-3 font-display text-lg font-semibold">Upcoming video consults</h3>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {videoAppts.map((a) => (
          <div key={a.id} className="glass-panel flex items-center gap-4 p-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-medical to-cyan-400 text-sm font-bold text-white">
                {a.doctor.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold">{a.doctor}</div>
              <div className="truncate text-xs text-muted-foreground">{a.specialty} · {a.date} {a.time}</div>
            </div>
            <Button size="sm" onClick={onStart} className="btn-primary gap-1.5 rounded-lg">
              <Video className="h-3.5 w-3.5" /> Join
            </Button>
          </div>
        ))}
      </div>

      {/* Past consults */}
      <h3 className="mb-3 font-display text-lg font-semibold">Past consults</h3>
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02] text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Summary</th>
              </tr>
            </thead>
            <tbody>
              {past.map((v) => (
                <tr key={v.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{v.doctor}</div>
                    <div className="text-xs text-muted-foreground">{v.specialty}</div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.date}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.duration}</td>
                  <td className="px-4 py-3 text-muted-foreground">{v.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   QUEUE VIEW
   ========================================================================= */
function QueueView() {
  const tickets = useApi<TicketDto[]>("/api/queue-tickets?status=waiting&pageSize=10");
  const called = useApi<TicketDto[]>("/api/queue-tickets?status=called&pageSize=10");
  const queues = useApi<QueueDto[]>("/api/queues?pageSize=100");
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState<TicketDto | null>(null);
  const active = [...(called.data ?? []), ...(tickets.data ?? [])];
  const ticket = active[0];
  const reloadTickets = () => {
    tickets.reload();
    called.reload();
  };

  // Ticket positions change as others are served: refresh every 30 s while a ticket is open.
  const ticketId = ticket?.id;
  const reloadWaiting = tickets.reload;
  const reloadCalled = called.reload;
  useEffect(() => {
    if (!ticketId) return;
    const t = setInterval(() => {
      reloadWaiting();
      reloadCalled();
    }, 30_000);
    return () => clearInterval(t);
  }, [ticketId, reloadWaiting, reloadCalled]);

  const join = async (q: QueueDto) => {
    setBusy(true);
    try {
      const { data } = await apiFetch<TicketDto>(`/api/queues/${q.id}/join`, { method: "POST", body: {} });
      toast.success(`You're number ${data.ticketNumber}`, {
        description: `${data.facilityName} · ${data.waitingAhead ?? 0} ahead of you.`,
      });
      reloadTickets();
    } catch (error) {
      toastApiError(error, "Could not join the queue");
    } finally {
      setBusy(false);
    }
  };

  const leave = async (t: TicketDto) => {
    setBusy(true);
    try {
      await apiFetch<TicketDto>(`/api/queue-tickets/${t.id}/leave`, { method: "POST", body: {} });
      toast.success("You left the queue", { description: t.facilityName });
      reloadTickets();
    } catch (error) {
      toastApiError(error, "Could not leave the queue");
    } finally {
      setBusy(false);
      setLeaving(null);
    }
  };

  const ticketsError = tickets.error ?? called.error;
  const ticketsLoading = (tickets.loading && !tickets.data) || (called.loading && !called.data);

  return (
    <div>
      <ViewHeader title="Queues" subtitle="Join a facility's queue for today and track your ticket." />

      {ticketsError || ticketsLoading ? (
        <ApiState loading={ticketsLoading} error={ticketsError} empty={false} emptyText="" onRetry={reloadTickets} />
      ) : ticket ? (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-panel relative mb-6 overflow-hidden p-6">
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-medical/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your number</div>
              <div className="font-display text-[7rem] font-bold leading-none text-gradient-medical sm:text-[9rem]">{ticket.ticketNumber}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill status={ticket.status} />
                {ticket.waitingAhead !== null && (
                  <span className="chip"><Clock className="h-3 w-3" /> {ticket.waitingAhead} ahead of you</span>
                )}
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" /> {ticket.facilityName}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Issued {sastParts(ticket.issuedAt).time} SAST · {ticket.serviceDate}
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <Button variant="outline" disabled={busy} onClick={() => setLeaving(ticket)} className="rounded-xl text-rose-500">
                Leave queue
              </Button>
              <Button variant="ghost" size="sm" onClick={reloadTickets} className="rounded-lg">Refresh</Button>
            </div>
          </div>
        </motion.div>
      ) : null}

      <h3 className="mb-3 font-display text-lg font-semibold">Facilities taking tickets today</h3>
      {queues.error || queues.loading || (queues.data ?? []).length === 0 ? (
        <ApiState
          loading={queues.loading && !queues.data}
          error={queues.error}
          empty={(queues.data ?? []).length === 0}
          emptyText="No facilities are taking queue tickets yet."
          onRetry={queues.reload}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {(queues.data ?? []).map((q) => {
            const mine = active.some((t) => t.facilityId === q.id);
            return (
              <div key={q.id} className="glass-panel flex items-center gap-4 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-medical/10 text-medical">
                  <Building2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{q.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{q.city}, {q.province} · {q.serviceDate}</div>
                </div>
                <Button size="sm" disabled={busy || mine} onClick={() => join(q)} className="btn-primary rounded-lg">
                  {mine ? "Joined" : "Join"}
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!leaving} onOpenChange={(v) => !v && setLeaving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave the queue?</AlertDialogTitle>
            <AlertDialogDescription>
              {leaving ? `You'll lose ticket ${leaving.ticketNumber} at ${leaving.facilityName}.` : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Stay</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={() => leaving && leave(leaving)}>Leave queue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* =========================================================================
   VERIFY ID VIEW
   ========================================================================= */
function VerifyView({ user, updateUser }: { user: any; updateUser: (p: any) => void }) {
  const isVerified = user?.identityVerified;
  const [status, setStatus] = useState<"approved" | "pending" | "submitted">(
    isVerified ? "approved" : "pending"
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [docType, setDocType] = useState("South African ID");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!fileName) {
      toast.error("Please upload a document first");
      return;
    }
    setStatus("submitted");
    toast.success("Documents received", {
      description: "SA citizens get priority access. You can still use services while pending.",
    });
  };

  return (
    <div>
      <ViewHeader title="Identity verification" subtitle="Verify your SA ID, passport or birth certificate for priority access." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-6"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className={cn(
              "grid h-12 w-12 place-items-center rounded-xl",
              status === "approved"
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : status === "submitted"
                ? "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400"
                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
            )}>
              {status === "approved" ? <BadgeCheck className="h-6 w-6" /> : <Shield className="h-6 w-6" />}
            </span>
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</div>
              <StatusPill status={status} />
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {status === "approved" && "Your identity has been verified against the Department of Home Affairs. You have priority queue access and full prescription privileges."}
            {status === "pending" && "We haven't verified your SA ID yet. Upload a document below to start verification — it usually takes 24–48 hours."}
            {status === "submitted" && "Documents received. SA citizens get priority access. You can still use services while pending."}
          </p>

          <div className="mt-4 rounded-xl border border-border bg-card/40 p-3 text-xs text-muted-foreground">
            <Lock className="mr-1.5 inline h-3 w-3 text-medical" />
            Your data is processed under POPIA. MedLink SA never shares your ID number with third parties. Documents are encrypted at rest and deleted after verification.
          </div>
        </motion.div>

        {/* Upload */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-panel p-6 lg:col-span-2"
        >
          <h3 className="font-display text-lg font-semibold">Upload document</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose your document type, then drop a clear photo or scan.
          </p>

          <div className="mt-4">
            <Label className="mb-1.5 block text-xs font-medium">Document type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="input-premium h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="South African ID">South African ID</SelectItem>
                <SelectItem value="Passport">Passport</SelectItem>
                <SelectItem value="Birth certificate">Birth certificate</SelectItem>
                <SelectItem value="Refugee / asylum permit">Refugee / asylum permit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFileName(f.name);
            }}
            className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/30 p-8 text-center transition hover:border-medical/50 hover:bg-medical/5"
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setFileName(f.name);
              }}
            />
            {fileName ? (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <FileCheck className="h-6 w-6" />
                </span>
                <div className="mt-3 text-sm font-semibold">{fileName}</div>
                <div className="text-xs text-muted-foreground">Click to replace</div>
              </>
            ) : (
              <>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-medical/10 text-medical">
                  <Upload className="h-6 w-6" />
                </span>
                <div className="mt-3 text-sm font-medium">Drop your file here, or click to browse</div>
                <div className="text-xs text-muted-foreground">JPG, PNG or PDF · max 10MB</div>
              </>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Button
              onClick={submit}
              disabled={status === "approved" || status === "submitted"}
              className="btn-primary gap-2 rounded-xl"
            >
              <ShieldCheck className="h-4 w-4" /> Submit for verification
            </Button>
            {status === "submitted" && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400">
                ✓ Submitted — verification in progress
              </span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <div className="text-xs text-muted-foreground">POPIA</div>
              <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Compliant</div>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <div className="text-xs text-muted-foreground">Encryption</div>
              <div className="text-sm font-semibold text-medical">AES-256</div>
            </div>
            <div className="rounded-xl border border-border bg-card/40 p-3">
              <div className="text-xs text-muted-foreground">Avg time</div>
              <div className="text-sm font-semibold">24–48h</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* =========================================================================
   MESSAGES VIEW
   ========================================================================= */
function MessagesView() {
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const active = CONVERSATIONS.find((c) => c.id === activeId)!;

  const send = () => {
    const text = drafts[activeId]?.trim();
    if (!text) return;
    toast.success("Message sent", { description: `To ${active.name}` });
    setDrafts({ ...drafts, [activeId]: "" });
  };

  return (
    <div>
      <ViewHeader title="Messages" subtitle="Secure messaging with your doctors, pharmacy and lab." />

      <div className="glass-panel grid h-[600px] grid-cols-1 overflow-hidden lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className="flex flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="border-b border-border p-3">
            <div className="input-premium flex h-9 items-center gap-2 px-3">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input placeholder="Search messages…" className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {CONVERSATIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-3 text-left transition",
                    activeId === c.id ? "bg-medical/10" : "hover:bg-foreground/[0.03]"
                  )}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={cn(
                        "text-xs font-bold text-white",
                        c.role === "Cardiologist" && "bg-gradient-to-br from-medical to-cyan-400",
                        c.role === "Pharmacy" && "bg-gradient-to-br from-emerald-400 to-teal-400",
                        c.role === "General Practitioner" && "bg-gradient-to-br from-violet-400 to-purple-400",
                        c.role === "Lab bot" && "bg-gradient-to-br from-amber-400 to-orange-400",
                      )}>
                        {c.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {c.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{c.name}</span>
                      <span className="shrink-0 text-[0.65rem] text-muted-foreground">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">{c.lastMessage}</span>
                      {c.unread > 0 && (
                        <span className="grid h-4 min-w-4 place-items-center rounded-full bg-medical px-1 text-[0.6rem] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-border p-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className={cn(
                "text-[0.65rem] font-bold text-white",
                active.role === "Cardiologist" && "bg-gradient-to-br from-medical to-cyan-400",
                active.role === "Pharmacy" && "bg-gradient-to-br from-emerald-400 to-teal-400",
                active.role === "General Practitioner" && "bg-gradient-to-br from-violet-400 to-purple-400",
                active.role === "Lab bot" && "bg-gradient-to-br from-amber-400 to-orange-400",
              )}>
                {active.avatar}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-semibold">{active.name}</div>
              <div className="text-[0.7rem] text-muted-foreground">
                {active.online ? "Online" : "Last seen recently"} · {active.role}
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-3 p-4">
              {active.messages.map((m, i) => (
                <div key={i} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                      m.from === "me"
                        ? "rounded-br-sm bg-medical text-white"
                        : "rounded-bl-sm border border-border bg-card/60"
                    )}
                  >
                    {m.text}
                    <div className={cn("mt-1 text-[0.65rem]", m.from === "me" ? "text-white/60" : "text-muted-foreground")}>
                      {m.time}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="border-t border-border p-3">
            <div className="flex items-center gap-2">
              <button className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-foreground/5" aria-label="Attach file">
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                value={drafts[activeId] ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [activeId]: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Write a message…"
                className="input-premium flex h-9 flex-1 items-center px-3 text-sm"
              />
              <button
                onClick={send}
                className="btn-primary grid h-9 w-9 place-items-center rounded-lg"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
function Paperclip() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

/* =========================================================================
   SETTINGS VIEW
   ========================================================================= */
function SettingsView({ user, updateUser, signOut }: { user: any; updateUser: (p: any) => void; signOut: () => void }) {
  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "+27 82 431 9920",
    language: "en",
    emergencyName: "Sipho Mokoena",
    emergencyPhone: "+27 83 555 0117",
    emergencyRelation: "Spouse",
  });
  const [notif, setNotif] = useState({
    appointments: true,
    prescriptions: true,
    queue: true,
    marketing: false,
  });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const save = () => {
    updateUser({ name: form.name, email: form.email });
    toast.success("Settings saved", { description: "Your changes have been applied." });
  };

  return (
    <div>
      <ViewHeader title="Settings" subtitle="Manage your account, preferences and notifications." />

      <div className="space-y-6">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Full name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-premium h-10" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Email</Label>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-premium h-10" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-premium h-10" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Language</Label>
              <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                <SelectTrigger className="input-premium h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGS.map((l) => <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Emergency contact */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-2">
            <Phone className="h-4 w-4 text-medical" />
            <h3 className="font-display text-lg font-semibold">Emergency contact</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Name</Label>
              <Input value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} className="input-premium h-10" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Phone</Label>
              <Input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} className="input-premium h-10" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Relationship</Label>
              <Select value={form.emergencyRelation} onValueChange={(v) => setForm({ ...form, emergencyRelation: v })}>
                <SelectTrigger className="input-premium h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spouse">Spouse</SelectItem>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Child">Child</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-medical" />
            <h3 className="font-display text-lg font-semibold">Notifications</h3>
          </div>
          <div className="space-y-3">
            {[
              { key: "appointments", label: "Appointment reminders", desc: "SMS and email 24h before each visit" },
              { key: "prescriptions", label: "Prescription updates", desc: "When scripts are signed or refills are ready" },
              { key: "queue", label: "Queue alerts", desc: "2 numbers before your turn is called" },
              { key: "marketing", label: "Health tips & promotions", desc: "Monthly wellness newsletter from MedLink" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-3">
                <div>
                  <div className="text-sm font-medium">{n.label}</div>
                  <div className="text-xs text-muted-foreground">{n.desc}</div>
                </div>
                <Switch
                  checked={(notif as any)[n.key]}
                  onCheckedChange={(v) => setNotif({ ...notif, [n.key]: v })}
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="flex flex-wrap items-center gap-3">
          <Button onClick={save} className="btn-primary gap-2 rounded-xl">
            <Save className="h-4 w-4" /> Save changes
          </Button>
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="gap-2 rounded-xl"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            onClick={() => setDeleteOpen(true)}
            className="gap-2 rounded-xl text-rose-500 hover:bg-rose-500/10"
          >
            <Trash2 className="h-4 w-4" /> Delete account
          </Button>
        </motion.div>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="glass-strong">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-500" /> Delete your account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your MedLink SA account, all medical records, prescriptions and message history. This action cannot be undone. Your data will be removed within 30 days under POPIA.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                toast.success("Account scheduled for deletion", { description: "You'll receive a confirmation email shortly." });
                setDeleteOpen(false);
              }}
              className="bg-rose-500 text-white hover:bg-rose-600"
            >
              Yes, delete my account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
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

  const renderTab = () => {
    switch (tab) {
      case "appointments":
        return <AppointmentsView />;
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
      {/* Sonner toaster mounted locally so toast() works on this page */}
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
