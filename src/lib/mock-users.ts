/**
 * In-memory mock user store for environments without a database.
 * Used as a fallback when DATABASE_URL is not configured or Prisma is unavailable.
 * Passwords are bcrypt-hashed at startup so authorize() can compare synchronously.
 */
import bcrypt from "bcryptjs";

export type MockUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: "patient" | "doctor" | "hospital" | "pharmacy" | "admin";
  avatar?: string;
  verified: boolean;
};

const SEED_PASSWORD = "12345678";

const BASE_USERS: Omit<MockUser, "passwordHash">[] = [
  { id: "mock-admin-1", name: "Admin User", email: "admin@gmail.com", role: "admin", verified: true },
  { id: "mock-patient-1", name: "Patient User", email: "adminpatient@gmail.com", role: "patient", verified: true },
  { id: "mock-doctor-1", name: "Dr. Sipho Dlamini", email: "admindoctor@gmail.com", role: "doctor", verified: true },
  { id: "mock-hospital-1", name: "Chris Hani Hospital", email: "adminhospital@gmail.com", role: "hospital", verified: true },
  { id: "mock-pharmacy-1", name: "Dis-Chem Pharmacy", email: "adminpharmacy@gmail.com", role: "pharmacy", verified: true },
];

let _users: MockUser[] | null = null;

function getUsers(): MockUser[] {
  if (!_users) {
    const hash = bcrypt.hashSync(SEED_PASSWORD, 10);
    _users = BASE_USERS.map((u) => ({ ...u, passwordHash: hash }));
  }
  return _users;
}

export function findMockUserByEmail(email: string): MockUser | undefined {
  return getUsers().find((u) => u.email === email.toLowerCase().trim());
}

export function createMockUser(data: {
  name: string;
  email: string;
  password: string;
  role: MockUser["role"];
}): { ok: boolean; error?: string; userId?: string } {
  const users = getUsers();
  if (users.some((u) => u.email === data.email.toLowerCase().trim())) {
    return { ok: false, error: "An account with that email already exists." };
  }
  const id = `mock-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(data.password, 12);
  users.push({
    id,
    name: data.name,
    email: data.email.toLowerCase().trim(),
    passwordHash,
    role: data.role,
    verified: false,
  });
  return { ok: true, userId: id };
}
