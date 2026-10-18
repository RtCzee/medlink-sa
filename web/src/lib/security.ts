/**
 * MedLink SA — client-side security utilities.
 *
 * These helpers run in the browser and act as a first line of defense:
 * UX-layer rate limiting, input sanitisation, XSS heuristics, and an
 * append-only audit log persisted to localStorage.
 *
 * They are NOT a substitute for server-side validation — every value
 * that crosses the network is re-validated on the server.
 */

export type SecurityEventType =
  | "xss_detected"
  | "rate_limited"
  | "auth_blocked"
  | "csp_violation"
  | "iframe_blocked"
  | "input_sanitized"
  | "info";

export interface SecurityLogEntry {
  id: string;
  type: SecurityEventType;
  message: string;
  details?: Record<string, unknown>;
  ts: number;
  url?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitState {
  key: string;
  attempts: number[];
  remaining: number;
  resetAt: number;
}

const SECURITY_LOG_KEY = "medlink-security-log";
const RATE_LIMIT_PREFIX = "medlink-rl-";

export const RATE_LIMITS = {
  signIn: { key: "signin", maxAttempts: 5, windowMs: 60_000 },
  signUp: { key: "signup", maxAttempts: 3, windowMs: 60_000 },
} as const;

/* -------------------------------------------------------------------------- */
/*  Input sanitisation                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Strip common HTML/script injection vectors from a raw user string.
 * Removes: <script> blocks, <iframe> blocks, on*= inline handlers,
 * and javascript: URIs. Returns the cleaned string (never throws).
 */
export function sanitizeInput(str: string): string {
  if (typeof str !== "string") return "";
  let out = str;
  // <script ...>...</script> blocks
  out = out.replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "");
  // stray <script ...> opening / self-closed tags
  out = out.replace(/<script\b[^>]*\/?>/gi, "");
  // <iframe ...>...</iframe> blocks
  out = out.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe\s*>/gi, "");
  // stray <iframe ...> tags
  out = out.replace(/<iframe\b[^>]*\/?>/gi, "");
  // inline event handlers: on*="..." on*='...' on*=bare
  out = out.replace(
    /\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
    ""
  );
  // javascript: URIs (href="javascript:...", src='javascript:...')
  out = out.replace(/(javascript\s*:)/gi, "");
  return out;
}

/**
 * Heuristic XSS detector. Returns true if the string contains any of the
 * well-known attack signatures. Used to flag (not block) suspicious input
 * in the audit log.
 */
export function detectXSS(str: string): boolean {
  if (typeof str !== "string" || str.length === 0) return false;
  const patterns: RegExp[] = [
    /<script\b/i,
    /javascript\s*:/i,
    /\bonerror\s*=/i,
    /\bonload\s*=/i,
    /<iframe\b/i,
    /\bonclick\s*=/i,
    /\beval\s*\(/i,
    /document\.cookie/i,
  ];
  return patterns.some((re) => re.test(str));
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                 */
/* -------------------------------------------------------------------------- */

// Strict-ish email regex: local@domain.tld with sane length limits.
const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function validateEmail(str: string): boolean {
  if (typeof str !== "string") return false;
  const email = str.trim();
  if (email.length === 0 || email.length > 254) return false;
  return EMAIL_RE.test(email);
}

/**
 * Password policy: minimum 8 characters, must contain at least one letter
 * and at least one number. Stronger rules (mixed case, symbols) are
 * encouraged in the UI but not enforced here.
 */
export function validatePassword(str: string): boolean {
  if (typeof str !== "string") return false;
  if (str.length < 8) return false;
  if (str.length > 256) return false;
  const hasLetter = /[A-Za-z]/.test(str);
  const hasNumber = /[0-9]/.test(str);
  return hasLetter && hasNumber;
}

/* -------------------------------------------------------------------------- */
/*  Hashing (djb2 — NOT for passwords)                                         */
/* -------------------------------------------------------------------------- */

/**
 * djb2 string hash. Fast, deterministic, 32-bit. Useful for cache keys,
 * dedupe fingerprints and log correlation IDs. NEVER use this for
 * password storage — use a server-side bcrypt/argon2 derivation instead.
 */
export function hashString(str: string): string {
  if (typeof str !== "string") return "0";
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // coerce to unsigned 32-bit, then hex
  return (hash >>> 0).toString(16);
}

/* -------------------------------------------------------------------------- */
/*  Rate limiting (sliding window via localStorage)                            */
/* -------------------------------------------------------------------------- */

function readAttempts(key: string): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RATE_LIMIT_PREFIX + key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n) => typeof n === "number" && Number.isFinite(n)
    );
  } catch {
    return [];
  }
}

function writeAttempts(key: string, attempts: number[]): void {
  if (typeof window === "undefined") return;
  try {
    // cap stored timestamps to avoid unbounded growth
    const capped = attempts.slice(-64);
    window.localStorage.setItem(
      RATE_LIMIT_PREFIX + key,
      JSON.stringify(capped)
    );
  } catch {
    /* quota / private mode — fail silently, rate limit degrades to allow */
  }
}

