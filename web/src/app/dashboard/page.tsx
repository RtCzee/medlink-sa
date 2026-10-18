// /dashboard: sends the signed-in user to their own dashboard, based on profiles.role.
import { redirect } from "next/navigation";
import { DEFAULT_AFTER_SIGN_IN, ROLE_DASHBOARDS, signInUrl } from "@/lib/auth/roles";
import { getCurrentProfile, requireUser } from "@/lib/auth/server";
import ProfileProblem from "@/components/auth/profile-problem";

export default async function DashboardIndexPage() {
  await requireUser(DEFAULT_AFTER_SIGN_IN);
  const result = await getCurrentProfile();
  if (!result) redirect(signInUrl(DEFAULT_AFTER_SIGN_IN));
  if (result.status !== "ok") return <ProfileProblem status={result.status} />;
  redirect(ROLE_DASHBOARDS[result.profile.role]);
}
