"use client";

/* =========================================================================
   MedLink SA — Doctor Dashboard
   Task ID: 7-DOCTOR
   ========================================================================= */

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Activity,
  Calendar,
  Users,
  FileText,
  Pill,
  Video,
  MessageSquare,
  Settings,
  Stethoscope,
  HeartPulse,
  Clock,
  MapPin,
  ShieldCheck,
  Check,
  X,
  Plus,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  ChevronDown,
  AlertTriangle,
  ArrowUpRight,
  PhoneOff,
  Mic,
  MicOff,
  VideoOff,
  ScreenShare,
  Send,
  MoreVertical,
  User,
  CalendarClock,
  FileSignature,
  Languages,
  BellRing,
  Edit3,
  Printer,
  Pill as PillIcon,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Phone,
  Sparkles,
  Dot,
  CheckCircle2,
  Circle,
  CircleDot,
  Lock,
  IdCard,
} from "lucide-react";

import DashboardLayout from "@/components/layout/dashboard-layout";
import { useAuth } from "@/lib/auth-context";
import {
  DOCTOR_SCHEDULE,
  DOCTOR_HIGH_RISK,
  PATIENT_RECORDS,
  PATIENT_VITALS,
  NETWORK_ACTIVITY,
  MEDICINES,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

/* -------------------------------------------------------------------------
   Types
   ------------------------------------------------------------------------- */

type TabId =
  | "overview"
  | "schedule"
  | "patients"
  | "prescriptions"
  | "video"
  | "notes"
  | "messages"
  | "settings";

type ApptStatus = "checked-in" | "upcoming" | "completed" | "no-show";
type ApptType = "video" | "in-person";
type Risk = "low" | "moderate" | "high" | "critical";

type ScheduleItem = {
  id: string;
  patient: string;
  age: number;
  reason: string;
  time: string;
  duration: number;
  type: ApptType;
  status: ApptStatus;
};

type Patient = {
  id: string;
  name: string;
  initials: string;
  age: number;
  gender: "M" | "F";
  condition: string;
  lastVisit: string;
  risk: Risk;
  status: "active" | "stable" | "monitoring" | "new";
  phone: string;
  province: string;
};

type Prescription = {
  id: string;
  patient: string;
  medicine: string;
  strength: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  refills: number;
  status: "sent" | "pending" | "dispensed";
  time: string;
};

type ClinicalNote = {
  id: string;
  patient: string;
  date: string;
  chief: string;
  history: string;
  exam: string;
  assessment: string;
  plan: string;
  icd10: string;
  author: string;
};

type Conversation = {
  id: string;
  name: string;
  initials: string;
  role: "patient" | "staff";
  preview: string;
  time: string;
  unread: number;
  online: boolean;
  messages: { id: string; from: "me" | "them"; text: string; time: string }[];
};

type VideoConsult = {
  id: string;
  patient: string;
  initials: string;
  reason: string;
  scheduled: string;
  duration: string;
  status: "upcoming" | "live" | "completed" | "missed";
};

/* -------------------------------------------------------------------------
   Mock data (realistic SA names & context)
   ------------------------------------------------------------------------- */

const EXTRA_SCHEDULE: ScheduleItem[] = [
  {
    id: "s5",
    patient: "Lerato K.",
    age: 34,
    reason: "Asthma review — Ventolin refill",
    time: "12:00",
    duration: 20,
    type: "in-person",
    status: "upcoming",
  },
  {
    id: "s6",
    patient: "Pieter J.",
    age: 67,
    reason: "AFib — medication titration",
    time: "13:30",
    duration: 30,
    type: "video",
    status: "upcoming",
  },
  {
    id: "s7",
    patient: "Naledi M.",
    age: 29,
    reason: "Pre-anaesthetic assessment",
    time: "14:15",
    duration: 25,
    type: "in-person",
    status: "upcoming",
  },
  {
    id: "s8",
    patient: "Yusuf A.",
    age: 54,
    reason: "Hyperlipidaemia follow-up",
    time: "15:00",
    duration: 20,
    type: "video",
    status: "upcoming",
  },
  {
    id: "s9",
    patient: "Bongani Z.",
    age: 41,
    reason: "Headache workup",
    time: "07:30",
    duration: 30,
    type: "in-person",
    status: "completed",
  },
  {
    id: "s10",
    patient: "Fatima K.",
    age: 38,
    reason: "Thyroid — levothyroxine review",
    time: "08:15",
    duration: 20,
    type: "in-person",
    status: "completed",
  },
];

const SCHEDULE: ScheduleItem[] = [
  ...DOCTOR_SCHEDULE.map((s) => s as ScheduleItem),
  ...EXTRA_SCHEDULE,
];

const PATIENTS: Patient[] = [
  { id: "p1", name: "Thandiwe Mokoena", initials: "TM", age: 47, gender: "F", condition: "Hypertension · Stage 2", lastVisit: "12 Jun", risk: "critical", status: "monitoring", phone: "+27 82 412 8890", province: "Gauteng" },
  { id: "p2", name: "Sipho Dlamini", initials: "SD", age: 58, gender: "M", condition: "Post-op cardiac", lastVisit: "10 Jun", risk: "high", status: "monitoring", phone: "+27 71 990 2211", province: "Gauteng" },
  { id: "p3", name: "Aisha Patel", initials: "AP", age: 52, gender: "F", condition: "Diabetes T2", lastVisit: "08 Jun", risk: "moderate", status: "active", phone: "+27 83 552 7710", province: "Gauteng" },
  { id: "p4", name: "Johan van der Merwe", initials: "JV", age: 61, gender: "M", condition: "Coronary artery disease", lastVisit: "05 Jun", risk: "high", status: "stable", phone: "+27 76 332 1190", province: "Western Cape" },
  { id: "p5", name: "Lerato Khumalo", initials: "LK", age: 34, gender: "F", condition: "Asthma · moderate persistent", lastVisit: "01 Jun", risk: "low", status: "stable", phone: "+27 79 884 5521", province: "KwaZulu-Natal" },
  { id: "p6", name: "Pieter Joubert", initials: "PJ", age: 67, gender: "M", condition: "Atrial fibrillation", lastVisit: "28 May", risk: "high", status: "monitoring", phone: "+27 82 119 8842", province: "Gauteng" },
  { id: "p7", name: "Naledi Mthembu", initials: "NM", age: 29, gender: "F", condition: "Pre-op clearance", lastVisit: "26 May", risk: "low", status: "new", phone: "+27 84 220 9981", province: "Eastern Cape" },
  { id: "p8", name: "Yusuf Adams", initials: "YA", age: 54, gender: "M", condition: "Hyperlipidaemia", lastVisit: "22 May", risk: "moderate", status: "stable", phone: "+27 73 991 2200", province: "Western Cape" },
  { id: "p9", name: "Fatima Khan", initials: "FK", age: 38, gender: "F", condition: "Hypothyroidism", lastVisit: "20 May", risk: "low", status: "stable", phone: "+27 81 445 6670", province: "Gauteng" },
  { id: "p10", name: "Bongani Zulu", initials: "BZ", age: 41, gender: "M", condition: "Chronic tension headache", lastVisit: "18 May", risk: "moderate", status: "active", phone: "+27 78 220 1199", province: "KwaZulu-Natal" },
  { id: "p11", name: "Annelize Botha", initials: "AB", age: 49, gender: "F", condition: "Migraine with aura", lastVisit: "15 May", risk: "moderate", status: "stable", phone: "+27 72 990 1170", province: "Free State" },
  { id: "p12", name: "Kagiso Sithole", initials: "KS", age: 36, gender: "M", condition: "Gout · recurrent", lastVisit: "12 May", risk: "low", status: "stable", phone: "+27 83 117 2204", province: "Mpumalanga" },
];

const TODAY_PRESCRIPTIONS: Prescription[] = [
  { id: "rx1", patient: "Thandiwe Mokoena", medicine: "Amlodipine", strength: "10mg", dosage: "1 tablet", frequency: "Once daily", duration: "30 days", quantity: 30, refills: 3, status: "sent", time: "09:12" },
  { id: "rx2", patient: "Sipho Dlamini", medicine: "Augmentin", strength: "875mg/125mg", dosage: "1 tablet", frequency: "Twice daily", duration: "7 days", quantity: 14, refills: 0, status: "dispensed", time: "09:48" },
  { id: "rx3", patient: "Aisha Patel", medicine: "Glucophage", strength: "850mg", dosage: "1 tablet", frequency: "Twice daily", duration: "90 days", quantity: 60, refills: 2, status: "pending", time: "10:34" },
  { id: "rx4", patient: "Lerato Khumalo", medicine: "Ventolin", strength: "100mcg", dosage: "2 puffs", frequency: "As needed", duration: "ongoing", quantity: 1, refills: 2, status: "sent", time: "12:05" },
  { id: "rx5", patient: "Pieter Joubert", medicine: "Warfarin", strength: "5mg", dosage: "1 tablet", frequency: "Once daily (PM)", duration: "30 days", quantity: 30, refills: 6, status: "sent", time: "13:42" },
];

const RECENT_PRESCRIBED = [
  { medicine: "Amlodipine", strength: "10mg", frequency: "Once daily" },
  { medicine: "Glucophage", strength: "850mg", frequency: "Twice daily" },
  { medicine: "Augmentin", strength: "875mg/125mg", frequency: "Twice daily" },
  { medicine: "Ventolin", strength: "100mcg", frequency: "2 puffs PRN" },
  { medicine: "Brufen", strength: "400mg", frequency: "Three times daily" },
];

const CLINICAL_NOTES: ClinicalNote[] = [
  {
    id: "n1",
    patient: "Thandiwe Mokoena",
    date: "12 Jun 2025 · 09:08",
    chief: "Hypertension follow-up — persistent home BP 150s/90s.",
    history: "57yo F, known HTN ×6 yrs, on Amlodipine 10mg OD. Reports adherence. No chest pain, SOB, palpitations. Diet high in salt.",
    exam: "BP 154/96 (R arm, seated), HR 78, BMI 31.2. Heart S1S2 normal, no murmurs. Lungs clear. No pedal oedema.",
    assessment: "Uncontrolled stage 2 hypertension despite max CCB. Likely salt-sensitive + obesity contribution.",
    plan: "1. Add Indapamide 1.5mg OD. 2. Reinforce DASH diet, refer to dietitian. 3. Home BP log ×2 weeks. 4. Review in 2 weeks. 5. ECG today.",
    icd10: "I11.9",
    author: "Dr. Sipho Dlamini",
  },
  {
    id: "n2",
    patient: "Sipho Dlamini",
    date: "10 Jun 2025 · 11:24",
    chief: "Post-op cardiac review (CABG ×3, day 28).",
    history: "58yo M, 4 weeks post-CABG. Reports good recovery, walking 30 min daily without angina. Compliant with dual antiplatelet + statin.",
    exam: "BP 128/80, HR 68 regular. Sternum well-healed, no discharge. Lungs clear. Wound clean. No peripheral oedema.",
    assessment: "Uncomplicated post-op recovery. Cardiac rehab progressing well.",
    plan: "1. Continue current meds (Aspirin, Clopidogrel, Atorvastatin 80mg, Bisoprolol, Ramipril). 2. Increment walking to 45 min. 3. Echo at 3 months. 4. Review 6 weeks.",
    icd10: "Z48.81",
    author: "Dr. Sipho Dlamini",
  },
  {
    id: "n3",
    patient: "Aisha Patel",
    date: "08 Jun 2025 · 14:10",
    chief: "Diabetes T2 — quarterly review.",
    history: "52yo F, T2DM ×8 yrs, on Metformin 850mg BD. Reports polyuria improved. Diet moderate carb. Walks 3×/wk.",
    exam: "BP 132/82, HR 74, BMI 29.6. Feet intact, monofilament normal. Fundi: no retinopathy.",
    assessment: "Suboptimal glycaemic control (HbA1c 8.1%). Eligible for SGLT2 add-on (renal function permitting).",
    plan: "1. Add Empagliflozin 10mg OD. 2. Reinforce carb counting. 3. Repeat HbA1c in 3 months. 4. Annual eye screen booked. 5. Foot check at every visit.",
    icd10: "E11.9",
    author: "Dr. Sipho Dlamini",
  },
  {
    id: "n4",
    patient: "Johan van der Merwe",
    date: "05 Jun 2025 · 10:30",
    chief: "Exertional chest pain — stable angina.",
    history: "61yo M, known CAD, on Atorvastatin 80mg, Aspirin, Bisoprolol. Recent chest pain on climbing >2 flights.",
    exam: "BP 138/86, HR 64. Heart sounds normal. Lungs clear. No signs of heart failure.",
    assessment: "Stable angina, likely progressive CAD. Needs risk stratification.",
    plan: "1. Increase Bisoprolol to 5mg OD. 2. Add ISDN 20mg BD. 3. Referral for stress echo. 4. Lipid panel + HbA1c. 5. Review in 1 week with results.",
    icd10: "I20.8",
    author: "Dr. Sipho Dlamini",
  },
  {
    id: "n5",
    patient: "Lerato Khumalo",
    date: "01 Jun 2025 · 13:15",
    chief: "Asthma — persistent nocturnal wheeze.",
    history: "34yo F, moderate persistent asthma, on Salbutamol PRN. Wakes 3×/wk with wheeze. No recent ED visits.",
    exam: "BP 118/76, HR 80, SpO2 97%. Mild expiratory wheeze bilaterally. No accessory muscle use.",
    assessment: "Moderate persistent asthma, step-up indicated.",
    plan: "1. Start Beclometasone 200mcg BD inhaler. 2. Continue Salbutamol PRN. 3. Asthma action plan. 4. Peak flow diary. 5. Review 4 weeks.",
    icd10: "J45.0",
    author: "Dr. Sipho Dlamini",
  },
  {
    id: "n6",
    patient: "Pieter Joubert",
    date: "28 May 2025 · 16:40",
    chief: "Atrial fibrillation — rate control check.",
    history: "67yo M, paroxysmal AF, on Warfarin (INR target 2.5) + Bisoprolol. Reports palpitations less frequent.",
    exam: "BP 124/78, HR 72 irregularly irregular. No signs of failure. INR 2.6 (in range).",
    assessment: "AF well-rate-controlled, anticoagulation therapeutic.",
    plan: "1. Continue Warfarin, INR monthly. 2. Continue Bisoprolol. 3. Consider DOAC if renal function stable. 4. Echo in 6 months. 5. Review 3 months.",
    icd10: "I48.0",
    author: "Dr. Sipho Dlamini",
  },
  {
    id: "n7",
    patient: "Naledi Mthembu",
    date: "26 May 2025 · 09:55",
    chief: "Pre-anaesthetic assessment — elective cholecystectomy.",
    history: "29yo F, otherwise well. No chronic meds. No allergies. FHx: nil relevant.",
    exam: "BP 110/70, HR 68, BMI 24.1. CVS/RS unremarkable. ASA II.",
    assessment: "Fit for general anaesthesia. ASA II.",
    plan: "1. FBC + U&E ordered. 2. ECG today. 3. Group & save. 4. Fasting instructions given. 5. Surgeon to schedule.",
    icd10: "Z01.81",
    author: "Dr. Sipho Dlamini",
  },
  {
    id: "n8",
    patient: "Bongani Zulu",
    date: "18 May 2025 · 11:20",
    chief: "Recurrent tension-type headaches.",
    history: "41yo M, daily bilateral band-like headaches, worse with screen time. No red flags. No meds overuse.",
    exam: "BP 126/80, HR 72. Neuro exam normal. Fundi normal. No neck stiffness.",
    assessment: "Tension-type headache, likely stress/posture-related.",
    plan: "1. Trial Amitriptyline 10mg ON. 2. Screen-time breaks. 3. Hydration. 4. Headache diary. 5. Review 6 weeks; red-flag reattendance advice given.",
    icd10: "G44.2",
    author: "Dr. Sipho Dlamini",
  },
];

const CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    name: "Thandiwe Mokoena",
    initials: "TM",
    role: "patient",
    preview: "Doctor, my BP is 156/98 today…",
    time: "09:42",
    unread: 2,
    online: true,
    messages: [
      { id: "m1", from: "them", text: "Good morning Dr. Dlamini", time: "09:38" },
      { id: "m2", from: "them", text: "I took my BP at home like you said — 156/98. Should I take an extra pill?", time: "09:39" },
      { id: "m3", from: "me", text: "Morning Thandiwe. Please don't take an extra dose. Did you take the morning Amlodipine with breakfast?", time: "09:41" },
      { id: "m4", from: "them", text: "Doctor, my BP is 156/98 today…", time: "09:42" },
    ],
  },
  {
    id: "c2",
    name: "Nurse N. Nkosi",
    initials: "NN",
    role: "staff",
    preview: "Bed 14 in ICU ready for your patient",
    time: "09:21",
    unread: 0,
    online: true,
    messages: [
      { id: "m1", from: "them", text: "Bed 14 in ICU ready for your patient — Sipho Dlamini post-op.", time: "09:21" },
      { id: "m2", from: "me", text: "Thanks Nomsa. Sending transfer order now.", time: "09:22" },
    ],
  },
  {
    id: "c3",
    name: "Aisha Patel",
    initials: "AP",
    role: "patient",
    preview: "Thank you for the new script 🙏",
    time: "Yesterday",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", from: "me", text: "Added Empagliflozin to your chart. Should be at Clicks by evening.", time: "Yesterday 17:04" },
      { id: "m2", from: "them", text: "Thank you for the new script 🙏", time: "Yesterday 18:30" },
    ],
  },
  {
    id: "c4",
    name: "Dr. R. Naidoo (Dermatology)",
    initials: "RN",
    role: "staff",
    preview: "Re: shared patient — skin biopsy result",
    time: "Yesterday",
    unread: 1,
    online: false,
    messages: [
      { id: "m1", from: "them", text: "Re: shared patient — skin biopsy result came back benign. No further derm input needed.", time: "Yesterday 14:12" },
    ],
  },
  {
    id: "c5",
    name: "Johan van der Merwe",
    initials: "JV",
    role: "patient",
    preview: "The chest pain is much better now",
    time: "Mon",
    unread: 0,
    online: false,
    messages: [
      { id: "m1", from: "them", text: "The chest pain is much better now, doctor. Walking up the stairs without stopping.", time: "Mon 16:50" },
      { id: "m2", from: "me", text: "Great news. See you for the stress echo next week.", time: "Mon 17:02" },
    ],
  },
];