/**
 * Consume one attempt for `key` within a sliding window of `windowMs`.
 * Returns whether the action is allowed plus remaining attempts and the
 * epoch ms at which the limit will reset.
 */
export function rateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  if (typeof window === "undefined") {
    return { allowed: true, remaining: maxAttempts, resetAt: now + windowMs };
  }
  const recent = readAttempts(key).filter((t) => now - t < windowMs);

  if (recent.length >= maxAttempts) {
    const oldest = Math.min(...recent);
    const resetAt = oldest + windowMs;
    writeAttempts(key, recent);
    return { allowed: false, remaining: 0, resetAt };
  }

  recent.push(now);
  writeAttempts(key, recent);
  const remaining = Math.max(0, maxAttempts - recent.length);
  const resetAt =
    recent.length > 0 ? Math.min(...recent) + windowMs : now + windowMs;
  return { allowed: true, remaining, resetAt };
}

/**
 * Inspect the current rate-limit state for `key` WITHOUT consuming an
 * attempt. Defaults to the sign-in window if maxAttempts/windowMs are
 * omitted.
 */
export function peekRateLimit(
  key: string,
  maxAttempts: number = RATE_LIMITS.signIn.maxAttempts,
  windowMs: number = RATE_LIMITS.signIn.windowMs
): RateLimitResult {
  const now = Date.now();
  if (typeof window === "undefined") {
    return { allowed: true, remaining: maxAttempts, resetAt: now + windowMs };
  }
  const recent = readAttempts(key).filter((t) => now - t < windowMs);
  const remaining = Math.max(0, maxAttempts - recent.length);
  const resetAt =
    recent.length > 0 ? Math.min(...recent) + windowMs : now + windowMs;
  return { allowed: remaining > 0, remaining, resetAt };
}

/** Clear all stored attempts for `key`, resetting the limiter. */
export function resetRateLimit(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RATE_LIMIT_PREFIX + key);
  } catch {
    /* ignore */
  }
}

/** Return the live rate-limit state for every configured limiter. */
export function getRateLimitStats(): RateLimitState[] {
  if (typeof window === "undefined") return [];
  const now = Date.now();
  const configs = [
    {
      key: RATE_LIMITS.signIn.key,
      max: RATE_LIMITS.signIn.maxAttempts,
      windowMs: RATE_LIMITS.signIn.windowMs,
    },
    {
      key: RATE_LIMITS.signUp.key,
      max: RATE_LIMITS.signUp.maxAttempts,
      windowMs: RATE_LIMITS.signUp.windowMs,
    },
  ];
  return configs.map((cfg) => {
    const attempts = readAttempts(cfg.key).filter(
      (t) => now - t < cfg.windowMs
    );
    return {
      key: cfg.key,
      attempts,
      remaining: Math.max(0, cfg.max - attempts.length),
      resetAt:
        attempts.length > 0
          ? Math.min(...attempts) + cfg.windowMs
          : now + cfg.windowMs,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*  Security audit log                                                         */
/* -------------------------------------------------------------------------- */

function genId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readLog(): SecurityLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SECURITY_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is SecurityLogEntry =>
        !!e &&
        typeof e === "object" &&
        typeof e.id === "string" &&
        typeof e.type === "string" &&
        typeof e.message === "string" &&
        typeof e.ts === "number"
    );
  } catch {
    return [];
  }
}

function writeLog(entries: SecurityLogEntry[]): void {
  if (typeof window === "undefined") return;
  try {
    // cap at 200 entries (newest kept)
    const capped = entries.slice(-200);
    window.localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(capped));
  } catch {
    /* ignore quota errors */
  }
}

/** Append a security event to the persistent audit log. */
export function logSecurityEvent(
  type: SecurityEventType,
  message: string,
  details?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;
  const entry: SecurityLogEntry = {
    id: genId(),
    type,
    message,
    details,
    ts: Date.now(),
    url: window.location.href,
  };
  const entries = readLog();
  entries.push(entry);
  writeLog(entries);
}

/** Return the security log, newest entry first. */
export function getSecurityLog(): SecurityLogEntry[] {
  return readLog().slice().reverse();
}

/** Remove every entry from the security log. */
export function clearSecurityLog(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SECURITY_LOG_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Hydrate / seed the security log on mount. If the log is empty we write a
 * single boot entry so consumers can confirm the pipeline is wired up.
 * Safe to call repeatedly.
 */
export function initSecurityLog(): void {
  if (typeof window === "undefined") return;
  const existing = readLog();
  if (existing.length === 0) {
    writeLog([
      {
        id: genId(),
        type: "info",
        message: "Security monitoring initialised.",
        ts: Date.now(),
        url: window.location.href,
      },
    ]);
  }
}
