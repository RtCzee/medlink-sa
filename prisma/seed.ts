import { PrismaClient, UserRole, AppointmentStatus, OrderStatus, EquipmentStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const HASH = bcrypt.hashSync("12345678", 10);

// ─── Helper ───────────────────────────────────────────────
function upsertUser(email: string, name: string, role: UserRole) {
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, passwordHash: HASH, verified: true },
  });
}

// ─── 1. Users ─────────────────────────────────────────────
const admin = await upsertUser("admin@gmail.com", "Admin User", "admin");
const patientUser = await upsertUser("adminpatient@gmail.com", "Thandiwe Mokoena", "patient");
const doctorUser = await upsertUser("admindoctor@gmail.com", "Dr. Sipho Dlamini", "doctor");
const hospitalUser = await upsertUser("adminhospital@gmail.com", "Chris Hani Baragwanath", "hospital");
const pharmacyUser = await upsertUser("adminpharmacy@gmail.com", "Clicks Rosebank", "pharmacy");

// Additional doctor
const doctorNaidoo = await upsertUser("dr.naidoo@medlinksa.co.za", "Dr. R. Naidoo", "doctor");
const doctorMokoena = await upsertUser("dr.mokoena@medlinksa.co.za", "Dr. Thandiwe Mokoena", "doctor");
const doctorAdams = await upsertUser("dr.adams@medlinksa.co.za", "Dr. K. Adams", "doctor");

// Additional patients
const patientDlamini = await upsertUser("sipho.d@patient.co.za", "Sipho Dlamini", "patient");
const patientPatel = await upsertUser("aisha.p@patient.co.za", "Aisha Patel", "patient");
const patientVanWyk = await upsertUser("johan.v@patient.co.za", "Johan van Wyk", "patient");

// Additional hospital users
const hospitalCharlotte = await upsertUser("charlotte@hospital.co.za", "Charlotte Maxeke Hospital", "hospital");
const hospitalGrooteSchuur = await upsertUser("groote.schuur@hospital.co.za", "Groote Schuur Hospital", "hospital");

// Additional pharmacy
const pharmacyDischem = await upsertUser("dischem@sandton.co.za", "Dis-Chem Sandton", "pharmacy");
const pharmacyRosebank = await upsertUser("rosebank.rx@pharmacy.co.za", "Rosebank Pharmacy", "pharmacy");

console.log("Seeded 15 users");

// ─── 2. Doctor Profiles ──────────────────────────────────
const dp1 = await prisma.doctorProfile.upsert({
  where: { userId: doctorUser.id },
  update: {},
  create: {
    userId: doctorUser.id,
    specialty: "Cardiology",
    licenseNumber: "MP0293847",
    facility: "Chris Hani Baragwanath Hospital",
    bio: "Cardiologist with 15 years of experience in interventional cardiology.",
  },
});
const dp2 = await prisma.doctorProfile.upsert({
  where: { userId: doctorNaidoo.id },
  update: {},
  create: {
    userId: doctorNaidoo.id,
    specialty: "Dermatology",
    licenseNumber: "MP0384756",
    facility: "Rosebank Clinic",
    bio: "Specialist dermatologist focusing on skin cancer screening and cosmetic dermatology.",
  },
});
const dp3 = await prisma.doctorProfile.upsert({
  where: { userId: doctorMokoena.id },
  update: {},
  create: {
    userId: doctorMokoena.id,
    specialty: "General Practice",
    licenseNumber: "MP0475638",
    facility: "Rosebank Clinic",
    bio: "GP with special interests in family medicine and preventive care.",
  },
});
const dp4 = await prisma.doctorProfile.upsert({
  where: { userId: doctorAdams.id },
  update: {},
  create: {
    userId: doctorAdams.id,
    specialty: "Paediatrics",
    licenseNumber: "MP0562718",
    facility: "Chris Hani Baragwanath Hospital",
    bio: "Paediatrician specialising in neonatal care and childhood infectious diseases.",
  },
});