const VIDEO_CONSULTS: VideoConsult[] = [
  { id: "v1", patient: "Sipho Dlamini", initials: "SD", reason: "Post-op cardiac review", scheduled: "Today 09:45", duration: "30 min", status: "upcoming" },
  { id: "v2", patient: "Johan van der Merwe", initials: "JV", reason: "Chest pain — minor", scheduled: "Today 11:15", duration: "20 min", status: "upcoming" },
  { id: "v3", patient: "Pieter Joubert", initials: "PJ", reason: "AFib — medication titration", scheduled: "Today 13:30", duration: "30 min", status: "upcoming" },
  { id: "v4", patient: "Yusuf Adams", initials: "YA", reason: "Hyperlipidaemia follow-up", scheduled: "Today 15:00", duration: "20 min", status: "upcoming" },
  { id: "v5", patient: "Bongani Zulu", initials: "BZ", reason: "Headache workup", scheduled: "Yesterday 16:00", duration: "25 min", status: "completed" },
  { id: "v6", patient: "Annelize Botha", initials: "AB", reason: "Migraine management", scheduled: "10 Jun 11:00", duration: "20 min", status: "completed" },
  { id: "v7", patient: "Kagiso Sithole", initials: "KS", reason: "Gout flare review", scheduled: "08 Jun 10:00", duration: "15 min", status: "missed" },
];

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const FREQUENCIES = ["Once daily", "Twice daily", "Three times daily", "Four times daily", "At bedtime", "As needed", "Every 4 hours", "Every 6 hours"];

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */

