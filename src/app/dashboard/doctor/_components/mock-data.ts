import { DOCTOR_SCHEDULE } from "@/lib/data";
import type { ScheduleItem, Patient, Prescription, ClinicalNote, Conversation, VideoConsult } from "./types";

export const EXTRA_SCHEDULE: ScheduleItem[] = [
  { id: "s5", patient: "Lerato K.", patientName: "Lerato Khumalo", age: 34, reason: "Asthma review — Ventolin refill", time: "12:00", date: "13 Jun", duration: 20, type: "in-person", status: "upcoming" },
  { id: "s6", patient: "Pieter J.", patientName: "Pieter Joubert", age: 67, reason: "AFib — medication titration", time: "13:30", date: "13 Jun", duration: 30, type: "video", status: "upcoming" },
  { id: "s7", patient: "Naledi M.", patientName: "Naledi Mthembu", age: 29, reason: "Pre-anaesthetic assessment", time: "14:15", date: "13 Jun", duration: 25, type: "in-person", status: "upcoming" },
  { id: "s8", patient: "Yusuf A.", patientName: "Yusuf Adams", age: 54, reason: "Hyperlipidaemia follow-up", time: "15:00", date: "13 Jun", duration: 20, type: "video", status: "upcoming" },
  { id: "s9", patient: "Bongani Z.", patientName: "Bongani Zulu", age: 41, reason: "Headache workup", time: "07:30", date: "12 Jun", duration: 30, type: "in-person", status: "completed" },
  { id: "s10", patient: "Fatima K.", patientName: "Fatima Khan", age: 38, reason: "Thyroid — levothyroxine review", time: "08:15", date: "12 Jun", duration: 20, type: "in-person", status: "completed" },
];

export const SCHEDULE: ScheduleItem[] = [
  ...DOCTOR_SCHEDULE.map((s) => ({
    ...s,
    patientName: s.patient,
    date: "13 Jun",
  }) as ScheduleItem),
  ...EXTRA_SCHEDULE,
];

