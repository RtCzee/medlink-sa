export type TabId =
  | "overview"
  | "users"
  | "hospitals"
  | "verifications"
  | "audit"
  | "health"
  | "settings";

export type VerifiedStatus = "approved" | "pending" | "rejected" | "suspended";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "Patient" | "Doctor" | "Hospital" | "Pharmacy";
  verified: VerifiedStatus;
  joined: string;
  phone?: string;
  province?: string;
};

export type AdminHospital = {
  id: string;
  name: string;
  province: string;
  beds: number;
  doctors: number;
  verified: boolean;
  joined: string;
  ceo?: string;
  district?: string;
};

export type AuditKind = "auth" | "edit" | "create" | "delete" | "system" | "verify";

export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  target: string;
  time: string;
  kind: AuditKind;
  ip: string;
  device: string;
  hash: string;
};

export type PendingDoctor = {
  id: string;
  name: string;
  specialty: string;
  hpcsa: string;
  hospital: string;
  submitted: string;
};

export type PendingPatient = {
  id: string;
  name: string;
  idType: "SA ID" | "Passport" | "Birth cert" | "Refugee permit";
  hospital: string;
  submitted: string;
};