const RISK_STYLE: Record<Risk, { badge: string; dot: string; label: string }> = {
  low: { badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20", dot: "bg-emerald-500", label: "Low" },
  moderate: { badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20", dot: "bg-amber-500", label: "Moderate" },
  high: { badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20", dot: "bg-orange-500", label: "High" },
  critical: { badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20", dot: "bg-rose-500", label: "Critical" },
};

const STATUS_STYLE: Record<ApptStatus, { label: string; dot: string; badge: string }> = {
  "checked-in": { label: "Checked in", dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  upcoming: { label: "Upcoming", dot: "bg-medical", badge: "bg-medical/10 text-medical border-medical/20" },
  completed: { label: "Completed", dot: "bg-foreground/40", badge: "bg-foreground/5 text-muted-foreground border-foreground/10" },
  "no-show": { label: "No-show", dot: "bg-rose-500", badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20" },
};

function initialsOf(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-lg px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold">{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-medium">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Tab bar
   ------------------------------------------------------------------------- */

const TABS: { id: TabId; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "schedule", label: "Schedule", icon: Calendar },
  { id: "patients", label: "Patients", icon: Users },
  { id: "prescriptions", label: "Prescriptions", icon: Pill },
  { id: "video", label: "Video consults", icon: Video },
  { id: "notes", label: "Clinical notes", icon: FileText },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "settings", label: "Settings", icon: Settings },
];

/* =========================================================================
   Page
   ========================================================================= */

export default function DoctorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-medical border-t-transparent" />
        </div>
      }
    >
      <DoctorDashboardInner />
      <SonnerToaster position="top-right" richColors closeButton />
    </Suspense>
  );
}

function DoctorDashboardInner() {
  const params = useSearchParams();
  const tabParam = (params.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  return (
    <DashboardLayout role="doctor">
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
            {tab === "schedule" && <ScheduleTab />}
            {tab === "patients" && <PatientsTab />}
            {tab === "prescriptions" && <PrescriptionsTab />}
            {tab === "video" && <VideoTab />}
            {tab === "notes" && <NotesTab />}
            {tab === "messages" && <MessagesTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="glass-panel -mx-1 flex gap-1 overflow-x-auto rounded-2xl p-1.5">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "relative flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors",
              active ? "text-medical-foreground" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
            )}
            aria-current={active ? "page" : undefined}
          >
            {active && (
              <motion.span
                layoutId="doctor-tab-pill"
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-medical to-cyan-500 shadow-[0_6px_20px_var(--glow-1)]"
                transition={{ type: "spring", damping: 28, stiffness: 280 }}
              />
            )}
            <Icon className="relative z-10 h-4 w-4" />
            <span className="relative z-10 whitespace-nowrap">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* =========================================================================
   1. OVERVIEW TAB
   ========================================================================= */

function OverviewTab({ setTab }: { setTab: (t: TabId) => void }) {
  const { user } = useAuth();
  const stats = [
    { label: "Patients today", value: "12", delta: "+3 vs yesterday", trend: "up", icon: Users, accent: "var(--medical)" },
    { label: "Video consults", value: "4", delta: "2 upcoming", trend: "up", icon: Video, accent: "var(--chart-2)" },
    { label: "High-risk flags", value: "3", delta: "1 new since 06:00", trend: "up", icon: AlertTriangle, accent: "var(--chart-4)" },
    { label: "Avg consult time", value: "18m", delta: "-3m this week", trend: "down", icon: Clock, accent: "var(--chart-5)" },
  ];
  const top5 = SCHEDULE.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <motion.div
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
        initial="hidden"
        animate="show"
        className="glass-panel relative overflow-hidden p-6 sm:p-8"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-medical/15 blur-3xl" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1.5">
            <motion.div variants={fadeUp} className="flex items-center gap-2">
              <span className="chip">
                <HeartPulse className="h-3.5 w-3.5 text-medical" />
                {user?.specialty || "Cardiology"}
              </span>
              {user?.verified === "approved" && (
                <span className="chip border-medical/30 bg-medical/10 text-medical">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  HPCSA verified
                </span>
              )}
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, <span className="text-gradient-medical">{user?.name?.replace("Dr. ", "Dr. ") || "Doctor"}</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {user?.facility || "Chris Hani Baragwanath Hospital"}
              </span>
              <Dot className="h-4 w-4 opacity-40" />
              <span>Thursday, 19 June 2025</span>
              <Dot className="h-4 w-4 opacity-40" />
              <span className="inline-flex items-center gap-1.5">
                <span className="status-dot bg-emerald-500" style={{ background: "#10b981" }} /> On duty
              </span>
            </motion.p>
          </div>
          <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-2">
            <button
              onClick={() => setTab("schedule")}
              className="btn-secondary flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium"
            >
              <Calendar className="h-4 w-4" /> View schedule
            </button>
            <button
              onClick={() => setTab("prescriptions")}
              className="btn-primary flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
            >
              <Plus className="h-4 w-4" /> New prescription
            </button>
          </motion.div>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          const TrendIcon = s.trend === "up" ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={s.label}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              animate="show"
              className="stat-card group"
            >
              <div className="flex items-start justify-between">
                <span
                  className="grid h-10 w-10 place-items-center rounded-xl"
                  style={{ background: `color-mix(in oklab, ${s.accent} 14%, transparent)`, color: s.accent }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[0.7rem] font-semibold",
                    s.trend === "up" ? "text-emerald-500" : "text-muted-foreground"
                  )}
                >
                  <TrendIcon className="h-3 w-3" />
                </span>
              </div>
              <div className="mt-3 text-3xl font-semibold tracking-tight">{s.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{s.label}</div>
              <div className="mt-2 text-[0.7rem] text-muted-foreground/80">{s.delta}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Schedule + High-risk */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Today's schedule */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="glass-panel p-5 lg:col-span-3"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <CalendarClock className="h-4 w-4 text-medical" />
                Today&apos;s schedule
              </h2>
              <p className="text-xs text-muted-foreground">Top 5 appointments · {new Date().toLocaleDateString("en-ZA", { weekday: "long" })}</p>
            </div>
            <button onClick={() => setTab("schedule")} className="btn-ghost flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-medical">
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <ol className="relative space-y-3 border-l border-border/60 pl-4">
            {top5.map((s, i) => (
              <li key={s.id} className="relative">
                <span
                  className="absolute -left-[1.42rem] top-3 h-2.5 w-2.5 rounded-full border-2 border-background"
                  style={{ background: s.type === "video" ? "var(--chart-2)" : "var(--medical)" }}
                />
                <div className="flex items-start justify-between gap-3 rounded-xl border border-border/40 bg-card/40 p-3 transition-colors hover:border-medical/30">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {s.time} · {s.duration} min
                      <span className={cn("chip border-0 px-1.5 py-0 text-[0.6rem]", STATUS_STYLE[s.status].badge)}>
                        {STATUS_STYLE[s.status].label}
                      </span>
                    </div>
                    <div className="mt-1 truncate text-sm font-semibold">{s.patient}</div>
                    <div className="truncate text-xs text-muted-foreground">{s.reason}</div>
                  </div>
                  <span className={cn("chip shrink-0", s.type === "video" ? "text-cyan-600 dark:text-cyan-400" : "text-medical")}>
                    {s.type === "video" ? <Video className="h-3 w-3" /> : <User className="h-3 w-3" />}
                    {s.type === "video" ? "Video" : "In-person"}
                  </span>
                </div>
                {i < top5.length - 1 && <div className="mt-3" />}
              </li>
            ))}
          </ol>
        </motion.div>

        {/* High-risk patients */}
        <motion.div
          variants={fadeUp}
          custom={1}
          initial="hidden"
          animate="show"
          className="glass-panel p-5 lg:col-span-2"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                High-risk patients
              </h2>
              <p className="text-xs text-muted-foreground">Flagged in the last 24h</p>
            </div>
            <button onClick={() => setTab("patients")} className="btn-ghost flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-medical">
              All <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-3">
            {DOCTOR_HIGH_RISK.map((p) => (
              <li
                key={p.id}
                className="group flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 transition-colors hover:border-medical/30"
              >
                <span
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ background: `linear-gradient(135deg, var(--medical), var(--chart-2))` }}
                >
                  {p.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{p.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{p.condition} · {p.lastVisit}</div>
                </div>
                <div className="text-right">
                  <span className={cn("chip border", RISK_STYLE[p.risk].badge)}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", RISK_STYLE[p.risk].dot)} />
                    {RISK_STYLE[p.risk].label}
                  </span>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <ResponsiveContainer width={48} height={16}>
                      <LineChart data={p.trend.map((v, idx) => ({ idx, v }))}>
                        <Line type="monotone" dataKey="v" stroke={p.risk === "critical" ? "#f43f5e" : p.risk === "high" ? "#f97316" : "#f59e0b"} strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Network activity chart */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-medical" />
              Network activity
            </h2>
            <p className="text-xs text-muted-foreground">Consults vs scripts · national, last 7 days</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--medical)" }} /> Consults</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-2)" }} /> Scripts</span>
          </div>
        </div>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={NETWORK_ACTIVITY} barGap={6} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <RTooltip cursor={{ fill: "color-mix(in oklab, var(--medical) 8%, transparent)" }} content={<ChartTooltip />} />
              <Bar dataKey="consults" name="Consults" radius={[6, 6, 0, 0]} fill="var(--medical)" />
              <Bar dataKey="scripts" name="Scripts" radius={[6, 6, 0, 0]} fill="var(--chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}

/* =========================================================================
   2. SCHEDULE TAB (List + Kanban toggle)
   ========================================================================= */

function ScheduleTab() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const [composer, setComposer] = useState<ScheduleItem | null>(null);
  const [videoFor, setVideoFor] = useState<ScheduleItem | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Schedule</h1>
          <p className="text-sm text-muted-foreground">Thursday 19 June · 10 appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card/40 p-0.5">
            <button
              onClick={() => setView("list")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "list" ? "bg-medical text-medical-foreground" : "text-muted-foreground hover:text-foreground")}
              aria-pressed={view === "list"}
            >
              <ListIcon className="h-3.5 w-3.5" /> List
            </button>
            <button
              onClick={() => setView("kanban")}
              className={cn("flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors", view === "kanban" ? "bg-medical text-medical-foreground" : "text-muted-foreground hover:text-foreground")}
              aria-pressed={view === "kanban"}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Board
            </button>
          </div>
          <button className="btn-secondary flex h-9 items-center gap-2 rounded-lg px-3 text-sm">
            <Calendar className="h-4 w-4" /> Jump to
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="glass-panel divide-y divide-border/40">
          {SCHEDULE.map((s, i) => (
            <ScheduleRow key={s.id} s={s} index={i} onStart={() => setComposer(s)} onJoin={() => setVideoFor(s)} onNoShow={() => toast(`${s.patient} marked as no-show`, { description: "The patient slot is now released for rebooking." })} />
          ))}
        </div>
      ) : (
        <KanbanBoard items={SCHEDULE} onStart={(s) => setComposer(s)} onJoin={(s) => setVideoFor(s)} />
      )}

      {/* Clinical note composer */}
      <ClinicalNoteComposer
        open={!!composer}
        onClose={() => setComposer(null)}
        patient={composer?.patient}
        reason={composer?.reason}
      />

      {/* Video consult modal (full-screen) */}
      <VideoCallModal consult={videoFor ? { id: videoFor.id, patient: videoFor.patient, initials: initialsOf(videoFor.patient), reason: videoFor.reason, scheduled: videoFor.time, duration: `${videoFor.duration} min`, status: "upcoming" } : null} onClose={() => setVideoFor(null)} />
    </div>
  );
}