export const PATIENTS: Patient[] = [
  { id: "p1", name: "Thandiwe Mokoena", initials: "TM", age: 47, gender: "F", condition: "Hypertension · Stage 2", lastVisit: "12 Jun", risk: "critical", status: "monitoring", phone: "+27 82 412 8890", province: "Gauteng", nextAppt: "18 Jun", vitals: { bp: "154/96", hr: "78", temp: "36.8°C", spo2: "97%" }, allergies: ["Penicillin"] },
  { id: "p2", name: "Sipho Dlamini", initials: "SD", age: 58, gender: "M", condition: "Post-op cardiac", lastVisit: "10 Jun", risk: "high", status: "monitoring", phone: "+27 71 990 2211", province: "Gauteng", nextAppt: "17 Jun", vitals: { bp: "128/80", hr: "68", temp: "36.5°C", spo2: "98%" }, allergies: [] },
  { id: "p3", name: "Aisha Patel", initials: "AP", age: 52, gender: "F", condition: "Diabetes T2", lastVisit: "08 Jun", risk: "moderate", status: "active", phone: "+27 83 552 7710", province: "Gauteng", nextAppt: "20 Jun", vitals: { bp: "132/82", hr: "74", temp: "36.6°C", spo2: "98%" }, allergies: ["Sulphonamides"] },
  { id: "p4", name: "Johan van der Merwe", initials: "JV", age: 61, gender: "M", condition: "Coronary artery disease", lastVisit: "05 Jun", risk: "high", status: "stable", phone: "+27 76 332 1190", province: "Western Cape", nextAppt: "15 Jun", vitals: { bp: "138/86", hr: "64", temp: "36.7°C", spo2: "97%" }, allergies: [] },
  { id: "p5", name: "Lerato Khumalo", initials: "LK", age: 34, gender: "F", condition: "Asthma · moderate persistent", lastVisit: "01 Jun", risk: "low", status: "stable", phone: "+27 79 884 5521", province: "KwaZulu-Natal", nextAppt: "25 Jun", vitals: { bp: "118/76", hr: "80", temp: "36.6°C", spo2: "97%" }, allergies: ["Aspirin"] },
  { id: "p6", name: "Pieter Joubert", initials: "PJ", age: 67, gender: "M", condition: "Atrial fibrillation", lastVisit: "28 May", risk: "high", status: "monitoring", phone: "+27 82 119 8842", province: "Gauteng", nextAppt: "14 Jun", vitals: { bp: "124/78", hr: "72", temp: "36.5°C", spo2: "96%" }, allergies: [] },
  { id: "p7", name: "Naledi Mthembu", initials: "NM", age: 29, gender: "F", condition: "Pre-op clearance", lastVisit: "26 May", risk: "low", status: "new", phone: "+27 84 220 9981", province: "Eastern Cape", nextAppt: "16 Jun", vitals: { bp: "110/70", hr: "68", temp: "36.4°C", spo2: "99%" }, allergies: [] },
  { id: "p8", name: "Yusuf Adams", initials: "YA", age: 54, gender: "M", condition: "Hyperlipidaemia", lastVisit: "22 May", risk: "moderate", status: "stable", phone: "+27 73 991 2200", province: "Western Cape", nextAppt: "22 Jun", vitals: { bp: "134/84", hr: "76", temp: "36.7°C", spo2: "98%" }, allergies: ["Ibuprofen"] },
  { id: "p9", name: "Fatima Khan", initials: "FK", age: 38, gender: "F", condition: "Hypothyroidism", lastVisit: "20 May", risk: "low", status: "stable", phone: "+27 81 445 6670", province: "Gauteng", nextAppt: "30 Jun", vitals: { bp: "122/78", hr: "70", temp: "36.5°C", spo2: "98%" }, allergies: [] },
  { id: "p10", name: "Bongani Zulu", initials: "BZ", age: 41, gender: "M", condition: "Chronic tension headache", lastVisit: "18 May", risk: "moderate", status: "active", phone: "+27 78 220 1199", province: "KwaZulu-Natal", nextAppt: "19 Jun", vitals: { bp: "126/80", hr: "72", temp: "36.6°C", spo2: "98%" }, allergies: [] },
  { id: "p11", name: "Annelize Botha", initials: "AB", age: 49, gender: "F", condition: "Migraine with aura", lastVisit: "15 May", risk: "moderate", status: "stable", phone: "+27 72 990 1170", province: "Free State", nextAppt: "28 Jun", vitals: { bp: "128/82", hr: "74", temp: "36.7°C", spo2: "98%" }, allergies: ["Codeine"] },
  { id: "p12", name: "Kagiso Sithole", initials: "KS", age: 36, gender: "M", condition: "Gout · recurrent", lastVisit: "12 May", risk: "low", status: "stable", phone: "+27 83 117 2204", province: "Mpumalanga", nextAppt: "21 Jun", vitals: { bp: "130/84", hr: "72", temp: "36.6°C", spo2: "98%" }, allergies: [] },
];

export const TODAY_PRESCRIPTIONS: Prescription[] = [
  { id: "rx1", patientName: "Thandiwe Mokoena", medicine: "Amlodipine", strength: "10mg", dosage: "1 tablet", frequency: "Once daily", duration: "30 days", quantity: 30, refills: 3, status: "sent", time: "09:12", date: "13 Jun", notes: "" },
  { id: "rx2", patientName: "Sipho Dlamini", medicine: "Augmentin", strength: "875mg/125mg", dosage: "1 tablet", frequency: "Twice daily", duration: "7 days", quantity: 14, refills: 0, status: "dispensed", time: "09:48", date: "13 Jun", notes: "" },
  { id: "rx3", patientName: "Aisha Patel", medicine: "Glucophage", strength: "850mg", dosage: "1 tablet", frequency: "Twice daily", duration: "90 days", quantity: 60, refills: 2, status: "pending", time: "10:34", date: "13 Jun", notes: "" },
  { id: "rx4", patientName: "Lerato Khumalo", medicine: "Ventolin", strength: "100mcg", dosage: "2 puffs", frequency: "As needed", duration: "ongoing", quantity: 1, refills: 2, status: "sent", time: "12:05", date: "13 Jun", notes: "" },
  { id: "rx5", patientName: "Pieter Joubert", medicine: "Warfarin", strength: "5mg", dosage: "1 tablet", frequency: "Once daily (PM)", duration: "30 days", quantity: 30, refills: 6, status: "sent", time: "13:42", date: "13 Jun", notes: "" },
];

