/**
 * MedLink SA — client-side security audit log.
 *
 * Append-only event log persisted to localStorage.
 * NOT a substitute for server-side validation.
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

const SECURITY_LOG_KEY = "medlink-security-log";

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
