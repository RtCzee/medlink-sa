// Next.js 16 Proxy (formerly middleware): refreshes the Supabase session cookie and
// redirects signed-out users away from protected routes. Pages also check auth
// themselves (see components/auth/role-gate.tsx); this is not the only guard.
import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Everything except Next.js internals and static files.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest|woff2?)$).*)",
  ],
};
