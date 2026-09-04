import {
  HeartPulse,
  Activity,
  Baby,
  Scissors,
  Ambulance,
  ScanLine,
  FlaskConical,
} from "lucide-react";
import type { BedRow, BedStatus, BedPatientDetail } from "./types";

export const SA_FIRST = [
  "Thandiwe", "Sipho", "Aisha", "Johan", "Lerato", "Bongani", "Naledi",
  "Pieter", "Fatima", "Sizwe", "Zanele", "Mandla", "Refilwe", "Andile",
  "Karabo", "Nompumelelo", "Tumelo", "Mosa", "Kagiso", "Boitumelo",
  "Lebohang", "Katlego", "Mpho", "Tebogo", "Tshepo", "Sibongile", "Nokuthula",
];

export const SA_LAST = [
  "Mokoena", "Dlamini", "Naidoo", "Sithole", "Khumalo", "Pillay", "Botha",
  "Molefe", "Zulu", "Nkosi", "Mahlangu", "Mthembu", "Khoza", "Mthethwa",
  "Cele", "Ndlovu", "Hlongwane", "Khanyile", "Mhlongo", "Mseleku",
];

export const ATTENDING = [
  "Dr. Sipho Dlamini — Cardiology",
  "Dr. Thandiwe Mokoena — General",
  "Dr. R. Naidoo — Dermatology",
  "Dr. M. Sithole — Internal Med",
  "Dr. K. Pillay — Paediatrics",
  "Dr. J. Botha — Surgery",
  "Dr. N. Khumalo — Orthopaedics",
  "Dr. P. Molefe — Maternity",
];

export const DIAGNOSES = [
  "Hypertension — Stage 2",
  "Type 2 Diabetes — uncontrolled",
  "Post-op cardiac review",
  "Community-acquired pneumonia",
  "COPD exacerbation",
  "Acute asthma",
  "Fractured femur — post-ORIF",
  "Appendicitis — post-appendectomy",
  "Pre-eclampsia — monitoring",
  "Neonatal jaundice",
  "TB — initiation phase",
  "Sepsis — IV antibiotics",
  "Acute stroke — rehab",
  "Acute coronary syndrome",
  "Acute kidney injury",
  "Cellulitis — IV antibiotics",
];

export const INSURANCE = ["GEMS", "Discovery Health", "Bonitas", "Momentum", "Self-pay", "Profmed"];

export function bedDetail(bed: BedRow): BedPatientDetail | null {
  if (bed.status !== "occupied" && bed.status !== "reserved") return null;
  const seed = bed.bedNumber;
  const first = SA_FIRST[(seed * 7) % SA_FIRST.length];
  const last = SA_LAST[(seed * 11) % SA_LAST.length];
  const age = 18 + ((seed * 13) % 70);
  const dayAdmit = 1 + ((seed * 5) % 25);
  const admitDate = `June ${dayAdmit}, 2025`;
  const dischargeDay = dayAdmit + 1 + ((seed * 3) % 6);
  const dischargeDate = `June ${dischargeDay > 30 ? dischargeDay - 30 : dischargeDay}, 2025`;
  return {
    patient: `${first} ${last.charAt(0)}.`,
    age,
    admitted: admitDate,
    attending: ATTENDING[(seed * 3) % ATTENDING.length],
    diagnosis: DIAGNOSES[(seed * 5) % DIAGNOSES.length],
    expectedDischarge: dischargeDate,
    insurance: INSURANCE[(seed * 2) % INSURANCE.length],
  };
}

export const DEPARTMENTS = [
  { id: "d1", name: "Cardiology", icon: HeartPulse, head: "Dr. Sipho Dlamini", beds: 24, staff: 14, patientsToday: 41, status: "active" as const, color: "#ef4444" },
  { id: "d2", name: "ICU", icon: Activity, head: "Dr. M. Sithole", beds: 16, staff: 22, patientsToday: 14, status: "critical" as const, color: "#f59e0b" },
  { id: "d3", name: "Paediatrics", icon: Baby, head: "Dr. K. Pillay", beds: 18, staff: 11, patientsToday: 28, status: "active" as const, color: "#06b6d4" },
  { id: "d4", name: "Maternity", icon: Baby, head: "Dr. P. Molefe", beds: 22, staff: 16, patientsToday: 19, status: "active" as const, color: "#ec4899" },
  { id: "d5", name: "Surgical", icon: Scissors, head: "Dr. J. Botha", beds: 30, staff: 19, patientsToday: 36, status: "active" as const, color: "#8b5cf6" },
  { id: "d6", name: "Emergency", icon: Ambulance, head: "Dr. N. Khumalo", beds: 12, staff: 24, patientsToday: 132, status: "critical" as const, color: "#ef4444" },
  { id: "d7", name: "Radiology", icon: ScanLine, head: "Dr. L. Adams", beds: 0, staff: 8, patientsToday: 74, status: "active" as const, color: "#0ea5e9" },
  { id: "d8", name: "Laboratory", icon: FlaskConical, head: "Dr. T. Naidoo", beds: 0, staff: 12, patientsToday: 218, status: "active" as const, color: "#10b981" },
];

export const PATIENT_FLOW = [
  { t: "06:00", admissions: 3, discharges: 1 },
  { t: "08:00", admissions: 8, discharges: 2 },
  { t: "10:00", admissions: 14, discharges: 4 },
  { t: "12:00", admissions: 11, discharges: 9 },
  { t: "14:00", admissions: 9, discharges: 12 },
  { t: "16:00", admissions: 12, discharges: 10 },
  { t: "18:00", admissions: 6, discharges: 7 },
  { t: "20:00", admissions: 4, discharges: 5 },
  { t: "22:00", admissions: 2, discharges: 3 },
];

export const WARDS = ["ICU", "General", "Paediatrics", "Maternity", "Surgical"] as const;

export const BED_STATUS_META: Record<
  BedStatus,
  { label: string; tile: string; dot: string; ring: string; chart: string; text: string }
> = {
  occupied: {
    label: "Occupied",
    tile: "bg-rose-500/90 border-rose-400/50 text-white",
    dot: "bg-rose-500",
    ring: "ring-rose-500/40",
    chart: "#f43f5e",
    text: "text-rose-500",
  },
  available: {
    label: "Available",
    tile: "bg-emerald-500/90 border-emerald-400/50 text-white",
    dot: "bg-emerald-500",
    ring: "ring-emerald-500/40",
    chart: "#10b981",
    text: "text-emerald-500",
  },
  cleaning: {
    label: "Cleaning",
    tile: "bg-amber-500/90 border-amber-400/50 text-white",
    dot: "bg-amber-500",
    ring: "ring-amber-500/40",
    chart: "#f59e0b",
    text: "text-amber-500",
  },
  reserved: {
    label: "Reserved",
    tile: "bg-violet-500/90 border-violet-400/50 text-white",
    dot: "bg-violet-500",
    ring: "ring-violet-500/40",
    chart: "#8b5cf6",
    text: "text-violet-500",
  },
};
