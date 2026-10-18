import RoleGate from "@/components/auth/role-gate";

// Server-side guard: signed-in users with role "hospital" only.
export default function HospitalDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate role="hospital">{children}</RoleGate>;
}