console.log("Seeded 4 doctor profiles");

// ─── 3. Patient Profiles ─────────────────────────────────
await prisma.patientProfile.upsert({
  where: { userId: patientUser.id },
  update: {},
  create: {
    userId: patientUser.id,
    dateOfBirth: new Date("1978-03-15"),
    gender: "Female",
    idNumber: "7803150012345",
    medicalAid: "Discovery Health",
    emergencyContact: "082 345 6789",
  },
});
await prisma.patientProfile.upsert({
  where: { userId: patientDlamini.id },
  update: {},
  create: {
    userId: patientDlamini.id,
    dateOfBirth: new Date("1966-07-22"),
    gender: "Male",
    idNumber: "6607220054321",
    medicalAid: "Bonitas",
    emergencyContact: "083 456 7890",
  },
});
await prisma.patientProfile.upsert({
  where: { userId: patientPatel.id },
  update: {},
  create: {
    userId: patientPatel.id,
    dateOfBirth: new Date("1972-11-08"),
    gender: "Female",
    idNumber: "7211080032145",
    medicalAid: "Momentum",
    emergencyContact: "084 567 8901",
  },
});
await prisma.patientProfile.upsert({
  where: { userId: patientVanWyk.id },
  update: {},
  create: {
    userId: patientVanWyk.id,
    dateOfBirth: new Date("1963-04-30"),
    gender: "Male",
    idNumber: "6304300076543",
    medicalAid: "Medihelp",
    emergencyContact: "081 678 9012",
  },
});

console.log("Seeded 4 patient profiles");

// ─── 4. Hospitals + Wards + Equipment ─────────────────────
const hospitalCHB = await prisma.hospital.upsert({
  where: { id: hospitalUser.id },
  update: {},
  create: {
    id: hospitalUser.id,
    name: "Chris Hani Baragwanath Hospital",
    address: "82 Chris Hani Rd",
    city: "Soweto",
    province: "Gauteng",
    phone: "011 933 0000",
    email: "admin@chbaragwanath.co.za",
    bedCount: 2888,
    verified: true,
  },
});

// Wards for CHB
const icuWard = await prisma.ward.upsert({
  where: { id: "ward-icu" },
  update: {},
  create: {
    id: "ward-icu",
    hospitalId: hospitalCHB.id,
    name: "ICU",
    capacity: 60,
    department: "Critical Care",
  },
});
const genWard = await prisma.ward.upsert({
  where: { id: "ward-general" },
  update: {},
  create: {
    id: "ward-general",
    hospitalId: hospitalCHB.id,
    name: "General",
    capacity: 120,
    department: "Internal Medicine",
  },
});
const paedsWard = await prisma.ward.upsert({
  where: { id: "ward-paeds" },
  update: {},
  create: {
    id: "ward-paeds",
    hospitalId: hospitalCHB.id,
    name: "Paediatrics",
    capacity: 80,
    department: "Paediatrics",
  },
});
await prisma.ward.upsert({
  where: { id: "ward-maternity" },
  update: {},
  create: {
    id: "ward-maternity",
    hospitalId: hospitalCHB.id,
    name: "Maternity",
    capacity: 50,
    department: "Obstetrics",
  },
});
await prisma.ward.upsert({
  where: { id: "ward-surgical" },
  update: {},
  create: {
    id: "ward-surgical",
    hospitalId: hospitalCHB.id,
    name: "Surgical",
    capacity: 70,
    department: "Surgery",
  },
});

