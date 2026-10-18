// Server-side guard for a role's dashboard. Runs on every request to that dashboard,
// independently of proxy.ts, and hands the verified profile to the client UI.
import { redirect } from "next/navigation";
import { AuthProvider } from "@/lib/auth-context";
import { ROLE_DASHBOARDS, signInUrl, toAppUser, type UserRole } from "@/lib/auth/roles";
import { getCurrentProfile, requireUser } from "@/lib/auth/server";
import ProfileProblem from "@/components/auth/profile-problem";

export default async function RoleGate({
  role,
  children,
}: {
  role: UserRole;
  children: React.ReactNode;
}) {
  await requireUser(ROLE_DASHBOARDS[role]);
  const result = await getCurrentProfile();

  if (!result) redirect(signInUrl(ROLE_DASHBOARDS[role]));
  if (result.status !== "ok") return <ProfileProblem status={result.status} />;

  // Role comes from the database only; send users to the dashboard they're allowed.
  if (result.profile.role !== role) redirect(ROLE_DASHBOARDS[result.profile.role]);

  return (
    <AuthProvider initialUser={toAppUser(result.profile, result.user.email)}>
      {children}
    </AuthProvider>
  );
}
