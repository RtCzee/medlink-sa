"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldAlert } from "lucide-react";
import { initSecurityLog, logSecurityEvent } from "@/lib/security";

/**
 * Content-Security-Policy injected as a <meta> tag at runtime. Mirrors the
 * frame-ancestors 'none' directive so the app cannot be embedded in an
 * <iframe> by a third party in production.
 */
const CSP_CONTENT =
  "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; frame-ancestors 'none';";

function ensureCspMeta(): void {
  if (typeof document === "undefined") return;
  const existing = document.querySelector<HTMLMetaElement>(
    'meta[http-equiv="Content-Security-Policy"]'
  );
  if (existing) {
    if (existing.content !== CSP_CONTENT) {
      existing.content = CSP_CONTENT;
    }
    return;
  }
  const meta = document.createElement("meta");
  meta.httpEquiv = "Content-Security-Policy";
  meta.content = CSP_CONTENT;
  document.head.appendChild(meta);
}

/**
 * Wraps the app with client-side security hardening:
 *  - injects a CSP meta tag,
 *  - silences `console.log` in production,
 *  - hydrates the security audit log,
 *  - detects iframe embedding and (in production only) blocks it with a
 *    full-screen warning overlay.
 *
 * IMPORTANT: iframe blocking is intentionally disabled in development
 * because the preview environment renders the app inside an iframe.
 */
export function SecurityProvider({ children }: { children: ReactNode }) {
  const [framedBlocked, setFramedBlocked] = useState(false);
  const isProduction = process.env.NODE_ENV === "production";

  useEffect(() => {
    ensureCspMeta();

    // hydrate / seed the audit log
    initSecurityLog();

    // silence verbose debug output in production builds
    if (isProduction && typeof console !== "undefined") {
      console.log = () => {};
    }

    // iframe / clickjacking detection — ONLY enforce in production so the
    // sandbox preview (which runs inside an iframe) keeps working in dev.
    if (isProduction) {
      try {
        const inFrame = window.self !== window.top;
        if (inFrame) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setFramedBlocked(true);
          logSecurityEvent(
            "iframe_blocked",
            "Application rendered inside an iframe in production; blocking per CSP frame-ancestors 'none'."
          );
        }
      } catch {
        // cross-origin access to window.top throws when framed
        setFramedBlocked(true);
        logSecurityEvent(
          "iframe_blocked",
          "Cross-origin iframe embedding detected in production."
        );
      }
    }
  }, [isProduction]);

  return (
    <>
      {children}
      <AnimatePresence>
        {framedBlocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-background/95 p-6 backdrop-blur-xl"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="medlink-framed-title"
          >
            <div className="glass-strong max-w-md rounded-3xl p-8 text-center">
              <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-rose-500/15 text-rose-500">
                <ShieldAlert className="h-7 w-7" />
              </span>
              <h2
                id="medlink-framed-title"
                className="font-display text-xl font-semibold tracking-tight"
              >
                This page can&apos;t be embedded
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                For your security, MedLink SA cannot be loaded inside a frame on
                another site. Please open it directly in a new tab.
              </p>
              <a
                href={
                  typeof window !== "undefined" ? window.location.href : "/"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                Open MedLink SA
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default SecurityProvider;
