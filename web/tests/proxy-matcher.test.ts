// MOCKED/static test of the proxy matcher: the public directory API skips the
// session-refresh proxy (so it can never send Set-Cookie); everything else still runs it.
import { describe, expect, it, vi } from "vitest";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

import { config } from "@/proxy";

const matcher = new RegExp(`^${config.matcher[0]}$`);

describe("proxy matcher", () => {
  it.each(["/api/facilities", "/api/facilities/abc", "/api/practitioners", "/api/practitioners/abc", "/_next/static/x.js", "/logo.svg"])(
    "skips %s",
    (path) => expect(matcher.test(path)).toBe(false)
  );

  it.each(["/", "/dashboard", "/dashboard/patient", "/sign-in", "/api/profile", "/api/settings", "/api/facilitiesx", "/api"])(
    "runs on %s",
    (path) => expect(matcher.test(path)).toBe(true)
  );
});
