/**
 * NHSSS (National Health Software System Standards) validation schemas.
 * South African healthcare data validation using Zod.
 */
import { z } from "zod";

// South African ID number: 13 digits (YYMMDD + 5 digit sequence + citizenship + gender + checksum)
export const saIdSchema = z
  .string()
  .regex(/^\d{13}$/, "SA ID must be exactly 13 digits")
  .refine((id) => {
    const yy = parseInt(id.substring(0, 2), 10);
    const mm = parseInt(id.substring(2, 4), 10);
    const dd = parseInt(id.substring(4, 6), 10);
    if (mm < 1 || mm > 12) return false;
    if (dd < 1 || dd > 31) return false;
    // Citizenship: 0 = SA citizen, 1 = permanent resident
    const citizenship = parseInt(id.substring(10, 11), 10);
    if (citizenship !== 0 && citizenship !== 1) return false;
    // Gender: 0-4 = male, 5-9 = female
    const genderDigit = parseInt(id.substring(10, 11), 10);
    if (genderDigit < 0 || genderDigit > 9) return false;
    return true;
  }, "Invalid SA ID number format");

// South African phone number: +27 followed by 9 digits, or 0 followed by 9 digits
export const saPhoneSchema = z
  .string()
  .regex(
    /^(\+27|0)[1-9]\d{8}$/,
    "Invalid SA phone number (e.g., +27821234567 or 0821234567)"
  );

// Medical aid number: typically 8-12 alphanumeric characters
export const medicalAidSchema = z
  .string()
  .min(8, "Medical aid number must be at least 8 characters")
  .max(12, "Medical aid number must be at most 12 characters")
  .regex(
    /^[A-Za-z0-9]+$/,
    "Medical aid number must be alphanumeric"
  );

// SA province enum
export const saProvinceSchema = z.enum([
  "Eastern Cape",
  "Free State",
  "Gauteng",
  "KwaZulu-Natal",
  "Limpopo",
  "Mpumalanga",
  "Northern Cape",
  "North West",
  "Western Cape",
]);

// SA address schema
export const saAddressSchema = z.object({
  street: z.string().min(1, "Street address is required"),
  suburb: z.string().optional(),
  city: z.string().min(1, "City is required"),
  province: saProvinceSchema,
  postalCode: z
    .string()
    .regex(/^\d{4}$/, "Postal code must be exactly 4 digits"),
});

// Patient registration schema
export const patientRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: saPhoneSchema,
  idNumber: saIdSchema,
  dateOfBirth: z.string().refine((date) => {
    const d = new Date(date);
    const now = new Date();
    return d < now && d > new Date("1900-01-01");
  }, "Invalid date of birth"),
  gender: z.enum(["male", "female", "other"]),
  medicalAid: medicalAidSchema.optional(),
  address: saAddressSchema,
  emergencyContact: z.object({
    name: z.string().min(1, "Emergency contact name is required"),
    phone: saPhoneSchema,
    relationship: z.string().min(1, "Relationship is required"),
  }),
});

// Doctor registration schema
export const doctorRegistrationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: saPhoneSchema,
  hpcsaNumber: z
    .string()
    .regex(/^MP\d{6}$/, "HPCSA number must be MP followed by 6 digits"),
  specialty: z.string().min(1, "Specialty is required"),
  facility: z.string().min(1, "Facility is required"),
});

// Prescription validation schema
export const prescriptionSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  medicineId: z.string().min(1, "Medicine is required"),
  dosage: z.string().min(1, "Dosage is required"),
  frequency: z.string().min(1, "Frequency is required"),
  duration: z.string().min(1, "Duration is required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  refills: z.number().int().min(0, "Refills cannot be negative"),
  notes: z.string().optional(),
});

// Order validation schema
export const orderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  items: z
    .array(
      z.object({
        medicineId: z.string(),
        name: z.string(),
        quantity: z.number().int().positive(),
        price: z.number().positive(),
      })
    )
    .min(1, "At least one item is required"),
  deliveryAddress: saAddressSchema.optional(),
  delivery: z.boolean(),
});

// PTV (Pharmacotherapeutic Review) schema
export const ptvReviewSchema = z.object({
  prescriptionId: z.string().min(1, "Prescription ID is required"),
  pharmacistId: z.string().min(1, "Pharmacist ID is required"),
  decision: z.enum(["approved", "flagged", "rejected"]),
  drugInteractions: z
    .array(
      z.object({
        severity: z.enum(["mild", "moderate", "severe", "contraindicated"]),
        drugs: z.array(z.string()),
        description: z.string(),
      })
    )
    .optional(),
  dosageNotes: z.string().optional(),
  scheduleCompliance: z.boolean(),
  notes: z.string().optional(),
});

// Validate SA ID and extract info
export function parseSaId(id: string) {
  const result = saIdSchema.safeParse(id);
  if (!result.success) return null;

  const yy = parseInt(id.substring(0, 2), 10);
  const mm = parseInt(id.substring(2, 4), 10);
  const dd = parseInt(id.substring(4, 6), 10);
  const citizenship = parseInt(id.substring(10, 11), 10);
  const genderDigit = parseInt(id.substring(11, 12), 10);

  // Determine century
  const currentYear = new Date().getFullYear();
  const century = yy > currentYear % 100 ? 1900 : 2000;
  const year = century + yy;

  return {
    dateOfBirth: new Date(year, mm - 1, dd),
    citizenship: citizenship === 0 ? "south_african" : "permanent_resident",
    gender: genderDigit < 5 ? "male" : "female",
  };
}

// Validate medication schedule (SA scheduling system)
export function validateSchedule(schedule: number, hasPrescription: boolean): {
  valid: boolean;
  error?: string;
} {
  if (schedule < 0 || schedule > 6) {
    return { valid: false, error: "Invalid schedule number" };
  }
  if (schedule >= 4 && !hasPrescription) {
    return {
      valid: false,
      error: `Schedule ${schedule} medicines require a prescription`,
    };
  }
  return { valid: true };
}