// Equipment
await prisma.equipment.createMany({
  data: [
    { hospitalId: hospitalCHB.id, name: "MRI Scanner", model: "Siemens MAGNETOM Vida", status: EquipmentStatus.operational, lastMaintenance: new Date("2025-04-10"), nextMaintenance: new Date("2025-10-10") },
    { hospitalId: hospitalCHB.id, name: "CT Scanner", model: "GE Revolution CT", status: EquipmentStatus.operational, lastMaintenance: new Date("2025-03-15"), nextMaintenance: new Date("2025-09-15") },
    { hospitalId: hospitalCHB.id, name: "Ventilator", model: "Hamilton C6", status: EquipmentStatus.maintenance, lastMaintenance: new Date("2025-06-01"), nextMaintenance: new Date("2025-07-01") },
    { hospitalId: hospitalCHB.id, name: "Defibrillator", model: "Philips HeartStart FRx", status: EquipmentStatus.operational, lastMaintenance: new Date("2025-05-20"), nextMaintenance: new Date("2025-11-20") },
    { hospitalId: hospitalCHB.id, name: "X-Ray Machine", model: "Fujifilm FDR D-EVO III", status: EquipmentStatus.operational, lastMaintenance: new Date("2025-02-18"), nextMaintenance: new Date("2025-08-18") },
    { hospitalId: hospitalCHB.id, name: "Ultrasound", model: "GE Voluson E10", status: EquipmentStatus.decommissioned, lastMaintenance: new Date("2024-12-01"), nextMaintenance: null },
  ],
});

// Staff
await prisma.staffMember.upsert({
  where: { userId: doctorUser.id },
  update: {},
  create: { userId: doctorUser.id, hospitalId: hospitalCHB.id, wardId: icuWard.id, position: "Cardiologist", shift: "morning" },
});
await prisma.staffMember.upsert({
  where: { userId: doctorMokoena.id },
  update: {},
  create: { userId: doctorMokoena.id, hospitalId: hospitalCHB.id, wardId: genWard.id, position: "GP", shift: "morning" },
});
await prisma.staffMember.upsert({
  where: { userId: doctorAdams.id },
  update: {},
  create: { userId: doctorAdams.id, hospitalId: hospitalCHB.id, wardId: paedsWard.id, position: "Paediatrician", shift: "afternoon" },
});

console.log("Seeded 1 hospital, 5 wards, 6 equipment, 3 staff");

// ─── 5. Pharmacist Profiles ──────────────────────────────
const pharma1 = await prisma.pharmacist.upsert({
  where: { userId: pharmacyUser.id },
  update: {},
  create: {
    userId: pharmacyUser.id,
    licenseNumber: "PCZA089234",
    pharmacyName: "Clicks Pharmacy — Rosebank",
    address: "78 Oxford Rd, Rosebank",
    phone: "011 268 4500",
  },
});
const pharma2 = await prisma.pharmacist.upsert({
  where: { userId: pharmacyDischem.id },
  update: {},
  create: {
    userId: pharmacyDischem.id,
    licenseNumber: "PCZA174839",
    pharmacyName: "Dis-Chem — Sandton",
    address: "Sandton City, Sandton",
    phone: "011 883 4700",
  },
});
const pharma3 = await prisma.pharmacist.upsert({
  where: { userId: pharmacyRosebank.id },
  update: {},
  create: {
    userId: pharmacyRosebank.id,
    licenseNumber: "PCZA293847",
    pharmacyName: "Rosebank Pharmacy",
    address: "44 Baker St, Rosebank",
    phone: "011 447 3200",
  },
});

console.log("Seeded 3 pharmacist profiles");