export const RECENT_PRESCRIBED = [
  { medicine: "Amlodipine", strength: "10mg", frequency: "Once daily" },
  { medicine: "Glucophage", strength: "850mg", frequency: "Twice daily" },
  { medicine: "Augmentin", strength: "875mg/125mg", frequency: "Twice daily" },
  { medicine: "Ventolin", strength: "100mcg", frequency: "2 puffs PRN" },
  { medicine: "Brufen", strength: "400mg", frequency: "Three times daily" },
];

export const CLINICAL_NOTES: ClinicalNote[] = [
  {
    id: "n1", patientName: "Thandiwe Mokoena", doctorName: "Dr. Sipho Dlamini", date: "12 Jun 2025", time: "09:08",
    title: "Hypertension follow-up", type: "follow-up",
    chiefComplaint: "Hypertension follow-up — persistent home BP 150s/90s.",
    subjective: "57yo F, known HTN ×6 yrs, on Amlodipine 10mg OD. Reports adherence. No chest pain, SOB, palpitations. Diet high in salt.",
    objective: "BP 154/96 (R arm, seated), HR 78, BMI 31.2. Heart S1S2 normal, no murmurs. Lungs clear. No pedal oedema.",
    assessment: "Uncontrolled stage 2 hypertension despite max CCB. Likely salt-sensitive + obesity contribution.",
    plan: "1. Add Indapamide 1.5mg OD. 2. Reinforce DASH diet, refer to dietitian. 3. Home BP log ×2 weeks. 4. Review in 2 weeks. 5. ECG today.",
    alerts: ["BP >150/90"], prescriptions: [{ medicine: "Indapamide", dosage: "1.5mg OD", instructions: "Take in the morning" }],
    status: "final",
  },
  {
    id: "n2", patientName: "Sipho Dlamini", doctorName: "Dr. Sipho Dlamini", date: "10 Jun 2025", time: "11:24",
    title: "Post-op cardiac review", type: "follow-up",
    chiefComplaint: "Post-op cardiac review (CABG ×3, day 28).",
    subjective: "58yo M, 4 weeks post-CABG. Reports good recovery, walking 30 min daily without angina. Compliant with dual antiplatelet + statin.",
    objective: "BP 128/80, HR 68 regular. Sternum well-healed, no discharge. Lungs clear. Wound clean. No peripheral oedema.",
    assessment: "Uncomplicated post-op recovery. Cardiac rehab progressing well.",
    plan: "1. Continue current meds. 2. Increment walking to 45 min. 3. Echo at 3 months. 4. Review 6 weeks.",
    alerts: [], prescriptions: [],
    status: "final",
  },
  {
    id: "n3", patientName: "Aisha Patel", doctorName: "Dr. Sipho Dlamini", date: "08 Jun 2025", time: "14:10",
    title: "Diabetes T2 quarterly review", type: "follow-up",
    chiefComplaint: "Diabetes T2 — quarterly review.",
    subjective: "52yo F, T2DM ×8 yrs, on Metformin 850mg BD. Reports polyuria improved. Diet moderate carb. Walks 3×/wk.",
    objective: "BP 132/82, HR 74, BMI 29.6. Feet intact, monofilament normal. Fundi: no retinopathy.",
    assessment: "Suboptimal glycaemic control (HbA1c 8.1%). Eligible for SGLT2 add-on.",
    plan: "1. Add Empagliflozin 10mg OD. 2. Reinforce carb counting. 3. Repeat HbA1c in 3 months. 4. Annual eye screen booked.",
    alerts: ["HbA1c 8.1%"], prescriptions: [{ medicine: "Empagliflozin", dosage: "10mg OD", instructions: "Take before breakfast" }],
    status: "final",
  },
  {
    id: "n4", patientName: "Johan van der Merwe", doctorName: "Dr. Sipho Dlamini", date: "05 Jun 2025", time: "10:30",
    title: "Exertional chest pain assessment", type: "consultation",
    chiefComplaint: "Exertional chest pain — stable angina.",
    subjective: "61yo M, known CAD, on Atorvastatin 80mg, Aspirin, Bisoprolol. Recent chest pain on climbing >2 flights.",
    objective: "BP 138/86, HR 64. Heart sounds normal. Lungs clear. No signs of heart failure.",
    assessment: "Stable angina, likely progressive CAD. Needs risk stratification.",
    plan: "1. Increase Bisoprolol to 5mg OD. 2. Add ISDN 20mg BD. 3. Referral for stress echo. 4. Lipid panel + HbA1c.",
    alerts: ["Chest pain on exertion"], prescriptions: [{ medicine: "Bisoprolol", dosage: "5mg OD", instructions: "Increase from 2.5mg" }],
    status: "final",
  },
  {
    id: "n5", patientName: "Lerato Khumalo", doctorName: "Dr. Sipho Dlamini", date: "01 Jun 2025", time: "13:15",
    title: "Asthma management review", type: "follow-up",
    chiefComplaint: "Asthma — persistent nocturnal wheeze.",
    subjective: "34yo F, moderate persistent asthma, on Salbutamol PRN. Wakes 3×/wk with wheeze. No recent ED visits.",
    objective: "BP 118/76, HR 80, SpO2 97%. Mild expiratory wheeze bilaterally. No accessory muscle use.",
    assessment: "Moderate persistent asthma, step-up indicated.",
    plan: "1. Start Beclometasone 200mcg BD inhaler. 2. Continue Salbutamol PRN. 3. Asthma action plan. 4. Peak flow diary.",
    alerts: [], prescriptions: [{ medicine: "Beclometasone", dosage: "200mcg BD", instructions: "Inhale after rinsing mouth" }],
    status: "final",
  },
  {
    id: "n6", patientName: "Pieter Joubert", doctorName: "Dr. Sipho Dlamini", date: "28 May 2025", time: "16:40",
    title: "AFib rate control check", type: "follow-up",
    chiefComplaint: "Atrial fibrillation — rate control check.",
    subjective: "67yo M, paroxysmal AF, on Warfarin (INR target 2.5) + Bisoprolol. Reports palpitations less frequent.",
    objective: "BP 124/78, HR 72 irregularly irregular. No signs of failure. INR 2.6 (in range).",
    assessment: "AF well-rate-controlled, anticoagulation therapeutic.",
    plan: "1. Continue Warfarin, INR monthly. 2. Continue Bisoprolol. 3. Consider DOAC if renal function stable.",
    alerts: [], prescriptions: [],
    status: "final",
  },
  {
    id: "n7", patientName: "Naledi Mthembu", doctorName: "Dr. Sipho Dlamini", date: "26 May 2025", time: "09:55",
    title: "Pre-anaesthetic assessment", type: "procedure",
    chiefComplaint: "Pre-anaesthetic assessment — elective cholecystectomy.",
    subjective: "29yo F, otherwise well. No chronic meds. No allergies. FHx: nil relevant.",
    objective: "BP 110/70, HR 68, BMI 24.1. CVS/RS unremarkable. ASA II.",
    assessment: "Fit for general anaesthesia. ASA II.",
    plan: "1. FBC + U&E ordered. 2. ECG today. 3. Group & save. 4. Fasting instructions given.",
    alerts: [], prescriptions: [],
    status: "draft",
  },
  {
    id: "n8", patientName: "Bongani Zulu", doctorName: "Dr. Sipho Dlamini", date: "18 May 2025", time: "11:20",
    title: "Tension-type headache workup", type: "consultation",
    chiefComplaint: "Recurrent tension-type headaches.",
    subjective: "41yo M, daily bilateral band-like headaches, worse with screen time. No red flags. No meds overuse.",
    objective: "BP 126/80, HR 72. Neuro exam normal. Fundi normal. No neck stiffness.",
    assessment: "Tension-type headache, likely stress/posture-related.",
    plan: "1. Trial Amitriptyline 10mg ON. 2. Screen-time breaks. 3. Hydration. 4. Headache diary.",
    alerts: [], prescriptions: [{ medicine: "Amitriptyline", dosage: "10mg ON", instructions: "Take at bedtime" }],
    status: "final",
  },
];

