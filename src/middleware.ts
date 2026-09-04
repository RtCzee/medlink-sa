/**
 * Root-level middleware: auth guards + security headers.
 * Runs on every matched request.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD_ROLES = [
  "dashboard/admin",
  "dashboard/doctor",
  "dashboard/hospital",
  "dashboard/patient",
  "dashboard/pharmacy",
] as const;

const PUBLIC_PATHS = ["/sign-in", "/sign-up", "/api/auth"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths, static assets, Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Dashboard routes require auth — check for session cookie
  if (pathname.startsWith("/dashboard")) {
    const hasSession = req.cookies.has("next-auth.session-token") ||
      req.cookies.has("__Secure-next-auth.session-token");

    if (!hasSession) {
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );
  // ponytail: relaxed CSP for inline styles (shadcn + Tailwind) and
  // framer-motion's script usage. Tighten once inline styles are removed.
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
