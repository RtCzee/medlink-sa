// Public Supabase settings. The publishable key is safe for the browser; access is
// enforced by Row Level Security. Never put the secret/service-role key here.
export function getSupabaseEnv(): { url: string; publishableKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in web/.env (see web/.env.example)."
    );
  }
  return { url, publishableKey };
}