export const CONVERSATIONS: Conversation[] = [
  {
    id: "c1", patientName: "Thandiwe Mokoena", patientEmail: "thandiwe@email.com", initials: "TM", role: "patient",
    lastMessage: "Doctor, my BP is 156/98 today…", lastTime: "09:42", unread: 2, online: true,
    messages: [
      { id: "m1", from: "them", text: "Good morning Dr. Dlamini", time: "09:38" },
      { id: "m2", from: "them", text: "I took my BP at home like you said — 156/98. Should I take an extra pill?", time: "09:39" },
      { id: "m3", from: "me", text: "Morning Thandiwe. Please don't take an extra dose. Did you take the morning Amlodipine with breakfast?", time: "09:41" },
      { id: "m4", from: "them", text: "Doctor, my BP is 156/98 today…", time: "09:42" },
    ],
  },
  {
    id: "c2", patientName: "Nurse N. Nkosi", patientEmail: "nkosi@hospital.co.za", initials: "NN", role: "staff",
    lastMessage: "Bed 14 in ICU ready for your patient", lastTime: "09:21", unread: 0, online: true,
    messages: [
      { id: "m1", from: "them", text: "Bed 14 in ICU ready for your patient — Sipho Dlamini post-op.", time: "09:21" },
      { id: "m2", from: "me", text: "Thanks Nomsa. Sending transfer order now.", time: "09:22" },
    ],
  },
  {
    id: "c3", patientName: "Aisha Patel", patientEmail: "aisha.p@email.com", initials: "AP", role: "patient",
    lastMessage: "Thank you for the new script 🙏", lastTime: "Yesterday", unread: 0, online: false,
    messages: [
      { id: "m1", from: "me", text: "Added Empagliflozin to your chart. Should be at Clicks by evening.", time: "Yesterday 17:04" },
      { id: "m2", from: "them", text: "Thank you for the new script 🙏", time: "Yesterday 18:30" },
    ],
  },
  {
    id: "c4", patientName: "Dr. R. Naidoo (Dermatology)", patientEmail: "naidoo@derm.co.za", initials: "RN", role: "staff",
    lastMessage: "Re: shared patient — skin biopsy result", lastTime: "Yesterday", unread: 1, online: false,
    messages: [
      { id: "m1", from: "them", text: "Re: shared patient — skin biopsy result came back benign. No further derm input needed.", time: "Yesterday 14:12" },
    ],
  },
  {
    id: "c5", patientName: "Johan van der Merwe", patientEmail: "johan.vdm@email.com", initials: "JV", role: "patient",
    lastMessage: "The chest pain is much better now", lastTime: "Mon", unread: 0, online: false,
    messages: [
      { id: "m1", from: "them", text: "The chest pain is much better now, doctor. Walking up the stairs without stopping.", time: "Mon 16:50" },
      { id: "m2", from: "me", text: "Great news. See you for the stress echo next week.", time: "Mon 17:02" },
    ],
  },
];

