/* Mock data for MedLink SA dashboards & pages */

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "zu", label: "isiZulu", native: "isiZulu" },
  { code: "af", label: "Afrikaans", native: "Afrikaans" },
  { code: "st", label: "Sesotho", native: "Sesotho" },
];

/* ---------- Medicines with prices across pharmacies ---------- */
export type Medicine = {
  id: string;
  name: string;
  generic: string;
  form: string;
  strength: string;
  pack: string;
  schedule: number; // 0-6 SA medicine scheduling
  requiresPrescription: boolean;
  category: string;
  prices: Array<{
    pharmacy: string;
    price: number;
    inStock: boolean;
    delivery: boolean;
    distanceKm: number;
  }>;
};

export const MEDICINES: Medicine[] = [
  {
    id: "m1",
    name: "Panado",
    generic: "Paracetamol",
    form: "Tablet",
    strength: "500mg",
    pack: "24 tablets",
    schedule: 0,
    requiresPrescription: false,
    category: "Pain & fever",
    prices: [
      { pharmacy: "Clicks", price: 24.99, inStock: true, delivery: true, distanceKm: 0.9 },
      { pharmacy: "Dis-Chem", price: 22.5, inStock: true, delivery: true, distanceKm: 2.1 },
      { pharmacy: "Rosebank Pharmacy", price: 27.0, inStock: true, delivery: false, distanceKm: 1.4 },
      { pharmacy: "Pick n Pay Pharmacy", price: 19.99, inStock: false, delivery: true, distanceKm: 3.2 },
    ],
  },
  {
    id: "m2",
    name: "Augmentin",
    generic: "Amoxicillin + Clavulanic acid",
    form: "Tablet",
    strength: "875mg/125mg",
    pack: "14 tablets",
    schedule: 4,
    requiresPrescription: true,
    category: "Antibiotic",
    prices: [
      { pharmacy: "Clicks", price: 189.99, inStock: true, delivery: true, distanceKm: 0.9 },
      { pharmacy: "Dis-Chem", price: 174.5, inStock: true, delivery: true, distanceKm: 2.1 },
      { pharmacy: "Rosebank Pharmacy", price: 205.0, inStock: false, delivery: false, distanceKm: 1.4 },
    ],
  },
  {
    id: "m3",
    name: "Glucophage",
    generic: "Metformin",
    form: "Tablet",
    strength: "850mg",
    pack: "60 tablets",
    schedule: 4,
    requiresPrescription: true,
    category: "Diabetes",
    prices: [
      { pharmacy: "Clicks", price: 89.99, inStock: true, delivery: true, distanceKm: 0.9 },
      { pharmacy: "Dis-Chem", price: 79.0, inStock: true, delivery: true, distanceKm: 2.1 },
      { pharmacy: "Pick n Pay Pharmacy", price: 75.5, inStock: true, delivery: true, distanceKm: 3.2 },
    ],
  },
  {
    id: "m4",
    name: "Ventolin",
    generic: "Salbutamol",
    form: "Inhaler",
    strength: "100mcg",
    pack: "200 doses",
    schedule: 3,
    requiresPrescription: true,
    category: "Asthma",
    prices: [
      { pharmacy: "Clicks", price: 129.99, inStock: true, delivery: true, distanceKm: 0.9 },
      { pharmacy: "Dis-Chem", price: 119.0, inStock: false, delivery: true, distanceKm: 2.1 },
      { pharmacy: "Rosebank Pharmacy", price: 135.0, inStock: true, delivery: false, distanceKm: 1.4 },
    ],
  },
  {
    id: "m5",
    name: "Allergex",
    generic: "Chlorphenamine",
    form: "Tablet",
    strength: "4mg",
    pack: "30 tablets",
    schedule: 1,
    requiresPrescription: false,
    category: "Allergy",
    prices: [
      { pharmacy: "Clicks", price: 34.99, inStock: true, delivery: true, distanceKm: 0.9 },
      { pharmacy: "Dis-Chem", price: 29.5, inStock: true, delivery: true, distanceKm: 2.1 },
      { pharmacy: "Pick n Pay Pharmacy", price: 32.0, inStock: true, delivery: true, distanceKm: 3.2 },
    ],
  },
  {
    id: "m6",
    name: "Brufen",
    generic: "Ibuprofen",
    form: "Tablet",
    strength: "400mg",
    pack: "20 tablets",
    schedule: 2,
    requiresPrescription: false,
    category: "Pain & inflammation",
    prices: [
      { pharmacy: "Clicks", price: 39.99, inStock: true, delivery: true, distanceKm: 0.9 },
      { pharmacy: "Dis-Chem", price: 35.0, inStock: true, delivery: true, distanceKm: 2.1 },
      { pharmacy: "Rosebank Pharmacy", price: 42.0, inStock: true, delivery: false, distanceKm: 1.4 },
    ],
  },
];

