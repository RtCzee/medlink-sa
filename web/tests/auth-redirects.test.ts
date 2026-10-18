// MOCKED unit tests for the Stage 3 redirect helpers and proxy behaviour.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const supabase = vi.hoisted(() => ({
  getClaims: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({ auth: supabase }),
}));

import { isProtectedPath, safeRedirectPath, signInUrl } from "@/lib/auth/roles";
import { updateSession } from "@/utils/supabase/proxy";

describe("safeRedirectPath (open-redirect protection)", () => {
  it.each([
    ["/dashboard/patient?tab=records", "/dashboard/patient?tab=records"],
    ["/service", "/service"],
  ])("allows same-site path %s", (input, expected) => {
    expect(safeRedirectPath(input)).toBe(expected);
  });

  it.each([
    "//evil.example",
    "/\\evil.example",
    "https://evil.example/x",
    "javascript:alert(1)",
    "evil.example",
    "/ok\nSet-Cookie: x",
    "",
  ])("blocks %j", (input) => {
    expect(safeRedirectPath(input, "/dashboard")).toBe("/dashboard");
  });

  it("null/undefined fall back", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined, "/x")).toBe("/x");
  });

  it("signInUrl encodes the next path and drops unsafe ones", () => {
    expect(signInUrl("/dashboard/admin?tab=users")).toBe("/sign-in?redirect=%2Fdashboard%2Fadmin%3Ftab%3Dusers");
    expect(signInUrl("//evil.example")).toBe("/sign-in");
  });

  it("only /dashboard paths are page-protected (API routes return JSON 401 instead)", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/dashboard/patient")).toBe(true);
    expect(isProtectedPath("/api/profile")).toBe(false);
    expect(isProtectedPath("/dashboards")).toBe(false);
  });
});

describe("proxy updateSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const signedOut = () => supabase.getClaims.mockResolvedValue({ data: null, error: null });
  const signedIn = () => {
    supabase.getClaims.mockResolvedValue({ data: { claims: { sub: "user-a" } }, error: null });
    supabase.getUser.mockResolvedValue({ data: { user: { id: "user-a" } }, error: null });
  };

  it("signed-out /dashboard/patient -> 307 to /sign-in?redirect=...", async () => {
    signedOut();
    const res = await updateSession(new NextRequest("http://localhost:3000/dashboard/patient?tab=records"));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/sign-in");
    expect(location.searchParams.get("redirect")).toBe("/dashboard/patient?tab=records");
  });

  it.each(["/api/profile", "/api/settings"])("signed-out %s is NOT redirected (handler returns JSON 401)", async (path) => {
    signedOut();
    const res = await updateSession(new NextRequest(`http://localhost:3000${path}`, { method: "GET" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("signed-in /sign-in?redirect=//evil.example -> /dashboard on this site", async () => {
    signedIn();
    const res = await updateSession(new NextRequest("http://localhost:3000/sign-in?redirect=%2F%2Fevil.example"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("signed-in /sign-in with a revoked session (getUser fails) stays on /sign-in", async () => {
    supabase.getClaims.mockResolvedValue({ data: { claims: { sub: "user-a" } }, error: null });
    supabase.getUser.mockResolvedValue({ data: { user: null }, error: { status: 403 } });
    const res = await updateSession(new NextRequest("http://localhost:3000/sign-in"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });
});
