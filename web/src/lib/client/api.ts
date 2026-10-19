// Browser-side client for the MedLink API (same-origin /api/* routes).
// The Supabase session cookie authenticates the requests; no key or token is
// handled here, and nothing is cached in localStorage.

"use client";

import { useCallback, useEffect, useState } from "react";

import type { PageMeta } from "@/lib/api/handler";
import { signInUrl } from "@/lib/auth/roles";

export type { PageMeta };

/** A failed API call: the {error:{code,message},requestId} envelope, or a network failure. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(status: number, code: string, message: string, requestId: string | null = null) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }

  /** 401: the session is missing or expired; the user must sign in again. */
  get isSessionExpired(): boolean {
    return this.status === 401;
  }
}

export type ApiResult<T> = { data: T; meta?: PageMeta };

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Calls a MedLink API route and unwraps the envelope. Throws ApiRequestError for
 * HTTP errors (with the server's code and message), network failures (status 0)
 * and responses that are not the documented JSON envelope.
 */
export async function apiFetch<T>(
  path: string,
  init: { method?: "GET" | "POST" | "PATCH"; body?: unknown; signal?: AbortSignal } = {},
  fetcher: FetchLike = (input, options) => fetch(input, options)
): Promise<ApiResult<T>> {
  const method = init.method ?? "GET";
  let response: Response;
  try {
    response = await fetcher(path, {
      method,
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
      },
      body: method === "GET" ? undefined : JSON.stringify(init.body ?? {}),
      signal: init.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiRequestError(0, "NETWORK_ERROR", "Could not reach MedLink. Check your connection and try again.");
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const error = isRecord(body) && isRecord(body.error) ? body.error : null;
    const requestId = isRecord(body) && typeof body.requestId === "string" ? body.requestId : null;
    const code = typeof error?.code === "string" ? error.code : `HTTP_${response.status}`;
    const message =
      typeof error?.message === "string"
        ? error.message
        : response.status === 401
          ? "Your session has expired. Please sign in again."
          : `MedLink returned an error (${response.status}).`;
    throw new ApiRequestError(response.status, code, message, requestId);
  }

  if (!isRecord(body) || !("data" in body)) {
    throw new ApiRequestError(response.status, "MALFORMED_RESPONSE", "MedLink sent a response the page could not read.");
  }
  return { data: body.data as T, meta: isRecord(body.meta) ? (body.meta as PageMeta) : undefined };
}

function toApiError(error: unknown): ApiRequestError {
  return error instanceof ApiRequestError
    ? error
    : new ApiRequestError(0, "UNKNOWN", "Something went wrong. Please try again.");
}

export type ApiResource<T> = {
  data: T | undefined;
  meta: PageMeta | undefined;
  error: ApiRequestError | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Loads `path` (null = don't load) and reloads on demand. State is keyed by the
 * request so no state is set synchronously inside the effect.
 */
export function useApi<T>(path: string | null): ApiResource<T> {
  const [nonce, setNonce] = useState(0);
  const key = path ? `${path}#${nonce}` : "";
  const [state, setState] = useState<{ key: string; result?: ApiResult<T>; error?: ApiRequestError }>({ key: "" });

  useEffect(() => {
    if (!path) return;
    const controller = new AbortController();
    apiFetch<T>(path, { signal: controller.signal }).then(
      (result) => setState({ key, result }),
      (error) => {
        if (!controller.signal.aborted) setState({ key, error: toApiError(error) });
      }
    );
    return () => controller.abort();
  }, [key, path]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  const current = state.key === key;
  return {
    data: state.result?.data,
    meta: state.result?.meta,
    error: current ? (state.error ?? null) : null,
    loading: !!path && !current,
    reload,
  };
}

/** Where to send the user when the session expired, returning them here afterwards. */
export function sessionExpiredUrl(returnTo: string): string {
  return signInUrl(returnTo);
}

/* --------------------------------- Formatting -------------------------------- */

const SAST = "Africa/Johannesburg";

/** UTC ISO instant → "Tue, 21 Oct 2026" and "09:30" in South African time. */
export function sastParts(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: "" };
  return {
    date: d.toLocaleDateString("en-ZA", { timeZone: SAST, weekday: "short", day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-ZA", { timeZone: SAST, hour: "2-digit", minute: "2-digit", hour12: false }),
  };
}

/** A calendar day plus "HH:MM" in SAST (UTC+2, no DST) → UTC ISO instant. */
export function sastSlotToUtc(day: Date, slot: string): string | null {
  const match = /^(\d{2}):(\d{2})$/.exec(slot);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  const utc = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hours - 2, minutes);
  return new Date(utc).toISOString();
}

/** "24.99" + "ZAR" → "R24.99"; other currencies keep their code. Amount stays exact. */
export function formatPrice(amount: string, currency: string): string {
  return currency === "ZAR" ? `R${amount}` : `${currency} ${amount}`;
}

/** Seeded demo prices must never be presented as current prices. */
export function priceLabel(price: { source: string; effectiveFrom: string }): string {
  return price.source === "demo"
    ? `Demo price (sample data from ${price.effectiveFrom}), not a current price`
    : `Price from ${price.effectiveFrom} (${price.source})`;
}
