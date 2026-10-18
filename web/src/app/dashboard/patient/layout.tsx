import RoleGate from "@/components/auth/role-gate";

// Server-side guard: signed-in users with role "patient" only.
export default function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate role="patient">{children}</RoleGate>;
}
