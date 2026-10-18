import RoleGate from "@/components/auth/role-gate";

// Server-side guard: signed-in users with role "pharmacy" only.
export default function PharmacyDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate role="pharmacy">{children}</RoleGate>;
}
