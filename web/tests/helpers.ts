// Shared helpers for the MOCKED unit tests (no network, no database).
import type { Mock } from "vitest";

export const USER_A = { id: "11111111-1111-4111-8111-111111111111", email: "patient.a@test.invalid" };
export const USER_B = { id: "22222222-2222-4222-8222-222222222222", email: "patient.b@test.invalid" };

/** A syntactically valid (but fake) JWT for Bearer-header tests. */
export const FAKE_JWT = "fakeheader.fakepayload.fakesignature";

export function apiRequest(
  path: string,
  init: { method?: string; body?: unknown; rawBody?: string; headers?: Record<string, string> } = {}
): Request {
  const headers: Record<string, string> = { ...(init.headers ?? {}) };
  let body: string | undefined = init.rawBody;
  if (init.body !== undefined) {
    body = JSON.stringify(init.body);
    headers["content-type"] ??= "application/json";
  }
  return new Request(`http://localhost:3000${path}`, {
    method: init.method ?? "GET",
    headers,
    body,
  });
}

export type ErrorBody = {
  error: { code: string; message: string; details?: Array<{ path: string; code: string; message: string; keys?: string[] }> };
  requestId: string;
};

export async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function signedInAs(getUser: Mock, user: { id: string; email: string }) {
  getUser.mockResolvedValue({ data: { user }, error: null });
}

export function signedOut(getUser: Mock) {
  getUser.mockResolvedValue({
    data: { user: null },
    error: { name: "AuthSessionMissingError", status: 400, message: "Auth session missing!" },
  });
}