/* ---------- Facilities ---------- */
export type Facility = {
  id: string;
  name: string;
  category: "hospital" | "clinic" | "pharmacy";
  location: string;
  province: string;
  distanceKm: number;
  rating: number;
  open: boolean;
  openUntil: string;
  beds?: { total: number; available: number };
  queueWait?: number; // minutes
  tags: string[];
  lat: number;
  lng: number;
};

export const FACILITIES: Facility[] = [
  {
    id: "f1",
    name: "Chris Hani Baragwanath Hospital",
    category: "hospital",
    location: "Soweto, Gauteng",
    province: "Gauteng",
    distanceKm: 3.2,
    rating: 4.4,
    open: true,
    openUntil: "24/7",
    beds: { total: 2888, available: 412 },
    queueWait: 47,
    tags: ["Trauma", "ICU", "Paediatrics", "Teaching"],
    lat: -26.2731,
    lng: 27.9495,
  },
  {
    id: "f2",
    name: "Charlotte Maxeke Hospital",
    category: "hospital",
    location: "Parktown, Gauteng",
    province: "Gauteng",
    distanceKm: 5.1,
    rating: 4.2,
    open: true,
    openUntil: "24/7",
    beds: { total: 1088, available: 187 },
    queueWait: 62,
    tags: ["Trauma", "Cardiac", "Maternity"],
    lat: -26.1715,
    lng: 28.0419,
  },
  {
    id: "f3",
    name: "Rosebank Clinic",
    category: "clinic",
    location: "Rosebank, Gauteng",
    province: "Gauteng",
    distanceKm: 0.8,
    rating: 4.6,
    open: true,
    openUntil: "20:00",
    queueWait: 18,
    tags: ["GP", "Vaccines", "Family medicine"],
    lat: -26.1436,
    lng: 28.0396,
  },
  {
    id: "f4",
    name: "Clicks Pharmacy — Rosebank",
    category: "pharmacy",
    location: "Rosebank, Gauteng",
    province: "Gauteng",
    distanceKm: 0.9,
    rating: 4.6,
    open: true,
    openUntil: "21:00",
    tags: ["Refills", "Drive-thru", "Delivery"],
    lat: -26.1438,
    lng: 28.0401,
  },
  {
    id: "f5",
    name: "Dis-Chem — Sandton",
    category: "pharmacy",
    location: "Sandton, Gauteng",
    province: "Gauteng",
    distanceKm: 2.1,
    rating: 4.8,
    open: true,
    openUntil: "22:00",
    tags: ["Clinic", "Vaccines", "Delivery", "24h ER"],
    lat: -26.1076,
    lng: 28.0567,
  },
  {
    id: "f6",
    name: "Groote Schuur Hospital",
    category: "hospital",
    location: "Cape Town, Western Cape",
    province: "Western Cape",
    distanceKm: 1412,
    rating: 4.3,
    open: true,
    openUntil: "24/7",
    beds: { total: 952, available: 134 },
    queueWait: 71,
    tags: ["Transplant", "Cardiac", "Teaching"],
    lat: -33.9407,
    lng: 18.4612,
  },
];