// ─── 6. Medicines + Prices ────────────────────────────────
const med1 = await prisma.medicine.upsert({
  where: { id: "m1" },
  update: {},
  create: {
    id: "m1", name: "Panado", generic: "Paracetamol", form: "Tablet",
    strength: "500mg", pack: "24 tablets", schedule: "0",
    requiresPrescription: false, category: "Pain & fever",
  },
});
const med2 = await prisma.medicine.upsert({
  where: { id: "m2" },
  update: {},
  create: {
    id: "m2", name: "Augmentin", generic: "Amoxicillin + Clavulanic acid", form: "Tablet",
    strength: "875mg/125mg", pack: "14 tablets", schedule: "4",
    requiresPrescription: true, category: "Antibiotic",
  },
});
const med3 = await prisma.medicine.upsert({
  where: { id: "m3" },
  update: {},
  create: {
    id: "m3", name: "Glucophage", generic: "Metformin", form: "Tablet",
    strength: "850mg", pack: "60 tablets", schedule: "4",
    requiresPrescription: true, category: "Diabetes",
  },
});
const med4 = await prisma.medicine.upsert({
  where: { id: "m4" },
  update: {},
  create: {
    id: "m4", name: "Ventolin", generic: "Salbutamol", form: "Inhaler",
    strength: "100mcg", pack: "200 doses", schedule: "3",
    requiresPrescription: true, category: "Asthma",
  },
});
const med5 = await prisma.medicine.upsert({
  where: { id: "m5" },
  update: {},
  create: {
    id: "m5", name: "Allergex", generic: "Chlorphenamine", form: "Tablet",
    strength: "4mg", pack: "30 tablets", schedule: "1",
    requiresPrescription: false, category: "Allergy",
  },
});
const med6 = await prisma.medicine.upsert({
  where: { id: "m6" },
  update: {},
  create: {
    id: "m6", name: "Brufen", generic: "Ibuprofen", form: "Tablet",
    strength: "400mg", pack: "20 tablets", schedule: "2",
    requiresPrescription: false, category: "Pain & inflammation",
  },
});

// Medicine prices across pharmacies
const allMeds = [med1, med2, med3, med4, med5, med6];
const allPharmas = [
  { pharmacist: pharma1, name: "Clicks" },
  { pharmacist: pharma2, name: "Dis-Chem" },
  { pharmacist: pharma3, name: "Rosebank Pharmacy" },
];

const priceData = [
  { medIndex: 0, prices: [{ pi: 0, price: 24.99, inStock: true, delivery: true }, { pi: 1, price: 22.5, inStock: true, delivery: true }, { pi: 2, price: 27.0, inStock: true, delivery: false }] },
  { medIndex: 1, prices: [{ pi: 0, price: 189.99, inStock: true, delivery: true }, { pi: 1, price: 174.5, inStock: true, delivery: true }, { pi: 2, price: 205.0, inStock: false, delivery: false }] },
  { medIndex: 2, prices: [{ pi: 0, price: 89.99, inStock: true, delivery: true }, { pi: 1, price: 79.0, inStock: true, delivery: true }] },
  { medIndex: 3, prices: [{ pi: 0, price: 129.99, inStock: true, delivery: true }, { pi: 1, price: 119.0, inStock: false, delivery: true }, { pi: 2, price: 135.0, inStock: true, delivery: false }] },
  { medIndex: 4, prices: [{ pi: 0, price: 34.99, inStock: true, delivery: true }, { pi: 1, price: 29.5, inStock: true, delivery: true }] },
  { medIndex: 5, prices: [{ pi: 0, price: 39.99, inStock: true, delivery: true }, { pi: 1, price: 35.0, inStock: true, delivery: true }, { pi: 2, price: 42.0, inStock: true, delivery: false }] },
];

for (const row of priceData) {
  for (const p of row.prices) {
    await prisma.medicinePrice.upsert({
      where: { medicineId_pharmacistId: { medicineId: allMeds[row.medIndex].id, pharmacistId: allPharmas[p.pi].pharmacist.id } },
      update: {},
      create: {
        medicineId: allMeds[row.medIndex].id,
        pharmacistId: allPharmas[p.pi].pharmacist.id,
        price: p.price,
        inStock: p.inStock,
        deliveryAvailable: p.delivery,
      },
    });
  }
}

console.log("Seeded 6 medicines + 18 prices");

