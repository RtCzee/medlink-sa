import RoleGate from "@/components/auth/role-gate";

// Server-side guard: signed-in users with role "doctor" only.
export default function DoctorDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate role="doctor">{children}</RoleGate>;
}