/* ---------- Queue / service data ---------- */
export type QueueTicket = {
  number: number;
  facility: string;
  service: string;
  issuedAt: string;
  estimatedWaitMin: number;
  status: "waiting" | "called" | "serving" | "missed" | "completed";
};

export const CURRENT_TICKET: QueueTicket = {
  number: 42,
  facility: "Rosebank Clinic",
  service: "General check-up",
  issuedAt: "Today, 09:14",
  estimatedWaitMin: 38,
  status: "waiting",
};

export const QUEUE_STATE = {
  nowServing: 37,
  totalAhead: 4,
  totalInQueue: 23,
  avgWaitMin: 12,
  lastUpdated: "just now",
};

/* ---------- Patient dashboard data ---------- */
export const PATIENT_APPOINTMENTS = [
  {
    id: "a1",
    doctor: "Dr. Sipho Dlamini",
    specialty: "Cardiology",
    facility: "Chris Hani Baragwanath",
    date: "Today",
    time: "16:00",
    type: "video" as const,
    status: "confirmed" as const,
  },
  {
    id: "a2",
    doctor: "Dr. Thandiwe Mokoena",
    specialty: "General Practice",
    facility: "Rosebank Clinic",
    date: "Tomorrow",
    time: "09:30",
    type: "in-person" as const,
    status: "confirmed" as const,
  },
  {
    id: "a3",
    doctor: "Dr. Naidoo",
    specialty: "Dermatology",
    facility: "Video consult",
    date: "Fri, 21 Jun",
    time: "11:00",
    type: "video" as const,
    status: "pending" as const,
  },
  {
    id: "a4",
    doctor: "Dr. Mokoena",
    specialty: "General Practice",
    facility: "Rosebank Clinic",
    date: "02 Jun",
    time: "10:00",
    type: "in-person" as const,
    status: "completed" as const,
  },
  {
    id: "a5",
    doctor: "Dr. Sipho Dlamini",
    specialty: "Cardiology",
    facility: "Chris Hani Baragwanath",
    date: "28 May",
    time: "14:30",
    type: "video" as const,
    status: "completed" as const,
  },
  {
    id: "a6",
    doctor: "Dr. Naidoo",
    specialty: "Dermatology",
    facility: "Video consult",
    date: "20 May",
    time: "09:00",
    type: "video" as const,
    status: "cancelled" as const,
  },
];

export const PATIENT_PRESCRIPTIONS = [
  {
    id: "p1",
    medicine: "Glucophage 850mg",
    dosage: "1 tablet twice daily",
    prescribedBy: "Dr. Dlamini",
    date: "12 Jun 2025",
    refillsLeft: 2,
    status: "active" as const,
  },
  {
    id: "p2",
    medicine: "Ventolin Inhaler",
    dosage: "2 puffs as needed",
    prescribedBy: "Dr. Mokoena",
    date: "03 Jun 2025",
    refillsLeft: 1,
    status: "active" as const,
  },
  {
    id: "p3",
    medicine: "Augmentin 875mg",
    dosage: "1 tablet twice daily × 7 days",
    prescribedBy: "Dr. Dlamini",
    date: "28 May 2025",
    refillsLeft: 0,
    status: "completed" as const,
  },
];

export const PATIENT_RECORDS = [
  {
    id: "r1",
    title: "Cardiology follow-up",
    facility: "Chris Hani Baragwanath",
    date: "12 Jun 2025",
    doctor: "Dr. Dlamini",
    type: "Consultation" as const,
  },
  {
    id: "r2",
    title: "Chest X-Ray",
    facility: "Rosebank Clinic",
    date: "03 Jun 2025",
    doctor: "Dr. Mokoena",
    type: "Imaging" as const,
  },
  {
    id: "r3",
    title: "Blood panel — HbA1c",
    facility: "Ampath Lab",
    date: "28 May 2025",
    doctor: "Dr. Dlamini",
    type: "Lab" as const,
  },
];

