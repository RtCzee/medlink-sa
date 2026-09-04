"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLang, LANGUAGES, type LangCode } from "@/lib/lang-context";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  variant?: "sm" | "default" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { text: "text-xs", h: "h-8", gap: "gap-1.5", icon: 14 },
  default: { text: "text-sm", h: "h-9", gap: "gap-2", icon: 16 },
  lg: { text: "text-base", h: "h-10", gap: "gap-2.5", icon: 18 },
} as const;

export function LanguageSwitcher({
  variant = "default",
  className,
}: LanguageSwitcherProps) {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const s = sizeMap[variant];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <Button
        variant="ghost"
        size={variant === "lg" ? "default" : "sm"}
        className={cn(
          "flex items-center font-medium transition-colors",
          s.text,
          s.h,
          s.gap,
          open
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "hover:bg-slate-100 dark:hover:bg-slate-800"
        )}
        onClick={() => setOpen((o) => !o)}
        aria-label="Select language"
      >
        <Languages className="shrink-0" size={s.icon} />
        <span className="uppercase tracking-wide">{current?.code ?? "en"}</span>
        <Plus
          className={cn(
            "shrink-0 transition-transform duration-200",
            open ? "rotate-45" : "rotate-0"
          )}
          size={s.icon - 2}
        />
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 z-50 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900"
          >
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code as LangCode);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors",
                  s.text,
                  l.code === lang
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                <span className="text-base">{l.flag}</span>
                <span className="flex-1 truncate">{l.native}</span>
                {l.code === lang && <Check size={14} className="shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
