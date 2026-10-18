// Email confirmation landing route (emailRedirectTo in sign-up).
// Supports both Supabase link styles:
//   ?token_hash=...&type=signup  (custom email template, verifyOtp)
//   ?code=...                    (default template, PKCE code exchange)
import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { DEFAULT_AFTER_SIGN_IN, SIGN_IN_PATH, safeRedirectPath } from "@/lib/auth/roles";

const OTP_TYPES: readonly EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const code = params.get("code");
  const next = safeRedirectPath(params.get("next"), DEFAULT_AFTER_SIGN_IN);

  let confirmed = false;
  if (tokenHash && type && (OTP_TYPES as readonly string[]).includes(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash: tokenHash,
    });
    confirmed = !error;
  } else if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    confirmed = !error;
  }

  redirect(confirmed ? next : `${SIGN_IN_PATH}?error=confirmation_failed`);
}