export const PATIENT_VITALS = [
  { day: "Mon", bp: 128, hr: 74, spo2: 97, glucose: 6.4 },
  { day: "Tue", bp: 131, hr: 76, spo2: 98, glucose: 6.8 },
  { day: "Wed", bp: 126, hr: 72, spo2: 98, glucose: 6.1 },
  { day: "Thu", bp: 133, hr: 78, spo2: 96, glucose: 7.2 },
  { day: "Fri", bp: 129, hr: 75, spo2: 97, glucose: 6.5 },
  { day: "Sat", bp: 124, hr: 71, spo2: 98, glucose: 6.0 },
  { day: "Sun", bp: 127, hr: 73, spo2: 98, glucose: 6.3 },
];

/* ---------- Doctor dashboard data ---------- */
export const DOCTOR_SCHEDULE = [
  {
    id: "s1",
    patient: "Thandiwe M.",
    age: 47,
    reason: "Hypertension follow-up",
    time: "09:00",
    duration: 30,
    type: "in-person" as const,
    status: "checked-in" as const,
  },
  {
    id: "s2",
    patient: "Sipho D.",
    age: 58,
    reason: "Post-op cardiac review",
    time: "09:45",
    duration: 30,
    type: "video" as const,
    status: "upcoming" as const,
  },
  {
    id: "s3",
    patient: "Aisha P.",
    age: 52,
    reason: "Diabetes T2 — quarterly",
    time: "10:30",
    duration: 30,
    type: "in-person" as const,
    status: "upcoming" as const,
  },
  {
    id: "s4",
    patient: "Johan V.",
    age: 61,
    reason: "Chest pain — minor",
    time: "11:15",
    duration: 20,
    type: "video" as const,
    status: "upcoming" as const,
  },
];

export const DOCTOR_HIGH_RISK = [
  {
    id: "h1",
    name: "Thandiwe Mokoena",
    initials: "TM",
    condition: "Hypertension · Stage 2",
    risk: "critical" as const,
    lastVisit: "12 Jun",
    trend: [128, 131, 126, 133, 129, 124, 127],
  },
  {
    id: "h2",
    name: "Sipho Dlamini",
    initials: "SD",
    condition: "Post-op cardiac",
    risk: "high" as const,
    lastVisit: "10 Jun",
    trend: [86, 84, 90, 88, 92, 87, 89],
  },
  {
    id: "h3",
    name: "Aisha Patel",
    initials: "AP",
    condition: "Diabetes T2",
    risk: "moderate" as const,
    lastVisit: "08 Jun",
    trend: [142, 138, 140, 145, 139, 141, 137],
  },
];

/* ---------- Hospital dashboard data ---------- */
export const BED_GRID = Array.from({ length: 80 }).map((_, i) => ({
  id: `bed-${i + 1}`,
  ward: ["ICU", "General", "Paediatrics", "Maternity", "Surgical"][i % 5],
  status: (["occupied", "available", "cleaning", "reserved"] as const)[
    ((i * 7) % 4)
  ],
}));

export const HOSPITAL_STAFF = [
  { id: "st1", name: "Dr. Sipho Dlamini", role: "Cardiologist", status: "on-duty", patients: 12, verified: true },
  { id: "st2", name: "Dr. Thandiwe Mokoena", role: "GP", status: "on-duty", patients: 8, verified: true },
  { id: "st3", name: "Nurse N. Nkosi", role: "ICU Nurse", status: "on-duty", patients: 4, verified: true },
  { id: "st4", name: "Dr. R. Naidoo", role: "Dermatologist", status: "off-duty", patients: 0, verified: true },
  { id: "st5", name: "Dr. (pending) K. Adams", role: "Paediatrics", status: "pending", patients: 0, verified: false },
];

