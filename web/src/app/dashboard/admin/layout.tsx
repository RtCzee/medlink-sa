import RoleGate from "@/components/auth/role-gate";

// Server-side guard: signed-in users with role "admin" only.
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate role="admin">{children}</RoleGate>;
}
