"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  Users,
  Calendar,
  FileText,
  Pill,
  Activity,
  Settings,
  Moon,
  Sun,
  Building2,
  Stethoscope,
  HeartPulse,
  ShieldCheck,
  Command,
} from "lucide-react";
import { useTheme } from "next-themes";

type CmdItem = {
  id: string;
  label: string;
  hint: string;
  group: string;
  icon: React.ElementType;
  action: () => void;
};

export default function CommandMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const { theme, setTheme } = useTheme();

  const items: CmdItem[] = [
    {
      id: "goto-platform",
      label: "Go to platform preview",
      hint: "Dashboard",
      group: "Navigate",
      icon: Activity,
      action: () => scrollToId("platform"),
    },
    {
      id: "goto-features",
      label: "View capabilities",
      hint: "Features",
      group: "Navigate",
      icon: FileText,
      action: () => scrollToId("features"),
    },
    {
      id: "goto-roles",
      label: "Browse roles",
      hint: "Roles",
      group: "Navigate",
      icon: Users,
      action: () => scrollToId("roles"),
    },
    {
      id: "goto-explore",
      label: "Find a facility",
      hint: "Explore",
      group: "Navigate",
      icon: Building2,
      action: () => scrollToId("explore"),
    },
    {
      id: "goto-roadmap",
      label: "See the roadmap",
      hint: "Roadmap",
      group: "Navigate",
      icon: ShieldCheck,
      action: () => scrollToId("roadmap"),
    },
    {
      id: "find-doctor",
      label: "Find a doctor",
      hint: "Cardiology · GP",
      group: "Quick action",
      icon: Stethoscope,
      action: () => scrollToId("explore"),
    },
    {
      id: "find-pharmacy",
      label: "Find a pharmacy",
      hint: "Open now",
      group: "Quick action",
      icon: Pill,
      action: () => scrollToId("explore"),
    },
    {
      id: "book-telemed",
      label: "Book a teleconsult",
      hint: "Today",
      group: "Quick action",
      icon: Calendar,
      action: () => scrollToId("cta"),
    },
    {
      id: "toggle-theme",
      label: theme === "dark" ? "Switch to light mode" : "Switch to dark mode",
      hint: "Theme",
      group: "Settings",
      icon: theme === "dark" ? Sun : Moon,
      action: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
    {
      id: "settings",
      label: "Open settings",
      hint: "Account",
      group: "Settings",
      icon: Settings,
      action: () => {},
    },
  ];

  const filtered = items.filter((i) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      i.label.toLowerCase().includes(q) ||
      i.hint.toLowerCase().includes(q) ||
      i.group.toLowerCase().includes(q)
    );
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => (a + 1) % Math.max(filtered.length, 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => (a - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1));
      }
      if (e.key === "Enter") {
        e.preventDefault();
        const item = filtered[active];
        if (item) {
          item.action();
          onOpenChange(false);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onOpenChange]);

  // group items
  const groups = filtered.reduce<Record<string, CmdItem[]>>((acc, item) => {
    (acc[item.group] = acc[item.group] || []).push(item);
    return acc;
  }, {});

  let runningIndex = -1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh] sm:pt-[16vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <div
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="glass-card relative w-full max-w-xl overflow-hidden p-0 shadow-2xl"
            role="dialog"
            aria-label="Command menu"
          >
            {/* input */}
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search the network, find patients, jump anywhere…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <kbd className="hidden rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold text-muted-foreground sm:inline">
                ESC
              </kbd>
            </div>

            {/* results */}
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.length === 0 && (
                <div className="px-3 py-10 text-center">
                  <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-foreground/5">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No results for &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}
              {Object.entries(groups).map(([group, gItems]) => (
                <div key={group} className="mb-1">
                  <div className="px-2 py-1.5 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group}
                  </div>
                  {gItems.map((item) => {
                    runningIndex += 1;
                    const idx = runningIndex;
                    const isActive = idx === active;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onMouseEnter={() => setActive(idx)}
                        onClick={() => {
                          item.action();
                          onOpenChange(false);
                        }}
                        className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
                          isActive ? "bg-medical/12 text-foreground" : "text-foreground/80"
                        }`}
                      >
                        <span
                          className={`grid h-7 w-7 place-items-center rounded-md ${
                            isActive
                              ? "bg-medical text-white"
                              : "bg-foreground/5 text-muted-foreground"
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="flex-1 text-sm font-medium">
                          {item.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {item.hint}
                        </span>
                        {isActive && (
                          <CornerDownLeft className="h-3.5 w-3.5 text-medical" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* footer */}
            <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[0.65rem] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3 w-3" />
                  <ArrowDown className="h-3 w-3" /> navigate
                </span>
                <span className="flex items-center gap-1">
                  <CornerDownLeft className="h-3 w-3" /> select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <Command className="h-3 w-3" /> MedLink SA
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