export const HOSPITAL_QUEUE = [
  { number: 37, name: "M. Khumalo", service: "Triage", status: "serving", waitMin: 0 },
  { number: 38, name: "P. Sithole", service: "General", status: "called", waitMin: 2 },
  { number: 39, name: "L. Botha", service: "General", status: "waiting", waitMin: 8 },
  { number: 40, name: "R. Pillay", service: "Lab", status: "waiting", waitMin: 14 },
  { number: 41, name: "T. Molefe", service: "General", status: "waiting", waitMin: 22 },
  { number: 42, name: "You", service: "General", status: "waiting", waitMin: 38 },
];

export const APPROVALS_PENDING = [
  { id: "ap1", name: "Dr. K. Adams", role: "Paediatrician", hpcsa: "MP088234", applied: "2 days ago" },
  { id: "ap2", name: "Nurse L. Zulu", role: "ICU Nurse", sanc: "SANC-449821", applied: "5 hours ago" },
];

/* ---------- Pharmacy dashboard data ---------- */
export const PHARMACY_ORDERS = [
  { id: "o1", patient: "Thandiwe M.", medicine: "Glucophage 850mg × 60", price: 89.99, status: "new" as const, delivery: true, address: "Rosebank, JHB" },
  { id: "o2", patient: "Sipho D.", medicine: "Augmentin 875mg × 14", price: 189.99, status: "preparing" as const, delivery: true, address: "Sandton, JHB" },
  { id: "o3", patient: "Aisha P.", medicine: "Ventolin Inhaler", price: 129.99, status: "ready" as const, delivery: false, address: "In-store pickup" },
  { id: "o4", patient: "Johan V.", medicine: "Brufen 400mg × 20", price: 39.99, status: "new" as const, delivery: true, address: "Parktown, JHB" },
  { id: "o5", patient: "Walk-in", medicine: "Panado 500mg × 24", price: 24.99, status: "completed" as const, delivery: false, address: "In-store" },
];

export const PHARMACY_INVENTORY = [
  { id: "i1", name: "Panado 500mg", stock: 240, reorder: 50, status: "ok" as const },
  { id: "i2", name: "Augmentin 875mg", stock: 18, reorder: 30, status: "low" as const },
  { id: "i3", name: "Glucophage 850mg", stock: 92, reorder: 40, status: "ok" as const },
  { id: "i4", name: "Ventolin Inhaler", stock: 7, reorder: 15, status: "critical" as const },
  { id: "i5", name: "Allergex 4mg", stock: 130, reorder: 40, status: "ok" as const },
  { id: "i6", name: "Brufen 400mg", stock: 22, reorder: 30, status: "low" as const },
];

/* ---------- Admin dashboard data ---------- */
export const ADMIN_USERS = [
  { id: "u1", name: "Thandiwe Mokoena", email: "adminpatient@gmail.com", role: "Patient", verified: "approved", joined: "12 Jan 2025" },
  { id: "u2", name: "Dr. Sipho Dlamini", email: "admindoctor@gmail.com", role: "Doctor", verified: "approved", joined: "08 Feb 2025" },
  { id: "u3", name: "Chris Hani Baragwanath", email: "adminhospital@gmail.com", role: "Hospital", verified: "approved", joined: "03 Jan 2025" },
  { id: "u4", name: "Clicks Rosebank", email: "adminpharmacy@gmail.com", role: "Pharmacy", verified: "approved", joined: "22 Feb 2025" },
  { id: "u5", name: "Dr. K. Adams", email: "k.adams@hpcsa.za", role: "Doctor", verified: "pending", joined: "2 days ago" },
  { id: "u6", name: "Netcare Sunninghill", email: "admin@sunninghill.netcare.co.za", role: "Hospital", verified: "pending", joined: "1 day ago" },
  { id: "u7", name: "L. Zulu", email: "lzulu@nurse.za", role: "Doctor", verified: "pending", joined: "5 hours ago" },
];

