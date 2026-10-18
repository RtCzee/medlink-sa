// Supabase client for Client Components. Session lives in cookies (shared with the server).
import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = getSupabaseEnv();
  return createBrowserClient(url, publishableKey);
}
