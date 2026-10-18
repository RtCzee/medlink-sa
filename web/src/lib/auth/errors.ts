// Maps Supabase Auth errors to clear, user-facing messages.

type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
  name?: string;
} | null | undefined;

export const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the MedLink SA servers. Check your internet connection and try again.";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Supabase's default minimum is 6; MedLink asks for 8. */
export const MIN_PASSWORD_LENGTH = 8;

export function describeAuthError(error: AuthErrorLike, fallback: string): string {
  if (!error) return fallback;

  switch (error.code) {
    case "invalid_credentials":
      return "Incorrect email or password. Please try again.";
    case "email_not_confirmed":
      return "Please confirm your email address first. Open the link we emailed you, then sign in.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts. Please wait a few minutes and try again.";
    case "user_already_exists":
    case "email_exists":
      return "An account with that email already exists. Try signing in instead.";
    case "weak_password":
      return "That password is too weak. Use at least 8 characters with a mix of letters and numbers.";
    case "email_address_invalid":
      return "That email address can't be used. Please use a different one.";
    case "signup_disabled":
    case "email_provider_disabled":
      return "New registrations are currently unavailable. Please try again later.";
    case "user_banned":
      return "This account has been suspended. Please contact MedLink SA support.";
    case "validation_failed":
      return "Please check your details and try again.";
  }

  if (error.status === 429) {
    return "Too many attempts. Please wait a few minutes and try again.";
  }
  if (
    error.name === "AuthRetryableFetchError" ||
    error.status === 0 ||
    /failed to fetch|network|load failed/i.test(error.message ?? "")
  ) {
    return NETWORK_ERROR_MESSAGE;
  }
  return fallback;
}