export const VIDEO_CONSULTS: VideoConsult[] = [
  { id: "v1", patientName: "Sipho Dlamini", initials: "SD", reason: "Post-op cardiac review", type: "video", date: "13 Jun", time: "09:45", duration: "30 min", status: "upcoming" },
  { id: "v2", patientName: "Johan van der Merwe", initials: "JV", reason: "Chest pain — minor", type: "video", date: "13 Jun", time: "11:15", duration: "20 min", status: "upcoming" },
  { id: "v3", patientName: "Pieter Joubert", initials: "PJ", reason: "AFib — medication titration", type: "video", date: "13 Jun", time: "13:30", duration: "30 min", status: "upcoming" },
  { id: "v4", patientName: "Yusuf Adams", initials: "YA", reason: "Hyperlipidaemia follow-up", type: "video", date: "13 Jun", time: "15:00", duration: "20 min", status: "upcoming" },
  { id: "v5", patientName: "Bongani Zulu", initials: "BZ", reason: "Headache workup", type: "in-person", date: "12 Jun", time: "16:00", duration: "25 min", status: "completed" },
  { id: "v6", patientName: "Annelize Botha", initials: "AB", reason: "Migraine management", type: "video", date: "10 Jun", time: "11:00", duration: "20 min", status: "completed" },
  { id: "v7", patientName: "Kagiso Sithole", initials: "KS", reason: "Gout flare review", type: "in-person", date: "08 Jun", time: "10:00", duration: "15 min", status: "missed" },
];
