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
  ArrowUpRight,
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
  Package,
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
  ShoppingCart,
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
import {
  CURRENT_TICKET,
  FACILITIES,
  MEDICINES,
  PATIENT_APPOINTMENTS,
  PATIENT_PRESCRIPTIONS,
  PATIENT_RECORDS,
  PATIENT_VITALS,
  QUEUE_STATE,
  type Medicine,
} from "@/lib/data";
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
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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

const SPECIALTIES = [
  "General Practice",
  "Cardiology",
  "Dermatology",
  "Paediatrics",
  "Gynaecology",
  "Orthopaedics",
  "Psychiatry",
  "ENT",
];

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
];

const MED_CATEGORIES = [
  "All",
  "Pain & fever",
  "Antibiotic",
  "Diabetes",
  "Asthma",
  "Allergy",
  "Pain & inflammation",
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

function formatRand(n: number) {
  return "R" + n.toFixed(2);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function findMedicineForPrescription(name: string): Medicine | undefined {
  return MEDICINES.find((m) => name.toLowerCase().includes(m.name.toLowerCase()));
}

/* Decorative QR-style grid (NOT a real QR encoder — visual only) */
function QRTile({ size = 168 }: { size?: number }) {
  const N = 21;
  const cell = size / N;
  const isPos = (r: number, c: number) => {
    const corners = [[0, 0], [0, N - 7], [N - 7, 0]] as const;
    return corners.some(([cr, cc]) => r >= cr && r < cr + 7 && c >= cc && c < cc + 7);
  };
  const posFill = (r: number, c: number) => {
    const corners = [[0, 0], [0, N - 7], [N - 7, 0]] as const;
    for (const [cr, cc] of corners) {
      if (r >= cr && r < cr + 7 && c >= cc && c < cc + 7) {
        const lr = r - cr, lc = c - cc;
        const outer = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const inner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        return outer || inner;
      }
    }
    return false;
  };
  const cells: React.ReactElement[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      let fill: boolean;
      if (isPos(r, c)) fill = posFill(r, c);
      else {
        // deterministic pseudo-random
        const h = (r * 31 + c * 17 + (r * c) ^ 0xa5) % 100;
        fill = h < 47;
      }
      if (fill) {
        cells.push(
          <rect
            key={`${r}-${c}`}
            x={c * cell}
            y={r * cell}
            width={cell + 0.5}
            height={cell + 0.5}
            fill="currentColor"
          />
        );
      }
    }
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="text-foreground"
      role="img"
      aria-label="Queue ticket QR code"
    >
      <rect width={size} height={size} fill="#ffffff" rx="10" />
      {cells}
    </svg>
  );
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
  const nextAppt = PATIENT_APPOINTMENTS[0];
  const activeRx = PATIENT_PRESCRIPTIONS.filter((p) => p.status === "active").length;
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
          value={nextAppt.date === "Today" ? nextAppt.time : nextAppt.date}
          sub={`${nextAppt.doctor} · ${nextAppt.specialty}`}
          accent="medical"
          index={0}
        />
        <StatCard
          icon={Pill}
          label="Active prescriptions"
          value={String(activeRx)}
          sub="2 refills available"
          accent="cyan"
          index={1}
        />
        <StatCard
          icon={QrCode}
          label="Queue position"
          value={`#${CURRENT_TICKET.number}`}
          sub={`~${CURRENT_TICKET.estimatedWaitMin} min wait`}
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
              <p className="text-xs text-muted-foreground">Blood pressure, heart rate & SpO₂</p>
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
            {PATIENT_APPOINTMENTS.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-medical/10 text-medical">
                  {a.type === "video" ? <Video className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{a.doctor}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.date} · {a.time} · {a.specialty}
                  </div>
                </div>
                <StatusPill status={a.status} />
              </div>
            ))}
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
            {PATIENT_RECORDS.map((r) => {
              const Icon = r.type === "Imaging" ? FileImage : r.type === "Lab" ? FlaskConical : FileText;
              return (
                <div key={r.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/40 p-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-foreground/5 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{r.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.facility} · {r.doctor} · {r.date}
                    </div>
                  </div>
                  <StatusPill status={r.type === "Lab" ? "completed" : "completed"} />
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
            <h3 className="mt-4 font-display text-lg font-semibold">Order medicine</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Compare prices across Clicks, Dis-Chem, Rosebank Pharmacy & more. Delivery in 30 min.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-medical">
              Browse marketplace
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
function AppointmentsView({ onJoinVideo }: { onJoinVideo: (appt: any) => void }) {
  const [bookOpen, setBookOpen] = useState(false);
  const [form, setForm] = useState({
    specialty: "",
    facility: "",
    date: undefined as Date | undefined,
    slot: "",
    reason: "",
    type: "video" as "video" | "in-person",
  });

  const facilities = FACILITIES.filter((f) => f.category !== "pharmacy");

  const submit = () => {
    if (!form.specialty || !form.facility || !form.date || !form.slot) {
      toast.error("Please fill in all required fields");
      return;
    }
    toast.success("Appointment requested", {
      description: `${form.specialty} at ${form.facility} on ${form.date.toDateString()}, ${form.slot}.`,
    });
    setBookOpen(false);
    setForm({ specialty: "", facility: "", date: undefined, slot: "", reason: "", type: "video" });
  };

  return (
    <div>
      <ViewHeader
        title="Appointments"
        subtitle="Manage upcoming visits, join video consults, and book new appointments."
        action={
          <Button onClick={() => setBookOpen(true)} className="btn-primary gap-2 rounded-xl">
            <CalendarPlus className="h-4 w-4" /> Book new
          </Button>
        }
      />

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-foreground/[0.02] text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Facility</th>
                <th className="px-4 py-3 font-semibold">Date / time</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {PATIENT_APPOINTMENTS.map((a) => (
                <tr key={a.id} className="border-b border-border/60 last:border-0 transition hover:bg-foreground/[0.02]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-gradient-to-br from-medical to-cyan-400 text-xs font-bold text-white">
                          {a.doctor.replace("Dr. ", "").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-semibold">{a.doctor}</div>
                        <div className="text-xs text-muted-foreground">{a.specialty}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{a.facility}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{a.date}</div>
                    <div className="text-xs text-muted-foreground">{a.time}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold",
                      a.type === "video"
                        ? "border-medical/30 bg-medical/10 text-medical"
                        : "border-border bg-foreground/5 text-muted-foreground"
                    )}>
                      {a.type === "video" ? <Video className="h-3 w-3" /> : <Stethoscope className="h-3 w-3" />}
                      {a.type === "video" ? "Video" : "In-person"}
                    </span>
                  </td>
                  <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.type === "video" && (
                        <Button
                          size="sm"
                          onClick={() => onJoinVideo(a)}
                          className="btn-primary gap-1.5 rounded-lg px-3"
                        >
                          <Video className="h-3.5 w-3.5" /> Join
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("Reschedule request sent", { description: "The reception desk will call you to confirm." })}
                        className="rounded-lg"
                      >
                        Reschedule
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.error("Appointment cancelled", { description: "A confirmation SMS has been sent." })}
                        className="rounded-lg text-rose-500 hover:bg-rose-500/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book dialog */}
      <Dialog open={bookOpen} onOpenChange={setBookOpen}>
        <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Book an appointment</DialogTitle>
            <DialogDescription>Choose a specialty, facility and time that works for you.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Specialty</Label>
              <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                <SelectTrigger className="input-premium h-10"><SelectValue placeholder="Select a specialty" /></SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium">Facility</Label>
              <Select value={form.facility} onValueChange={(v) => setForm({ ...form, facility: v })}>
                <SelectTrigger className="input-premium h-10"><SelectValue placeholder="Select a facility" /></SelectTrigger>
                <SelectContent>
                  {facilities.map((f) => <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium">Preferred date</Label>
              <CalendarUI
                mode="single"
                selected={form.date}
                onSelect={(d) => setForm({ ...form, date: d })}
                disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                className="input-premium rounded-xl border p-2"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium">Time slot</Label>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {TIME_SLOTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setForm({ ...form, slot: s })}
                    className={cn(
                      "rounded-lg border py-2 text-sm font-medium transition",
                      form.slot === s
                        ? "border-medical bg-medical text-white"
                        : "border-border bg-card/40 hover:border-medical/50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium">Reason for visit</Label>
              <Textarea
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Briefly describe your symptoms or reason…"
                className="input-premium min-h-[80px] resize-none"
              />
            </div>

            <div>
              <Label className="mb-1.5 block text-xs font-medium">Consultation type</Label>
              <RadioGroup
                value={form.type}
                onValueChange={(v) => setForm({ ...form, type: v as any })}
                className="grid grid-cols-2 gap-2"
              >
                <label className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition", form.type === "video" ? "border-medical bg-medical/10" : "border-border")}>
                  <RadioGroupItem value="video" />
                  <Video className="h-4 w-4 text-medical" />
                  <span className="text-sm font-medium">Video</span>
                </label>
                <label className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition", form.type === "in-person" ? "border-medical bg-medical/10" : "border-border")}>
                  <RadioGroupItem value="in-person" />
                  <Stethoscope className="h-4 w-4 text-medical" />
                  <span className="text-sm font-medium">In-person</span>
                </label>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setBookOpen(false)}>Cancel</Button>
            <Button onClick={submit} className="btn-primary">Request appointment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* =========================================================================
   RECORDS VIEW
   ========================================================================= */
function RecordsView() {
  const [filter, setFilter] = useState("All");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<any>(null);

  const filtered = PATIENT_RECORDS.filter((r) => {
    const matchFilter = filter === "All" || r.type === filter.slice(0, -1) || (filter === "Consultations" && r.type === "Consultation");
    const matchQ = !q || r.title.toLowerCase().includes(q.toLowerCase()) || r.facility.toLowerCase().includes(q.toLowerCase()) || r.doctor.toLowerCase().includes(q.toLowerCase());
    return matchFilter && matchQ;
  });

  const filterChips = ["All", "Consultations", "Imaging", "Lab"];

  return (
    <div>
      <ViewHeader title="Medical records" subtitle="Your consultations, imaging and lab results — all in one place." />

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
                filter === c
                  ? "border-medical bg-medical text-white"
                  : "border-border bg-card/40 hover:border-medical/40"
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
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Facility</th>
                <th className="px-4 py-3 font-semibold">Doctor</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const Icon = r.type === "Imaging" ? FileImage : r.type === "Lab" ? FlaskConical : FileText;
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
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold",
                        r.type === "Imaging" ? "border-violet-500/30 bg-violet-500/10 text-violet-600 dark:text-violet-400"
                        : r.type === "Lab" ? "border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "border-medical/30 bg-medical/10 text-medical"
                      )}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{r.facility}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.doctor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                    <td className="px-4 py-3 text-right">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    No records match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail drawer */}
      <Sheet open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <SheetContent className="glass-strong w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{selected.title}</SheetTitle>
                <SheetDescription>{selected.facility} · {selected.date}</SheetDescription>
              </SheetHeader>
              <div className="space-y-4 px-4 pb-6">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-card/40 p-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-medical to-cyan-400 text-xs font-bold text-white">
                      {selected.doctor.replace("Dr. ", "").split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold">{selected.doctor}</div>
                    <div className="text-xs text-muted-foreground">Attending clinician</div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card/40 p-4">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {selected.type === "Consultation" && "Patient reports well-controlled hypertension on current regimen. No chest pain, dyspnoea or palpitations. BP 127/75, HR 73. ECG sinus rhythm, no ischaemic changes. Continue Glucophage 850mg BD; add Aspegic 100mg nocte for cardiovascular prophylaxis. Review in 3 months."}
                    {selected.type === "Imaging" && "PA chest radiograph. Lung fields clear. Cardiac silhouette within normal limits. No active consolidation, effusion or pneumothorax. Bony thorax unremarkable. Impression: normal study."}
                    {selected.type === "Lab" && "HbA1c 6.4% (prediabetes range). Fasting glucose 6.3 mmol/L. Lipid profile: total chol 4.8, LDL 2.9, HDL 1.4, TG 1.1. eGFR >90. Recommend lifestyle reinforcement and recheck in 6 months."}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="rounded-xl"><FileCheck className="h-4 w-4" /> Download PDF</Button>
                  <Button variant="outline" className="rounded-xl"><ShareIcon /> Share with doctor</Button>
                </div>

                <div className="rounded-xl bg-medical/5 p-3 text-xs text-muted-foreground">
                  <Lock className="mr-1.5 inline h-3 w-3 text-medical" />
                  Record sealed under POPIA. Audit-logged access only.
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
function ShareIcon() {
  return <ArrowUpRight className="h-4 w-4" />;
}

/* =========================================================================
   PRESCRIPTIONS VIEW
   ========================================================================= */
function PrescriptionsView({ goToTab }: { goToTab: (t: string, extra?: Record<string, string>) => void }) {
  return (
    <div>
      <ViewHeader title="Prescriptions" subtitle="Active and past prescriptions. Request refills or order from your nearest pharmacy." />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {PATIENT_PRESCRIPTIONS.map((p, i) => (
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
              <StatusPill status={p.status} />
            </div>
            <h3 className="mt-3 font-display text-lg font-semibold">{p.medicine}</h3>
            <div className="mt-1 text-sm text-muted-foreground">{p.dosage}</div>

            <div className="my-4 hairline" />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prescribed by</span>
                <span className="font-medium">{p.prescribedBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{p.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refills left</span>
                <span className={cn("font-semibold", p.refillsLeft > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500")}>
                  {p.refillsLeft}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button
                disabled={p.status !== "active" || p.refillsLeft === 0}
                onClick={() => toast.success("Refill requested", { description: `${p.medicine} — your pharmacy has been notified.` })}
                className="btn-primary gap-2 rounded-xl"
              >
                <RefreshIcon /> Request refill
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const med = findMedicineForPrescription(p.medicine);
                  goToTab("medicine", med ? { medicineId: med.id } : undefined);
                }}
                className="rounded-xl"
              >
                <Truck className="h-4 w-4" /> Order from pharmacy
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
function RefreshIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

/* =========================================================================
   MEDICINE MARKETPLACE VIEW
   ========================================================================= */
function OrderDialog({
  order,
  onClose,
}: {
  order: { medicine: Medicine; pharmacy: Medicine["prices"][number] } | null;
  onClose: () => void;
}) {
  const [qty, setQty] = useState(1);
  // Initial fulfillment depends on the pharmacy's delivery availability.
  // The component is keyed by medicine+pharmacy so it remounts per order.
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    order?.pharmacy.delivery ? "delivery" : "pickup"
  );
  const [address, setAddress] = useState("12 Oxford Road, Rosebank, Johannesburg, 2196");

  if (!order) return null;
  const { medicine, pharmacy } = order;
  const total = pharmacy.price * qty;
  const deliveryFee = fulfillment === "delivery" ? 25 : 0;
  const grand = total + deliveryFee;

  return (
    <Dialog open={!!order} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">Place order</DialogTitle>
          <DialogDescription>{medicine.name} · {medicine.strength} · {medicine.pack}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-border bg-card/40 p-3">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-medical/10 text-medical">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">{pharmacy.pharmacy}</div>
                <div className="text-xs text-muted-foreground">{pharmacy.distanceKm} km away</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gradient">{formatRand(pharmacy.price)}</div>
              <div className="text-[0.65rem] text-muted-foreground">per pack</div>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium">Quantity</Label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="grid h-10 w-10 place-items-center rounded-lg border border-border hover:border-medical/50"
                aria-label="Decrease quantity"
              >
                –
              </button>
              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-premium h-10 text-center"
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="grid h-10 w-10 place-items-center rounded-lg border border-border hover:border-medical/50"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block text-xs font-medium">Fulfillment</Label>
            <RadioGroup
              value={fulfillment}
              onValueChange={(v) => setFulfillment(v as any)}
              className="grid grid-cols-2 gap-2"
            >
              <label className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition", fulfillment === "delivery" ? "border-medical bg-medical/10" : "border-border")}>
                <RadioGroupItem value="delivery" disabled={!pharmacy.delivery} />
                <Truck className="h-4 w-4 text-medical" />
                <span className="text-sm font-medium">Delivery</span>
              </label>
              <label className={cn("flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition", fulfillment === "pickup" ? "border-medical bg-medical/10" : "border-border")}>
                <RadioGroupItem value="pickup" />
                <Package className="h-4 w-4 text-medical" />
                <span className="text-sm font-medium">Pickup</span>
              </label>
            </RadioGroup>
            {!pharmacy.delivery && (
              <div className="mt-1.5 text-[0.7rem] text-amber-600 dark:text-amber-400">
                This pharmacy doesn't offer delivery — pickup only.
              </div>
            )}
          </div>

          {fulfillment === "delivery" && (
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Delivery address</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="input-premium min-h-[64px] resize-none"
              />
              <div className="mt-1 text-[0.7rem] text-muted-foreground">Estimated delivery: 30–45 min</div>
            </div>
          )}

          {medicine.requiresPrescription && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
              <FileCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="text-xs">
                <div className="font-semibold">Prescription required</div>
                <div className="text-amber-600/80 dark:text-amber-400/80">
                  Schedule {medicine.schedule} medicine. Your active prescription from Dr. Dlamini will be auto-attached.
                </div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-border bg-card/40 p-3 text-sm">
            <div className="flex justify-between py-0.5">
              <span className="text-muted-foreground">Subtotal ({qty} × {formatRand(pharmacy.price)})</span>
              <span className="font-medium">{formatRand(total)}</span>
            </div>
            {fulfillment === "delivery" && (
              <div className="flex justify-between py-0.5">
                <span className="text-muted-foreground">Delivery fee</span>
                <span className="font-medium">{formatRand(deliveryFee)}</span>
              </div>
            )}
            <div className="mt-1.5 flex justify-between border-t border-border pt-1.5">
              <span className="font-semibold">Total</span>
              <span className="text-lg font-bold text-gradient">{formatRand(grand)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              toast.success("Order placed", {
                description: `${qty} × ${medicine.name} from ${pharmacy.pharmacy}. ${fulfillment === "delivery" ? "Delivery in 30–45 min." : "Ready for pickup in 15 min."}`,
              });
              onClose();
            }}
            className="btn-primary gap-2"
          >
            <ShoppingCart className="h-4 w-4" /> Place order · {formatRand(grand)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MedicineView({ preselectId }: { preselectId?: string }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<"price" | "distance" | "stock">("price");
  // preselectId is honored via initial state — the view remounts on tab change
  // (AnimatePresence key={tab}) so the preselected medicine auto-expands.
  const [expanded, setExpanded] = useState<string | null>(preselectId ?? null);
  const [order, setOrder] = useState<{ medicine: Medicine; pharmacy: Medicine["prices"][number] } | null>(null);

  const filtered = MEDICINES.filter((m) => {
    const matchQ = !q || m.name.toLowerCase().includes(q.toLowerCase()) || m.generic.toLowerCase().includes(q.toLowerCase());
    const matchCat = cat === "All" || m.category === cat;
    return matchQ && matchCat;
  });

  const sortPrices = (prices: Medicine["prices"]) => {
    const arr = [...prices];
    if (sort === "price") arr.sort((a, b) => a.price - b.price);
    else if (sort === "distance") arr.sort((a, b) => a.distanceKm - b.distanceKm);
    else if (sort === "stock") arr.sort((a, b) => Number(b.inStock) - Number(a.inStock));
    return arr;
  };

  return (
    <div>
      <ViewHeader
        title="Order medicine"
        subtitle="Compare prices across pharmacies and get delivery in 30 minutes."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="input-premium flex h-10 flex-1 items-center gap-2 px-3 sm:max-w-sm">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search medicines or generics…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={sort} onValueChange={(v) => setSort(v as any)}>
            <SelectTrigger className="input-premium h-10 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Sort: Lowest price</SelectItem>
              <SelectItem value="distance">Sort: Nearest</SelectItem>
              <SelectItem value="stock">Sort: In stock</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {MED_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              cat === c
                ? "border-medical bg-medical text-white"
                : "border-border bg-card/40 hover:border-medical/40"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((m, i) => {
          const isOpen = expanded === m.id;
          const prices = sortPrices(m.prices);
          const cheapest = [...m.prices].sort((a, b) => a.price - b.price)[0];
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.04 }}
              className="glass-panel overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : m.id)}
                className="flex w-full items-center gap-4 p-4 text-left"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-medical to-cyan-400 text-white shadow-lg">
                  <Pill className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-base font-semibold">{m.name}</span>
                    <span className="chip">{m.strength}</span>
                    {m.requiresPrescription && (
                      <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <FileCheck className="h-3 w-3" /> Rx · S{m.schedule}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {m.generic} · {m.form} · {m.pack} · {m.category}
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">From</div>
                  <div className="text-lg font-bold text-gradient">{formatRand(cheapest.price)}</div>
                </div>
                <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition", isOpen && "rotate-180")} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="border-t border-border/60 p-4">
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Price comparison · {prices.length} pharmacies
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-[0.7rem] uppercase tracking-wider text-muted-foreground">
                              <th className="px-2 py-2 font-semibold">Pharmacy</th>
                              <th className="px-2 py-2 font-semibold">Price</th>
                              <th className="px-2 py-2 font-semibold">Stock</th>
                              <th className="px-2 py-2 font-semibold">Delivery</th>
                              <th className="px-2 py-2 font-semibold">Distance</th>
                              <th className="px-2 py-2 text-right font-semibold"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {prices.map((p, idx) => (
                              <tr key={p.pharmacy} className="border-t border-border/40">
                                <td className="px-2 py-2.5">
                                  <div className="flex items-center gap-2">
                                    <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground/5 text-[0.6rem] font-bold text-muted-foreground">
                                      {p.pharmacy.slice(0, 2).toUpperCase()}
                                    </span>
                                    <span className="font-medium">{p.pharmacy}</span>
                                    {idx === 0 && sort === "price" && (
                                      <span className="chip border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                        <BadgeCheck className="h-3 w-3" /> Cheapest
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-2 py-2.5 font-semibold">{formatRand(p.price)}</td>
                                <td className="px-2 py-2.5">
                                  {p.inStock ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                      <span className="status-dot bg-emerald-400" style={{ background: "#34d399" }} /> In stock
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-rose-500">
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> Out
                                    </span>
                                  )}
                                </td>
                                <td className="px-2 py-2.5">
                                  {p.delivery ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-medical"><Truck className="h-3 w-3" /> Yes</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Pickup only</span>
                                  )}
                                </td>
                                <td className="px-2 py-2.5 text-muted-foreground">{p.distanceKm} km</td>
                                <td className="px-2 py-2.5 text-right">
                                  <Button
                                    size="sm"
                                    disabled={!p.inStock}
                                    onClick={() => setOrder({ medicine: m, pharmacy: p })}
                                    className="btn-primary gap-1.5 rounded-lg px-3"
                                  >
                                    <ShoppingCart className="h-3.5 w-3.5" /> Order
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-panel grid place-items-center p-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground" />
            <div className="mt-3 text-sm font-medium">No medicines found</div>
            <div className="text-xs text-muted-foreground">Try a different search or category.</div>
          </div>
        )}
      </div>

      <OrderDialog
        key={order ? order.medicine.id + order.pharmacy.pharmacy : "empty"}
        order={order}
        onClose={() => setOrder(null)}
      />
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
  const patientNo = CURRENT_TICKET.number;
  const [nowServing, setNowServing] = useState(QUEUE_STATE.nowServing);
  const [lastTick, setLastTick] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setNowServing((n) => {
        if (n >= patientNo - 1) return n;
        return n + 1;
      });
      setLastTick(Date.now());
    }, 8000);
    return () => clearInterval(t);
  }, [patientNo]);

  const ahead = Math.max(0, patientNo - nowServing - 1);
  const isNext = nowServing === patientNo - 1;
  const isCalled = nowServing >= patientNo;

  return (
    <div>
      <ViewHeader
        title="Your queue ticket"
        subtitle="Live queue at Rosebank Clinic. We'll SMS you when it's your turn."
        action={
          <Link href="/service" className="btn-outline flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium">
            Full queue board <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Big ticket */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel relative overflow-hidden p-6 lg:col-span-2"
        >
          <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-medical/20 blur-3xl" />
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your number
              </div>
              <div className="font-display text-[7rem] font-bold leading-none text-gradient-medical sm:text-[9rem]">
                {patientNo}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <StatusPill status={isCalled ? "serving" : isNext ? "called" : "waiting"} />
                <span className="chip"><Clock className="h-3 w-3" /> ~{CURRENT_TICKET.estimatedWaitMin} min wait</span>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" /> {CURRENT_TICKET.facility}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Stethoscope className="h-4 w-4" /> {CURRENT_TICKET.service}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" /> Issued {CURRENT_TICKET.issuedAt}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-border bg-white p-3">
                <QRTile size={168} />
              </div>
              <div className="text-center text-xs text-muted-foreground">
                Scan at the clinic kiosk<br />to confirm your arrival
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live queue state */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-panel p-5"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Live queue</h3>
            <span className="flex items-center gap-1.5 text-[0.7rem] text-muted-foreground">
              <span className="status-dot bg-emerald-400" style={{ background: "#34d399" }} /> Updated {Math.max(0, Math.floor((Date.now() - lastTick) / 1000))}s ago
            </span>
          </div>

          <div className="rounded-2xl border border-medical/20 bg-medical/5 p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Now serving</div>
            <div className="font-display text-5xl font-bold text-gradient">#{nowServing}</div>
            {isNext && (
              <div className="mt-2 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                You're next! Please proceed to the waiting area.
              </div>
            )}
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">People ahead</span>
              <span className="text-lg font-bold">{ahead}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg wait per person</span>
              <span className="text-lg font-bold">{QUEUE_STATE.avgWaitMin} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">In queue total</span>
              <span className="text-lg font-bold">{QUEUE_STATE.totalInQueue}</span>
            </div>
            <Progress value={((nowServing - (patientNo - QUEUE_STATE.totalAhead - 1)) / (QUEUE_STATE.totalAhead + 1)) * 100} className="h-2" />
          </div>
        </motion.div>
      </div>

      {/* Missed-turn rule */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.16 }}
        className="glass-panel mt-6 flex items-start gap-4 p-5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <AlertCircle className="h-5 w-5" />
        </span>
        <div>
          <div className="font-semibold">Missed your turn?</div>
          <p className="mt-1 text-sm text-muted-foreground">
            If you miss your number when called, speak to the reception desk — you'll be re-queued
            after the next <strong className="text-foreground">5 patients</strong>. This keeps the
            queue fair for everyone. You'll receive an SMS 2 numbers before yours, so you have time
            to reach the consulting room.
          </p>
        </div>
      </motion.div>
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
  const router = useRouter();
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
            onClick={() => {
              signOut();
              router.push("/");
            }}
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

  const joinFromAppt = (a: any) => {
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
