// Session refresh + route protection, run from src/proxy.ts on every page request.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "./env";
import {
  DEFAULT_AFTER_SIGN_IN,
  SIGN_IN_PATH,
  isAuthPagePath,
  isProtectedPath,
  safeRedirectPath,
} from "@/lib/auth/roles";

export async function updateSession(request: NextRequest) {
  const { url, publishableKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        Object.entries(headers ?? {}).forEach(([key, value]) =>
          response.headers.set(key, value)
        );
      },
    },
  });

  // Do not run other code between createServerClient and getClaims().
  // getClaims() validates the JWT (refreshing an expired session via cookies);
  // if the refresh fails, there are no claims and the user is treated as signed out.
  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims?.sub);
  const { pathname, search } = request.nextUrl;

  if (!isSignedIn && isProtectedPath(pathname)) {
    const target = request.nextUrl.clone();
    target.pathname = SIGN_IN_PATH;
    target.search = "";
    target.searchParams.set("redirect", pathname + search);
    return redirectKeepingCookies(target, response);
  }

  if (isSignedIn && isAuthPagePath(pathname)) {
    // Confirm with the Auth server before bouncing away from /sign-in, so a
    // revoked or deleted session can't cause a /sign-in <-> /dashboard loop.
    const { data: verified } = await supabase.auth.getUser();
    if (!verified.user) return response;
    const next = safeRedirectPath(
      request.nextUrl.searchParams.get("redirect"),
      DEFAULT_AFTER_SIGN_IN
    );
    return redirectKeepingCookies(new URL(next, request.url), response);
  }

  return response;
}

function redirectKeepingCookies(target: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(target);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  ["cache-control", "expires", "pragma"].forEach((header) => {
    const value = from.headers.get(header);
    if (value) redirect.headers.set(header, value);
  });
  return redirect;
}