export const ADMIN_HOSPITALS = [
  { id: "h1", name: "Chris Hani Baragwanath", province: "Gauteng", beds: 2888, doctors: 184, verified: true, joined: "03 Jan 2025" },
  { id: "h2", name: "Charlotte Maxeke", province: "Gauteng", beds: 1088, doctors: 112, verified: true, joined: "15 Jan 2025" },
  { id: "h3", name: "Groote Schuur", province: "Western Cape", beds: 952, doctors: 98, verified: true, joined: "28 Jan 2025" },
  { id: "h4", name: "Netcare Sunninghill", province: "Gauteng", beds: 432, doctors: 64, verified: false, joined: "1 day ago" },
  { id: "h5", name: "Inkosi Albert Luthuli", province: "KwaZulu-Natal", beds: 836, doctors: 89, verified: false, joined: "3 days ago" },
];

export const ADMIN_AUDIT = [
  { id: "a1", actor: "Dr. Dlamini", action: "signed prescription", target: "Glucophage 850mg — Patient #4821", time: "2m ago", kind: "create" as const },
  { id: "a2", actor: "System", action: "synced 14 records to DHIS2", target: "Gauteng · Today", time: "8m ago", kind: "system" as const },
  { id: "a3", actor: "Admin", action: "verified facility", target: "Clicks Pharmacy — Rosebank", time: "21m ago", kind: "verify" as const },
  { id: "a4", actor: "Patient #4821", action: "logged in via passkey", target: "iPhone · Face ID", time: "34m ago", kind: "auth" as const },
  { id: "a5", actor: "Dr. Dlamini", action: "edited clinical note", target: "Hypertension follow-up · #3390", time: "1h ago", kind: "edit" as const },
  { id: "a6", actor: "Admin", action: "blocked account", target: "user #2299 (fraud)", time: "2h ago", kind: "delete" as const },
  { id: "a7", actor: "System", action: "flagged 3 high-risk patients", target: "Cardiology ward", time: "2h ago", kind: "system" as const },
];

export const NETWORK_ACTIVITY = [
  { d: "Mon", consults: 4200, scripts: 1800 },
  { d: "Tue", consults: 4800, scripts: 2100 },
  { d: "Wed", consults: 5100, scripts: 2300 },
  { d: "Thu", consults: 4900, scripts: 2250 },
  { d: "Fri", consults: 5600, scripts: 2600 },
  { d: "Sat", consults: 3400, scripts: 1500 },
  { d: "Sun", consults: 2800, scripts: 1200 },
];

export const PROVINCE_SPLIT = [
  { name: "Gauteng", value: 38, color: "#2563eb" },
  { name: "KwaZulu-Natal", value: 22, color: "#06b6d4" },
  { name: "Western Cape", value: 18, color: "#8b5cf6" },
  { name: "Eastern Cape", value: 9, color: "#10b981" },
  { name: "Other", value: 13, color: "#f59e0b" },
];

/* ---------- Explore roles/features (kept for landing) ---------- */
export const PAIN_POINTS = [
  { title: "Queueing for hours to be seen for 5 minutes", solution: "Smart triage queues, teleconsults and SMS-ready turn times so patients stop waiting in corridors.", icon: "Clock" },
  { title: "Records that vanish between clinics", solution: "One patient, one record — carried on the network, not the folder. FHIR R4 compliant.", icon: "FolderX" },
  { title: "Pharmacies that never got the script", solution: "E-prescriptions route straight to the nearest open pharmacy — with stock checks.", icon: "Pill" },
  { title: "Beds no one knew were free", solution: "A live heatmap of every ward, every hospital — so ambulances stop circling.", icon: "BedDouble" },
  { title: "Passwords nobody can remember", solution: "Passkeys & WhatsApp OTP. Sign in with a face, a fingerprint or a tap.", icon: "KeyRound" },
  { title: "Rural clinics left in the dark", solution: "Offline-first capture. Work with zero signal, sync the moment it returns.", icon: "WifiOff" },
];