function ScheduleRow({ s, index, onStart, onJoin, onNoShow }: { s: ScheduleItem; index: number; onStart: () => void; onJoin: () => void; onNoShow: () => void }) {
  const Icon = s.type === "video" ? Video : User;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="flex flex-col gap-3 p-4 transition-colors hover:bg-foreground/[0.02] sm:flex-row sm:items-center"
    >
      <div className="flex w-20 shrink-0 flex-col">
        <div className="font-mono text-sm font-semibold">{s.time}</div>
        <div className="text-xs text-muted-foreground">{s.duration} min</div>
      </div>
      <div className="relative flex items-center gap-3">
        <span className="absolute -left-1 top-1 h-2 w-2 rounded-full" style={{ background: STATUS_STYLE[s.status].dot }} />
        <Avatar className="h-10 w-10 border border-border">
          <AvatarFallback className="bg-gradient-to-br from-medical/80 to-cyan-400/80 text-[0.7rem] font-bold text-white">
            {initialsOf(s.patient)}
          </AvatarFallback>
        </Avatar>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{s.patient}</span>
          <span className="chip border-0 bg-foreground/5 px-1.5 py-0 text-[0.65rem] text-muted-foreground">{s.age}y</span>
          <span className={cn("chip border px-1.5 py-0 text-[0.65rem]", STATUS_STYLE[s.status].badge)}>
            {STATUS_STYLE[s.status].label}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">{s.reason}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span className={cn("chip mr-1", s.type === "video" ? "text-cyan-600 dark:text-cyan-400" : "text-medical")}>
          <Icon className="h-3 w-3" />
          <span className="hidden sm:inline">{s.type === "video" ? "Video" : "In-person"}</span>
        </span>
        <button
          onClick={onStart}
          className="btn-primary flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold"
        >
          <Stethoscope className="h-3.5 w-3.5" /> Start consult
        </button>
        {s.type === "video" && (
          <button
            onClick={onJoin}
            className="btn-secondary flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium"
            aria-label={`Join video call with ${s.patient}`}
          >
            <Video className="h-3.5 w-3.5" /> Join
          </button>
        )}
        <button
          onClick={onNoShow}
          className="btn-ghost grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:text-rose-500"
          aria-label={`Mark ${s.patient} as no-show`}
        >
          <UserX2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function UserX2(props: any) {
  // simple inline glyph (avoid importing rarely-used icon)
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 19a6 6 0 0 0-12 0" />
      <circle cx="8" cy="9" r="3" />
      <line x1="17" y1="9" x2="22" y2="14" />
      <line x1="22" y1="9" x2="17" y2="14" />
    </svg>
  );
}