// ─── 7. Appointments ─────────────────────────────────────
const appt1 = await prisma.appointment.upsert({
  where: { id: "appt-1" },
  update: {},
  create: {
    id: "appt-1",
    patientId: patientUser.id,
    doctorId: doctorUser.id,
    hospitalId: hospitalCHB.id,
    datetime: new Date(),
    status: AppointmentStatus.confirmed,
    type: "video",
    notes: "Hypertension follow-up",
  },
});
const appt2 = await prisma.appointment.upsert({
  where: { id: "appt-2" },
  update: {},
  create: {
    id: "appt-2",
    patientId: patientUser.id,
    doctorId: doctorMokoena.id,
    hospitalId: hospitalCHB.id,
    datetime: new Date(Date.now() + 86400000),
    status: AppointmentStatus.confirmed,
    type: "in-person",
    notes: "General check-up",
  },
});
const appt3 = await prisma.appointment.upsert({
  where: { id: "appt-3" },
  update: {},
  create: {
    id: "appt-3",
    patientId: patientUser.id,
    doctorId: doctorNaidoo.id,
    datetime: new Date(Date.now() + 86400000 * 3),
    status: AppointmentStatus.scheduled,
    type: "video",
    notes: "Dermatology consultation",
  },
});
// Past completed appointments
const appt4 = await prisma.appointment.upsert({
  where: { id: "appt-4" },
  update: {},
  create: {
    id: "appt-4",
    patientId: patientUser.id,
    doctorId: doctorMokoena.id,
    hospitalId: hospitalCHB.id,
    datetime: new Date(Date.now() - 86400000 * 10),
    status: AppointmentStatus.completed,
    type: "in-person",
    notes: "General check-up",
  },
});
const appt5 = await prisma.appointment.upsert({
  where: { id: "appt-5" },
  update: {},
  create: {
    id: "appt-5",
    patientId: patientUser.id,
    doctorId: doctorUser.id,
    hospitalId: hospitalCHB.id,
    datetime: new Date(Date.now() - 86400000 * 14),
    status: AppointmentStatus.completed,
    type: "video",
    notes: "Cardiology review",
  },
});
// Sipho Dlamini's appointments
const appt6 = await prisma.appointment.upsert({
  where: { id: "appt-6" },
  update: {},
  create: {
    id: "appt-6",
    patientId: patientDlamini.id,
    doctorId: doctorUser.id,
    hospitalId: hospitalCHB.id,
    datetime: new Date(),
    status: AppointmentStatus.scheduled,
    type: "video",
    notes: "Post-op cardiac review",
  },
});
// Aisha Patel's appointment
const appt7 = await prisma.appointment.upsert({
  where: { id: "appt-7" },
  update: {},
  create: {
    id: "appt-7",
    patientId: patientPatel.id,
    doctorId: doctorMokoena.id,
    hospitalId: hospitalCHB.id,
    datetime: new Date(Date.now() + 86400000 * 2),
    status: AppointmentStatus.scheduled,
    type: "in-person",
    notes: "Diabetes T2 — quarterly review",
  },
});

console.log("Seeded 7 appointments");

// ─── 8. Prescriptions ────────────────────────────────────
await prisma.prescription.createMany({
  data: [
    {
      appointmentId: appt5.id,
      doctorId: doctorUser.id,
      patientId: patientUser.id,
      items: JSON.stringify([{ medicine: "Glucophage 850mg", dosage: "1 tablet twice daily", refills: 2 }]),
      notes: "Monitor HbA1c in 3 months",
      dispensed: false,
    },
    {
      appointmentId: appt4.id,
      doctorId: doctorMokoena.id,
      patientId: patientUser.id,
      items: JSON.stringify([{ medicine: "Ventolin Inhaler", dosage: "2 puffs as needed", refills: 1 }]),
      notes: "PRN for wheezing",
      dispensed: false,
    },
    {
      appointmentId: appt6.id,
      doctorId: doctorUser.id,
      patientId: patientDlamini.id,
      items: JSON.stringify([{ medicine: "Brufen 400mg", dosage: "1 tablet three times daily × 5 days", refills: 0 }]),
      notes: "Post-operative pain management",
      dispensed: false,
    },
  ],
});