function KanbanBoard({ items, onStart, onJoin }: { items: ScheduleItem[]; onStart: (s: ScheduleItem) => void; onJoin: (s: ScheduleItem) => void }) {
  const columns: { key: ApptStatus; label: string; tone: string }[] = [
    { key: "checked-in", label: "Checked-in", tone: "var(--chart-5)" },
    { key: "upcoming", label: "Upcoming", tone: "var(--medical)" },
    { key: "completed", label: "Completed", tone: "var(--muted-foreground)" },
  ];
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {columns.map((col) => {
        const colItems = items.filter((i) => i.status === col.key);
        return (
          <div key={col.key} className="glass-panel flex flex-col p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: col.tone }} />
                <h3 className="text-sm font-semibold">{col.label}</h3>
              </div>
              <span className="chip border-0 bg-foreground/5 px-1.5 py-0 text-[0.65rem]">{colItems.length}</span>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-1" style={{ maxHeight: "60vh" }}>
              <AnimatePresence>
                {colItems.map((s) => (
                  <motion.div
                    key={s.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="rounded-xl border border-border/50 bg-card/50 p-3 transition-colors hover:border-medical/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-medical/80 to-cyan-400/80 text-[0.6rem] font-bold text-white">
                          {initialsOf(s.patient)}
                        </span>
                        <div>
                          <div className="text-xs font-semibold leading-tight">{s.patient}</div>
                          <div className="text-[0.65rem] text-muted-foreground">{s.age}y · {s.time}</div>
                        </div>
                      </div>
                      <span className={cn("chip border-0 px-1 py-0 text-[0.6rem]", s.type === "video" ? "text-cyan-600 dark:text-cyan-400" : "text-medical")}>
                        {s.type === "video" ? "Video" : "In-person"}
                      </span>
                    </div>
                    <div className="mt-2 text-[0.7rem] text-muted-foreground">{s.reason}</div>
                    <div className="mt-2.5 flex gap-1.5">
                      <button onClick={() => onStart(s)} className="btn-outline flex h-7 flex-1 items-center justify-center gap-1 rounded-md text-[0.7rem] font-medium">
                        <Stethoscope className="h-3 w-3" /> Start
                      </button>
                      {s.type === "video" && (
                        <button onClick={() => onJoin(s)} className="btn-outline grid h-7 w-7 place-items-center rounded-md text-cyan-600 dark:text-cyan-400" aria-label={`Join video with ${s.patient}`}>
                          <Video className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {colItems.length === 0 && (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                  No {col.label.toLowerCase()} patients
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Clinical Note Composer (used from Schedule + Notes tabs)
   ------------------------------------------------------------------------- */

function ClinicalNoteComposer({
  open,
  onClose,
  patient,
  reason,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  patient?: string;
  reason?: string;
  onSave?: (note: Partial<ClinicalNote>) => void;
}) {
  const [chief, setChief] = useState(reason || "");
  const [history, setHistory] = useState("");
  const [exam, setExam] = useState("");
  const [assessment, setAssessment] = useState("");
  const [plan, setPlan] = useState("");
  const [icd10, setIcd10] = useState("");

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setChief(reason || "");
    setHistory("");
    setExam("");
    setAssessment("");
    setPlan("");
    setIcd10("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, reason]);

  const handleSave = () => {
    if (!chief.trim()) {
      toast("Chief complaint is required", { description: "Please summarise the reason for visit." });
      return;
    }
    const note: Partial<ClinicalNote> = {
      patient: patient || "Unknown",
      chief,
      history,
      exam,
      assessment,
      plan,
      icd10,
    };
    onSave?.(note);
    toast.success("Clinical note signed", {
      description: `Saved to ${patient}'s record · ICD-10 ${icd10 || "—"}.`,
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-strong max-h-[90vh] w-full max-w-3xl overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <FileSignature className="h-5 w-5 text-medical" />
            Clinical note · {patient || "New"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            SOAP-style note · FHIR R4 compliant · saved to patient record
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Patient">
            <Input value={patient || ""} readOnly className="bg-card/50" />
          </Field>
          <Field label="ICD-10 code">
            <div className="flex items-center gap-2">
              <Input value={icd10} onChange={(e) => setIcd10(e.target.value)} placeholder="e.g. I10, E11.9" className="font-mono" />
              <button className="btn-secondary grid h-9 w-9 place-items-center rounded-md" aria-label="Search ICD-10">
                <Search className="h-4 w-4" />
              </button>
            </div>
          </Field>
        </div>

        <Field label="Chief complaint">
          <Input value={chief} onChange={(e) => setChief(e.target.value)} placeholder="Patient presents with…" />
        </Field>

        <Field label="History (HPI / PMH / meds / allergies)">
          <Textarea value={history} onChange={(e) => setHistory(e.target.value)} rows={3} placeholder="History of presenting illness, past medical history, current medications, allergies…" />
        </Field>

        <Field label="Examination">
          <Textarea value={exam} onChange={(e) => setExam(e.target.value)} rows={3} placeholder="Vitals, system-based findings…" />
        </Field>

        <Field label="Assessment">
          <Textarea value={assessment} onChange={(e) => setAssessment(e.target.value)} rows={2} placeholder="Differential diagnosis, working diagnosis…" />
        </Field>

        <Field label="Plan">
          <Textarea value={plan} onChange={(e) => setPlan(e.target.value)} rows={3} placeholder="Investigations, medications, follow-up, patient education…" />
        </Field>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[0.7rem] text-muted-foreground">
            <Lock className="mr-1 inline h-3 w-3" /> Encrypted at rest · audit-logged
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-outline h-9 rounded-lg px-4 text-sm">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold">
              <Check className="h-4 w-4" /> Sign &amp; save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

/* =========================================================================
   3. PATIENTS TAB
   ========================================================================= */

function PatientsTab() {
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<Risk | "all">("all");
  const [selected, setSelected] = useState<Patient | null>(null);

  const filtered = useMemo(() => {
    return PATIENTS.filter((p) => {
      if (riskFilter !== "all" && p.risk !== riskFilter) return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.condition.toLowerCase().includes(q);
    });
  }, [query, riskFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} of {PATIENTS.length} patients in your panel</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or condition…"
              className="input-premium h-9 w-full pl-9 sm:w-64"
              aria-label="Search patients"
            />
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card/40 p-0.5">
            <Filter className="ml-1.5 h-3.5 w-3.5 text-muted-foreground" />
            {(["all", "low", "moderate", "high", "critical"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className={cn("rounded-md px-2 py-1 text-xs font-medium capitalize transition-colors", riskFilter === r ? "bg-medical text-medical-foreground" : "text-muted-foreground hover:text-foreground")}
                aria-pressed={riskFilter === r}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="px-4 py-3 font-medium">Patient</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Condition</th>
                <th className="px-4 py-3 font-medium">Last visit</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="cursor-pointer border-b border-border/30 transition-colors hover:bg-medical/[0.04]"
                  onClick={() => setSelected(p)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-[0.65rem] font-bold text-white">
                        {p.initials}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="truncate text-[0.7rem] text-muted-foreground">{p.province}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.age}y · {p.gender}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.condition}</td>
                  <td className="px-4 py-3 text-muted-foreground">{p.lastVisit}</td>
                  <td className="px-4 py-3">
                    <span className={cn("chip border", RISK_STYLE[p.risk].badge)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", RISK_STYLE[p.risk].dot)} />
                      {RISK_STYLE[p.risk].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "chip border-0 text-[0.65rem]",
                      p.status === "monitoring" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                      p.status === "active" && "bg-medical/10 text-medical",
                      p.status === "stable" && "bg-foreground/5 text-muted-foreground",
                      p.status === "new" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    )}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="grid place-items-center gap-2 p-12 text-center">
              <Search className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No patients match your filters.</p>
            </div>
          )}
        </div>
      </div>

      <PatientDrawer patient={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function PatientDrawer({ patient, onClose }: { patient: Patient | null; onClose: () => void }) {
  const [composerOpen, setComposerOpen] = useState(false);

  return (
    <>
      <Sheet open={!!patient} onOpenChange={(v) => !v && onClose()}>
        <SheetContent side="right" className="glass-strong w-full overflow-y-auto sm:max-w-lg">
          {patient && (
            <div className="space-y-5 p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-medical to-cyan-500 text-base font-bold text-white">
                  {patient.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg font-semibold">{patient.name}</SheetTitle>
                  <SheetDescription className="text-xs">
                    {patient.age}y · {patient.gender} · {patient.province}
                  </SheetDescription>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <span className={cn("chip border", RISK_STYLE[patient.risk].badge)}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", RISK_STYLE[patient.risk].dot)} />
                      {RISK_STYLE[patient.risk].label} risk
                    </span>
                    <span className="chip border-0 bg-foreground/5 text-muted-foreground">{patient.condition}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <InfoTile icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={patient.phone} />
                <InfoTile icon={<Calendar className="h-3.5 w-3.5" />} label="Last visit" value={patient.lastVisit} />
                <InfoTile icon={<MapPin className="h-3.5 w-3.5" />} label="Province" value={patient.province} />
                <InfoTile icon={<Activity className="h-3.5 w-3.5" />} label="Status" value={patient.status} />
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <HeartPulse className="h-4 w-4 text-medical" /> Vitals trend
                </h3>
                <div className="glass-card p-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>BP / HR · last 7 days</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "var(--medical)" }} />BP</span>
                      <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "var(--chart-2)" }} />HR</span>
                    </span>
                  </div>
                  <div className="h-[140px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={PATIENT_VITALS}>
                        <defs>
                          <linearGradient id="vitalBP" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--medical)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--medical)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="vitalHR" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                        <RTooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="bp" name="BP" stroke="var(--medical)" strokeWidth={2} fill="url(#vitalBP)" />
                        <Area type="monotone" dataKey="hr" name="HR" stroke="var(--chart-2)" strokeWidth={2} fill="url(#vitalHR)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4 text-medical" /> Recent records
                </h3>
                <div className="space-y-2">
                  {PATIENT_RECORDS.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/30 p-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-md bg-medical/10 text-medical">
                        {r.type === "Imaging" ? <ScanLine className="h-4 w-4" /> : r.type === "Lab" ? <FlaskConical className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-medium">{r.title}</div>
                        <div className="truncate text-[0.7rem] text-muted-foreground">{r.doctor} · {r.facility}</div>
                      </div>
                      <span className="text-[0.7rem] text-muted-foreground">{r.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <Pill className="h-4 w-4 text-medical" /> Active prescriptions
                </h3>
                <div className="space-y-2">
                  {TODAY_PRESCRIPTIONS.filter((p) => p.patient.split(" ")[0] === patient.name.split(" ")[0]).slice(0, 2).map((p) => (
                    <div key={p.id} className="rounded-lg border border-border/40 bg-card/30 p-2.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{p.medicine} {p.strength}</span>
                        <span className="text-muted-foreground">{p.frequency}</span>
                      </div>
                      <div className="text-[0.7rem] text-muted-foreground">{p.dosage} · {p.quantity} units · {p.refills} refills</div>
                    </div>
                  ))}
                  <div className="rounded-lg border border-dashed border-border/60 p-2.5 text-center text-[0.7rem] text-muted-foreground">
                    Plus historical scripts available in full record
                  </div>
                </div>
              </div>

              <button
                onClick={() => setComposerOpen(true)}
                className="btn-primary flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
              >
                <Stethoscope className="h-4 w-4" /> Start consult
              </button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <ClinicalNoteComposer open={composerOpen} onClose={() => setComposerOpen(false)} patient={patient?.name} reason={patient?.condition} />
    </>
  );
}

function InfoTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-2.5">
      <div className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <div className="mt-0.5 truncate text-xs font-medium">{value}</div>
    </div>
  );
}

function ScanLine(props: any) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 7V5a2 2 0 0 1 2-2h2" />
      <path d="M17 3h2a2 2 0 0 1 2 2v2" />
      <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
      <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
      <path d="M7 12h10" />
    </svg>
  );
}
function FlaskConical(props: any) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 2v7.31" />
      <path d="M14 9.3V1.99" />
      <path d="M8.5 2h7" />
      <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
      <path d="M5.52 16h12.96" />
    </svg>
  );
}

/* =========================================================================
   4. PRESCRIPTIONS TAB
   ========================================================================= */

function PrescriptionsTab() {
  const [patient, setPatient] = useState<string>(PATIENTS[0].name);
  const [medicineQuery, setMedicineQuery] = useState("");
  const [selectedMed, setSelectedMed] = useState<typeof MEDICINES[number] | null>(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState(FREQUENCIES[1]);
  const [duration, setDuration] = useState("30 days");
  const [quantity, setQuantity] = useState("30");
  const [refills, setRefills] = useState("1");
  const [notes, setNotes] = useState("");

  const filteredMeds = useMemo(() => {
    const q = medicineQuery.trim().toLowerCase();
    if (!q) return MEDICINES;
    return MEDICINES.filter(
      (m) => m.name.toLowerCase().includes(q) || m.generic.toLowerCase().includes(q) || m.category.toLowerCase().includes(q)
    );
  }, [medicineQuery]);

  const resetForm = () => {
    setMedicineQuery("");
    setSelectedMed(null);
    setDosage("");
    setFrequency(FREQUENCIES[1]);
    setDuration("30 days");
    setQuantity("30");
    setRefills("1");
    setNotes("");
  };

  const handleSign = () => {
    if (!selectedMed) {
      toast("Select a medicine first", { description: "Search the formulary and pick a medication." });
      return;
    }
    if (!dosage.trim()) {
      toast("Dosage is required", { description: "e.g. 1 tablet, 2 puffs, 10ml." });
      return;
    }
    toast.success("Prescription signed & routed", {
      description: `${selectedMed.name} ${selectedMed.strength} → ${patient} · sent to Clicks Pharmacy (Rosebank) for verification.`,
    });
    resetForm();
  };

  const applyQuickPick = (q: (typeof RECENT_PRESCRIBED)[number]) => {
    const med = MEDICINES.find((m) => m.name === q.medicine) || null;
    setSelectedMed(med);
    setMedicineQuery(q.medicine);
    setFrequency(q.frequency);
    if (med) {
      setDosage(med.form === "Inhaler" ? "2 puffs" : "1 tablet");
      setQuantity(med.form === "Inhaler" ? "1" : "30");
    }
    setShowSuggest(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Prescriptions</h1>
          <p className="text-sm text-muted-foreground">Sign and route scripts to the patient&apos;s preferred pharmacy</p>
        </div>
        <span className="chip">
          <PillIcon className="h-3.5 w-3.5 text-medical" /> HPCSA-verified prescriber
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        {/* Left: today's scripts */}
        <div className="glass-panel p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Today&apos;s prescriptions</h2>
            <span className="chip border-0 bg-foreground/5 px-1.5 py-0 text-[0.65rem]">{TODAY_PRESCRIPTIONS.length}</span>
          </div>
          <div className="space-y-2.5">
            {TODAY_PRESCRIPTIONS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border/40 bg-card/30 p-3 transition-colors hover:border-medical/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-medical/80 to-cyan-400/80 text-[0.6rem] font-bold text-white">
                        {initialsOf(p.patient)}
                      </span>
                      <span className="truncate text-sm font-medium">{p.patient}</span>
                    </div>
                    <div className="mt-1.5 text-xs font-medium">{p.medicine} <span className="text-muted-foreground">{p.strength}</span></div>
                    <div className="text-[0.7rem] text-muted-foreground">{p.dosage} · {p.frequency} · {p.duration}</div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "chip border px-1.5 py-0 text-[0.6rem]",
                      p.status === "sent" && "bg-medical/10 text-medical border-medical/20",
                      p.status === "pending" && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                      p.status === "dispensed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                    )}>
                      {p.status}
                    </span>
                    <div className="mt-1 text-[0.7rem] text-muted-foreground">{p.time}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: new prescription form */}
        <div className="glass-panel p-5 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <FileSignature className="h-4 w-4 text-medical" /> New prescription
            </h2>
            <button onClick={resetForm} className="btn-ghost flex items-center gap-1 rounded-md px-2 py-1 text-xs">
              <X className="h-3 w-3" /> Clear
            </button>
          </div>

          <div className="space-y-4">
            {/* Patient */}
            <Field label="Patient">
              <Select value={patient} onValueChange={setPatient}>
                <SelectTrigger className="input-premium h-10 w-full">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {PATIENTS.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} · {p.age}y · {p.condition}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Medicine search (autocomplete) */}
            <Field label="Medicine">
              <div className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={medicineQuery}
                    onChange={(e) => { setMedicineQuery(e.target.value); setShowSuggest(true); setSelectedMed(null); }}
                    onFocus={() => setShowSuggest(true)}
                    onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                    placeholder="Search by name, generic or category…"
                    className="input-premium h-10 pl-9"
                  />
                </div>
                <AnimatePresence>
                  {showSuggest && filteredMeds.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="glass-strong absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border/60 p-1"
                    >
                      {filteredMeds.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            setSelectedMed(m);
                            setMedicineQuery(`${m.name} (${m.generic})`);
                            setShowSuggest(false);
                            setDosage(m.form === "Inhaler" ? "2 puffs" : "1 tablet");
                            setQuantity(m.form === "Inhaler" ? "1" : "30");
                          }}
                          className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-medical/10"
                        >
                          <div>
                            <div className="font-medium">{m.name} <span className="text-muted-foreground">· {m.generic}</span></div>
                            <div className="text-[0.65rem] text-muted-foreground">{m.form} · {m.strength} · {m.pack}</div>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <span className={cn("chip border-0 px-1 py-0 text-[0.55rem]", m.requiresPrescription ? "text-amber-600 dark:text-amber-400 bg-amber-500/10" : "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10")}>
                              S{m.schedule}
                            </span>
                            <span className="text-[0.6rem] text-muted-foreground">R{m.prices[0].price.toFixed(0)}</span>
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
                {selectedMed && (
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-medical/20 bg-medical/5 p-2 text-xs">
                    <Pill className="h-4 w-4 text-medical" />
                    <span className="font-medium">{selectedMed.name}</span>
                    <span className="text-muted-foreground">{selectedMed.strength} · {selectedMed.form}</span>
                    {selectedMed.requiresPrescription && (
                      <span className="chip border-0 bg-amber-500/10 px-1.5 py-0 text-[0.55rem] text-amber-600 dark:text-amber-400">Rx required</span>
                    )}
                  </div>
                )}
              </div>
            </Field>

            {/* Recently prescribed quick pick */}
            <div>
              <Label className="mb-1.5 text-xs font-medium text-muted-foreground">Recently prescribed — quick pick</Label>
              <div className="flex flex-wrap gap-1.5">
                {RECENT_PRESCRIBED.map((q) => (
                  <button
                    key={q.medicine + q.strength}
                    onClick={() => applyQuickPick(q)}
                    className="chip border-medical/20 bg-medical/5 text-medical transition-transform hover:scale-105"
                  >
                    <Sparkles className="h-3 w-3" /> {q.medicine} {q.strength}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Dosage">
                <Input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="1 tablet / 2 puffs / 10ml" className="input-premium h-10" />
              </Field>
              <Field label="Frequency">
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="input-premium h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map((f) => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Duration">
                <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="7 days / 30 days / ongoing" className="input-premium h-10" />
              </Field>
              <Field label="Quantity">
                <Input value={quantity} onChange={(e) => setQuantity(e.target.value)} type="number" min={1} className="input-premium h-10" />
              </Field>
            </div>

            <Field label="Refills allowed">
              <Input value={refills} onChange={(e) => setRefills(e.target.value)} type="number" min={0} max={12} className="input-premium h-10 w-32" />
            </Field>

            <Field label="Notes to pharmacist (optional)">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="e.g. Take with food, avoid grapefruit, brand substitution not allowed…" className="input-premium resize-none" />
            </Field>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-[0.7rem] text-muted-foreground">
                <Lock className="h-3 w-3" /> Encrypted · audit-logged · e-Rx compliant
              </div>
              <button onClick={handleSign} className="btn-primary flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold">
                <Check className="h-4 w-4" /> Sign &amp; send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   5. VIDEO CONSULTS TAB
   ========================================================================= */

function VideoTab() {
  const [active, setActive] = useState<VideoConsult | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Video consults</h1>
          <p className="text-sm text-muted-foreground">Secure telemedicine · end-to-end encrypted</p>
        </div>
        <button
          onClick={() => setActive(VIDEO_CONSULTS.find((v) => v.status === "upcoming") || VIDEO_CONSULTS[0])}
          className="btn-primary flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold"
        >
          <Video className="h-4 w-4" /> Start video consult
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-medical" /> Upcoming
          </h2>
          <div className="space-y-2.5">
            {VIDEO_CONSULTS.filter((v) => v.status === "upcoming").map((v, i) => (
              <motion.button
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setActive(v)}
                className="flex w-full items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3 text-left transition-colors hover:border-medical/30"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-xs font-bold text-white">
                  {v.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{v.patient}</div>
                  <div className="truncate text-xs text-muted-foreground">{v.reason}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-[0.7rem] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {v.scheduled} · {v.duration}
                  </div>
                </div>
                <span className="chip border-0 bg-medical/10 px-2 py-1 text-[0.65rem] text-medical">
                  <Video className="h-3 w-3" /> Join
                </span>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <History className="h-4 w-4 text-muted-foreground" /> History
          </h2>
          <div className="space-y-2.5">
            {VIDEO_CONSULTS.filter((v) => v.status !== "upcoming").map((v, i) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/30 p-3"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-foreground/10 text-xs font-bold">
                  {v.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{v.patient}</div>
                  <div className="truncate text-xs text-muted-foreground">{v.reason} · {v.scheduled}</div>
                </div>
                <span className={cn("chip border px-2 py-1 text-[0.65rem]",
                  v.status === "completed" && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                  v.status === "missed" && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
                )}>
                  {v.status}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <VideoCallModal consult={active} onClose={() => setActive(null)} />
    </div>
  );
}

function History(props: any) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </svg>
  );
}

/* -------------------------------------------------------------------------
   Full-screen Video Call Modal (Zoom-style)
   ------------------------------------------------------------------------- */

function VideoCallModal({ consult, onClose }: { consult: VideoConsult | null; onClose: () => void }) {
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [prescribeOpen, setPrescribeOpen] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!consult) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setElapsed(0);
      setMuted(false);
      setVideoOn(true);
      setSharing(false);
      setNote("");
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [consult]);

  if (!consult) return null;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex flex-col bg-[#05070d]"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3 text-white">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-2.5 py-1 text-xs font-semibold text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" /> REC
            </span>
            <span className="font-mono text-sm tabular-nums">{mm}:{ss}</span>
            <span className="hidden text-xs text-white/60 sm:inline">· End-to-end encrypted · MedLink Telehealth</span>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost grid h-9 w-9 place-items-center rounded-lg text-white/70 hover:text-white"
            aria-label="End call"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
        </div>

        {/* Main body */}
        <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1fr_360px]">
          {/* Video stage */}
          <div className="relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-medical/20 via-[#05070d] to-cyan-500/10">
            {/* decorative orbs */}
            <div className="pointer-events-none absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-medical/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-1/4 right-1/3 h-48 w-48 rounded-full bg-cyan-500/20 blur-3xl" />

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-4xl font-bold text-white shadow-2xl sm:h-44 sm:w-44"
            >
              {consult.initials}
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[0.6rem] font-bold text-white">
                LIVE
              </span>
            </motion.div>

            <div className="absolute left-4 top-4">
              <div className="glass-card flex items-center gap-2 px-3 py-1.5 text-xs text-white">
                <HeartPulse className="h-3.5 w-3.5 text-rose-400" /> 128/82 · HR 76 · SpO₂ 97%
              </div>
            </div>

            {/* Self PIP */}
            <div className="absolute bottom-4 right-4 h-28 w-40 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-foreground/10 to-foreground/5 shadow-xl sm:h-36 sm:w-52">
              {videoOn ? (
                <div className="grid h-full place-items-center bg-gradient-to-br from-medical/40 to-cyan-500/30">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-xs font-bold text-white">SD</span>
                </div>
              ) : (
                <div className="grid h-full place-items-center bg-black/40">
                  <VideoOff className="h-5 w-5 text-white/50" />
                </div>
              )}
              <span className="absolute bottom-1 left-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">You</span>
            </div>

            {/* Patient name */}
            <div className="absolute left-4 bottom-4">
              <div className="glass-card flex items-center gap-2 px-3 py-1.5 text-sm text-white">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {consult.patient}
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="flex flex-col border-t border-white/5 bg-white/[0.02] lg:border-t-0 lg:border-l">
            <div className="border-b border-white/5 p-4">
              <div className="text-xs uppercase tracking-wider text-white/40">Patient</div>
              <div className="mt-1 text-sm font-semibold text-white">{consult.patient}</div>
              <div className="text-xs text-white/60">{consult.reason}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="chip border-0 bg-white/5 px-2 py-0.5 text-[0.65rem] text-white/70">{consult.scheduled}</span>
                <span className="chip border-0 bg-white/5 px-2 py-0.5 text-[0.65rem] text-white/70">{consult.duration}</span>
              </div>
            </div>

            <div className="border-b border-white/5 p-4">
              <div className="mb-2 text-xs uppercase tracking-wider text-white/40">Vitals</div>
              <div className="h-[100px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PATIENT_VITALS}>
                    <defs>
                      <linearGradient id="vcVital" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <RTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="bp" name="BP" stroke="#3b82f6" strokeWidth={2} fill="url(#vcVital)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-1 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg bg-white/5 p-1.5"><div className="text-white/40 text-[0.6rem]">BP</div><div className="font-semibold text-white">127/76</div></div>
                <div className="rounded-lg bg-white/5 p-1.5"><div className="text-white/40 text-[0.6rem]">HR</div><div className="font-semibold text-white">74</div></div>
                <div className="rounded-lg bg-white/5 p-1.5"><div className="text-white/40 text-[0.6rem]">SpO₂</div><div className="font-semibold text-white">97%</div></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs uppercase tracking-wider text-white/40">Notes</div>
                <button
                  onClick={() => setPrescribeOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md bg-medical/20 px-2.5 py-1 text-xs font-medium text-medical hover:bg-medical/30"
                >
                  <Pill className="h-3 w-3" /> Prescribe
                </button>
              </div>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={6}
                placeholder="Live notes for the consult — these will be appended to the clinical note…"
                className="resize-none border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus-visible:ring-medical/40"
              />
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-2 border-t border-white/5 p-4">
              <ControlBtn active={!muted} onClick={() => setMuted((v) => !v)} label={muted ? "Unmute" : "Mute"} aria={muted ? "Unmute mic" : "Mute mic"}>
                {muted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </ControlBtn>
              <ControlBtn active={videoOn} onClick={() => setVideoOn((v) => !v)} label={videoOn ? "Stop video" : "Start video"} aria={videoOn ? "Stop video" : "Start video"}>
                {videoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </ControlBtn>
              <ControlBtn active={!sharing} onClick={() => setSharing((v) => !v)} label="Share screen" aria="Toggle screen share">
                <ScreenShare className="h-5 w-5" />
              </ControlBtn>
              <button
                onClick={onClose}
                className="ml-2 inline-flex h-12 items-center gap-2 rounded-full bg-rose-500 px-5 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
                aria-label="End call"
              >
                <PhoneOff className="h-4 w-4" /> End
              </button>
            </div>
          </div>
        </div>

        {/* Quick-prescribe dialog */}
        <Dialog open={prescribeOpen} onOpenChange={setPrescribeOpen}>
          <DialogContent className="glass-strong max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-medical" /> Quick prescribe</DialogTitle>
              <DialogDescription>Routes script to the patient&apos;s preferred pharmacy.</DialogDescription>
            </DialogHeader>
            <QuickPrescribeForm patient={consult.patient} onDone={() => setPrescribeOpen(false)} />
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}

function ControlBtn({ children, active, onClick, label, aria }: { children: React.ReactNode; active: boolean; onClick: () => void; label: string; aria: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={aria}
      title={label}
      className={cn(
        "grid h-12 w-12 place-items-center rounded-full border transition-colors",
        active ? "border-white/15 bg-white/10 text-white hover:bg-white/15" : "border-rose-500/30 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
      )}
    >
      {children}
    </button>
  );
}

function QuickPrescribeForm({ patient, onDone }: { patient: string; onDone: () => void }) {
  const [med, setMed] = useState<typeof MEDICINES[number] | null>(null);
  return (
    <div className="space-y-3">
      <Field label="Patient"><Input value={patient} readOnly className="bg-card/50" /></Field>
      <Field label="Medicine">
        <Select onValueChange={(v) => setMed(MEDICINES.find((m) => m.id === v) || null)}>
          <SelectTrigger className="input-premium h-10 w-full"><SelectValue placeholder="Select medicine" /></SelectTrigger>
          <SelectContent>
            {MEDICINES.map((m) => (<SelectItem key={m.id} value={m.id}>{m.name} · {m.strength}</SelectItem>))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Dosage"><Input placeholder="1 tablet" className="input-premium h-10" /></Field>
      <button
        onClick={() => { toast.success("Prescription sent", { description: `${med?.name || "Medicine"} routed to ${patient}'s pharmacy.` }); onDone(); }}
        className="btn-primary flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold"
      >
        <Check className="h-4 w-4" /> Sign &amp; send
      </button>
    </div>
  );
}

/* =========================================================================
   6. CLINICAL NOTES TAB
   ========================================================================= */

function NotesTab() {
  const [expanded, setExpanded] = useState<string | null>(CLINICAL_NOTES[0].id);
  const [composer, setComposer] = useState(false);
  const [notes, setNotes] = useState<ClinicalNote[]>(CLINICAL_NOTES);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Clinical notes</h1>
          <p className="text-sm text-muted-foreground">{notes.length} notes · signed &amp; audit-logged</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary flex h-9 items-center gap-2 rounded-lg px-3 text-sm">
            <Printer className="h-4 w-4" /> Export
          </button>
          <button
            onClick={() => setComposer(true)}
            className="btn-primary flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-semibold"
          >
            <Plus className="h-4 w-4" /> New note
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {notes.map((n, i) => {
          const isOpen = expanded === n.id;
          return (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel overflow-hidden"
            >
              <button
                onClick={() => setExpanded(isOpen ? null : n.id)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-foreground/[0.02]"
                aria-expanded={isOpen}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-medical/10 text-medical">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{n.patient}</span>
                    <span className="chip border-0 bg-foreground/5 px-1.5 py-0 text-[0.65rem] text-muted-foreground">{n.date}</span>
                    {n.icd10 && <span className="chip border-0 bg-medical/10 px-1.5 py-0 text-[0.65rem] text-medical font-mono">{n.icd10}</span>}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">{n.chief}</div>
                </div>
                <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="border-t border-border/40 p-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <SoapBlock label="Subjective (HPI)" icon={<ClipboardList className="h-3.5 w-3.5" />}>{n.history}</SoapBlock>
                        <SoapBlock label="Objective (Exam)" icon={<Stethoscope className="h-3.5 w-3.5" />}>{n.exam}</SoapBlock>
                        <SoapBlock label="Assessment" icon={<Activity className="h-3.5 w-3.5" />}>{n.assessment}</SoapBlock>
                        <SoapBlock label="Plan" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>{n.plan}</SoapBlock>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-3">
                        <span className="text-[0.7rem] text-muted-foreground">Signed by {n.author}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toast("Note opened for editing", { description: "Edits will be audit-logged." })}
                            className="btn-ghost flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                          >
                            <Edit3 className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={() => toast.success("Note exported", { description: `PDF saved to ${n.patient}'s record.` })}
                            className="btn-ghost flex items-center gap-1 rounded-md px-2 py-1 text-xs"
                          >
                            <Printer className="h-3 w-3" /> Export
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      <ClinicalNoteComposer
        open={composer}
        onClose={() => setComposer(false)}
        onSave={(note) => {
          const full: ClinicalNote = {
            id: `n${notes.length + 1}`,
            patient: note.patient || "Unknown",
            date: new Date().toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }),
            chief: note.chief || "",
            history: note.history || "",
            exam: note.exam || "",
            assessment: note.assessment || "",
            plan: note.plan || "",
            icd10: note.icd10 || "",
            author: "Dr. Sipho Dlamini",
          };
          setNotes((prev) => [full, ...prev]);
        }}
      />
    </div>
  );
}

function SoapBlock({ label, icon, children }: { label: string; icon: React.ReactNode; children: string }) {
  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[0.65rem] uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </div>
      <p className="text-xs leading-relaxed text-foreground/90 whitespace-pre-wrap">{children}</p>
    </div>
  );
}

/* =========================================================================
   7. MESSAGES TAB
   ========================================================================= */

function MessagesTab() {
  const [activeId, setActiveId] = useState(CONVERSATIONS[0].id);
  const [draft, setDraft] = useState("");
  const [conversations, setConversations] = useState(CONVERSATIONS);
  const scrollRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [active?.messages.length, activeId]);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              preview: text,
              time: "now",
              unread: 0,
              messages: [
                ...c.messages,
                { id: `m${Date.now()}`, from: "me", text, time: new Date().toLocaleTimeString("en-ZA", { hour: "2-digit", minute: "2-digit" }) },
              ],
            }
          : c
      )
    );
    setDraft("");
    toast("Message sent", { description: `Delivered to ${active.name}.` });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
        <p className="text-sm text-muted-foreground">Secure channel with patients &amp; staff</p>
      </div>

      <div className="glass-panel grid h-[72vh] grid-cols-1 overflow-hidden sm:grid-cols-[280px_1fr] lg:grid-cols-[320px_1fr]">
        {/* Conversation list */}
        <div className="flex flex-col border-b border-border/40 sm:border-b-0 sm:border-r">
          <div className="border-b border-border/40 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search…" className="input-premium h-9 pl-9" aria-label="Search conversations" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5" style={{ maxHeight: "calc(72vh - 60px)" }}>
            {conversations.map((c) => {
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl p-2.5 text-left transition-colors",
                    isActive ? "bg-medical/10" : "hover:bg-foreground/[0.02]"
                  )}
                >
                  <div className="relative">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-[0.65rem] font-bold text-white">
                      {c.initials}
                    </span>
                    {c.online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{c.name}</span>
                      <span className="shrink-0 text-[0.65rem] text-muted-foreground">{c.time}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-muted-foreground">{c.preview}</span>
                      {c.unread > 0 && (
                        <span className="grid h-4 min-w-4 shrink-0 place-items-center rounded-full bg-medical px-1 text-[0.6rem] font-bold text-white">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-border/40 p-3">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-500 text-[0.65rem] font-bold text-white">
                {active.initials}
              </span>
              <div>
                <div className="text-sm font-semibold">{active.name}</div>
                <div className="text-[0.7rem] text-muted-foreground">
                  {active.online ? <span className="inline-flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online</span> : "Offline"}
                  {" · "}
                  {active.role === "patient" ? "Patient" : "Staff"}
                </div>
              </div>
            </div>
            <button className="btn-ghost grid h-9 w-9 place-items-center rounded-lg" aria-label="More options">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-4" style={{ maxHeight: "calc(72vh - 120px)" }}>
            {active.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.from === "me" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                  m.from === "me"
                    ? "rounded-br-md bg-gradient-to-br from-medical to-cyan-500 text-white"
                    : "rounded-bl-md border border-border/50 bg-card/60"
                )}>
                  <p className="leading-relaxed">{m.text}</p>
                  <div className={cn("mt-1 text-[0.6rem]", m.from === "me" ? "text-white/70" : "text-muted-foreground")}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/40 p-3">
            <div className="flex items-center gap-2">
              <button className="btn-ghost grid h-9 w-9 shrink-0 place-items-center rounded-lg" aria-label="Attach file">
                <Plus className="h-4 w-4" />
              </button>
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder="Type a secure message…"
                className="input-premium h-10"
                aria-label="Compose message"
              />
              <button
                onClick={send}
                disabled={!draft.trim()}
                className="btn-primary grid h-10 w-10 shrink-0 place-items-center rounded-xl disabled:opacity-50"
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

/* =========================================================================
   8. SETTINGS TAB
   ========================================================================= */

function SettingsTab() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "Dr. Sipho Dlamini");
  const [specialty, setSpecialty] = useState(user?.specialty || "Cardiology");
  const [hpcsa, setHpcsa] = useState("MP023119");
  const [facility, setFacility] = useState(user?.facility || "Chris Hani Baragwanath Hospital");
  const [bio, setBio] = useState("Interventional cardiologist with 14 years' experience in public-sector cardiac care. Special interests: HF, AF, post-MI management.");
  const [language, setLanguage] = useState("en");
  const [availability, setAvailability] = useState<Record<string, boolean>>({ Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false });
  const [notif, setNotif] = useState({ newPatient: true, highRisk: true, rxReady: true, dailySummary: false, marketing: false });

  const handleSave = () => {
    updateUser({ name, specialty, facility });
    toast.success("Settings saved", {
      description: "Your profile and preferences have been updated.",
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">Profile, availability &amp; preferences</p>
        </div>
        <button onClick={handleSave} className="btn-primary flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold">
          <Check className="h-4 w-4" /> Save changes
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile */}
        <div className="glass-panel p-5 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <IdCard className="h-4 w-4 text-medical" /> Profile
          </h2>
          <div className="mb-5 flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-medical to-cyan-500 text-lg font-bold text-white">
              {initialsOf(name)}
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="chip border-medical/30 bg-medical/10 text-medical">
                  <ShieldCheck className="h-3.5 w-3.5" /> HPCSA verified
                </span>
                <span className="chip">{specialty}</span>
              </div>
              <button className="btn-outline h-8 rounded-lg px-3 text-xs">Change photo</button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><Input value={name} onChange={(e) => setName(e.target.value)} className="input-premium h-10" /></Field>
            <Field label="Specialty">
              <Select value={specialty} onValueChange={setSpecialty}>
                <SelectTrigger className="input-premium h-10 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cardiology", "General Practice", "Paediatrics", "Dermatology", "Internal Medicine", "Psychiatry", "Obstetrics & Gynaecology", "Orthopaedics"].map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="HPCSA number"><Input value={hpcsa} onChange={(e) => setHpcsa(e.target.value)} className="input-premium h-10 font-mono" /></Field>
            <Field label="Facility"><Input value={facility} onChange={(e) => setFacility(e.target.value)} className="input-premium h-10" /></Field>
          </div>
          <div className="mt-4">
            <Field label="Bio">
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="input-premium resize-none" />
            </Field>
          </div>
        </div>

        {/* Right column: prefs + language */}
        <div className="space-y-5">
          {/* Availability */}
          <div className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CalendarClock className="h-4 w-4 text-medical" /> Availability
            </h2>
            <p className="mb-3 text-xs text-muted-foreground">Days you accept appointments</p>
            <div className="space-y-1.5">
              {DAYS.map((d) => (
                <div key={d} className="flex items-center justify-between rounded-lg border border-border/40 bg-card/30 px-3 py-2">
                  <span className="text-sm">{d}</span>
                  <Switch checked={availability[d]} onCheckedChange={(v) => setAvailability((prev) => ({ ...prev, [d]: v }))} aria-label={`Available on ${d}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Language */}
          <div className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Languages className="h-4 w-4 text-medical" /> Language
            </h2>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="input-premium h-10 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="zu">isiZulu</SelectItem>
                <SelectItem value="af">Afrikaans</SelectItem>
                <SelectItem value="st">Sesotho</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-panel p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <BellRing className="h-4 w-4 text-medical" /> Notifications
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <NotifToggle label="New patient assigned" desc="When a patient is added to your panel" checked={notif.newPatient} onChange={(v) => setNotif((p) => ({ ...p, newPatient: v }))} />
          <NotifToggle label="High-risk alert" desc="Critical patient flag triggered" checked={notif.highRisk} onChange={(v) => setNotif((p) => ({ ...p, highRisk: v }))} />
          <NotifToggle label="Prescription ready" desc="Pharmacy dispense confirmations" checked={notif.rxReady} onChange={(v) => setNotif((p) => ({ ...p, rxReady: v }))} />
          <NotifToggle label="Daily summary" desc="End-of-day patient digest" checked={notif.dailySummary} onChange={(v) => setNotif((p) => ({ ...p, dailySummary: v }))} />
          <NotifToggle label="Product updates" desc="New MedLink features" checked={notif.marketing} onChange={(v) => setNotif((p) => ({ ...p, marketing: v }))} />
        </div>
      </div>
    </div>
  );
}

function NotifToggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-border/40 bg-card/30 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-[0.7rem] text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} aria-label={label} />
    </div>
  );
}