console.log("Seeded 3 prescriptions");

// ─── 9. Health Records ───────────────────────────────────
await prisma.healthRecord.createMany({
  data: [
    {
      patientId: patientUser.id,
      doctorId: doctorUser.id,
      type: "Consultation",
      title: "Cardiology follow-up",
      content: "BP 128/82, HR 74. Continue current medication. Review in 3 months.",
      attachments: JSON.stringify(["results/hba1c_jun2025.pdf"]),
    },
    {
      patientId: patientUser.id,
      doctorId: doctorMokoena.id,
      type: "Imaging",
      title: "Chest X-Ray",
      content: "Bilateral lungs clear. Heart size normal. No consolidation.",
      attachments: JSON.stringify(["images/chest_xray_03062025.dcm"]),
    },
    {
      patientId: patientUser.id,
      doctorId: doctorUser.id,
      type: "Lab",
      title: "Blood panel — HbA1c",
      content: "HbA1c 6.8% (within target). Fasting glucose 6.4 mmol/L. Lipid profile normal.",
      attachments: JSON.stringify(["results/blood_panel_28052025.pdf"]),
    },
    {
      patientId: patientDlamini.id,
      doctorId: doctorUser.id,
      type: "Consultation",
      title: "Post-op cardiac review",
      content: "Recovery progressing well. Wound clean. Resume light activity.",
      attachments: [],
    },
  ],
});

console.log("Seeded 4 health records");

// ─── 10. Orders ──────────────────────────────────────────
await prisma.order.createMany({
  data: [
    {
      id: "ord-1",
      patientId: patientUser.id,
      pharmacistId: pharma1.id,
      items: JSON.stringify([{ medicine: "Glucophage 850mg", qty: 1 }]),
      status: OrderStatus.pending,
      total: 89.99,
      deliveryAddress: "Rosebank, Johannesburg",
    },
    {
      id: "ord-2",
      patientId: patientDlamini.id,
      pharmacistId: pharma1.id,
      items: JSON.stringify([{ medicine: "Augmentin 875mg", qty: 1 }]),
      status: OrderStatus.confirmed,
      total: 189.99,
      deliveryAddress: "Sandton, Johannesburg",
    },
    {
      id: "ord-3",
      patientId: patientPatel.id,
      pharmacistId: pharma3.id,
      items: JSON.stringify([{ medicine: "Ventolin Inhaler", qty: 1 }]),
      status: OrderStatus.ready,
      total: 135.00,
      deliveryAddress: null,
    },
    {
      id: "ord-4",
      patientId: patientVanWyk.id,
      pharmacistId: pharma2.id,
      items: JSON.stringify([{ medicine: "Brufen 400mg", qty: 1 }]),
      status: OrderStatus.pending,
      total: 35.00,
      deliveryAddress: "Parktown, Johannesburg",
    },
  ],
});

console.log("Seeded 4 orders");

// ─── Summary ─────────────────────────────────────────────
console.log("\n✅ Seed complete:");
console.log("   15 users (5 auth test accounts + 10 additional)");
console.log("   4 doctor profiles, 4 patient profiles");
console.log("   1 hospital, 5 wards, 6 equipment, 3 staff");
console.log("   3 pharmacist profiles");
console.log("   6 medicines, 18 price records");
console.log("   7 appointments, 3 prescriptions");
console.log("   4 health records, 4 orders");
console.log("\n📋 Auth test accounts (all password: 12345678):");
console.log("   admin@gmail.com      — Admin");
console.log("   adminpatient@gmail.com — Patient");
console.log("   admindoctor@gmail.com  — Doctor");
console.log("   adminhospital@gmail.com — Hospital");
console.log("   adminpharmacy@gmail.com — Pharmacy");

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

async function main() {}
