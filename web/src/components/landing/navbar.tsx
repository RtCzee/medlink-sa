"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Moon,
  Sun,
  Languages,
  Menu,
  X,
  Command,
  Github,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "@/lib/data";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Features", href: "#features" },
  { label: "Roles", href: "#roles" },
  { label: "Explore", href: "#explore" },
  { label: "Roadmap", href: "#roadmap" },
];

export default function Navbar({ onCommand }: { onCommand: () => void }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-6 sm:pt-4"
    >
      <nav
        className={cn(
          "nav-glass flex w-full max-w-6xl items-center justify-between rounded-2xl px-3 py-2.5 transition-all duration-500 sm:px-4",
          scrolled ? "shadow-lg" : ""
        )}
      >
        {/* Brand */}
        <a href="#top" className="group flex items-center gap-2.5" aria-label="MedLink SA home">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-medical to-cyan-400 shadow-[0_4px_16px_var(--glow-1)]">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
          </span>
          <div className="flex flex-col leading-none">
            <span className="font-display text-[0.95rem] font-semibold tracking-tight">
              MedLink<span className="text-medical"> SA</span>
            </span>
            <span className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              National Health Network
            </span>
          </div>
        </a>

        {/* Center links */}
        <div className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1.5">
          {/* Command trigger */}
          <button
            onClick={onCommand}
            className="hidden items-center gap-2 rounded-lg border border-border bg-background/40 px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-medical/40 hover:text-foreground sm:flex"
            aria-label="Open command menu"
          >
            <Command className="h-3.5 w-3.5" />
            <span>Search</span>
            <kbd className="rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold">
              ⌘K
            </kbd>
          </button>

          {/* Language */}
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="btn-ghost flex items-center gap-1.5 rounded-lg px-2.5 py-1.5"
              aria-label="Change language"
              aria-expanded={langOpen}
            >
              <Languages className="h-4 w-4" />
              <span className="hidden text-xs font-semibold uppercase sm:inline">
                {lang}
              </span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.18 }}
                  className="glass-card absolute right-0 top-12 w-48 overflow-hidden p-1"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-foreground/5",
                        lang === l.code && "bg-foreground/5"
                      )}
                    >
                      <span className="font-medium">{l.native}</span>
                      <span className="text-xs text-muted-foreground">
                        {l.code.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme */}
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="btn-ghost relative grid h-9 w-9 place-items-center rounded-lg"
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* GitHub-ish */}
          <a
            href="#platform"
            className="btn-ghost hidden h-9 w-9 place-items-center rounded-lg sm:grid"
            aria-label="View source"
          >
            <Github className="h-4 w-4" />
          </a>

          {/* CTA */}
          <a
            href="#cta"
            className="btn-primary ml-1 hidden rounded-lg px-4 py-2 text-sm font-semibold sm:inline-flex"
          >
            Get started
          </a>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="btn-ghost grid h-9 w-9 place-items-center rounded-lg lg:hidden"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="glass-card absolute left-3 right-3 top-20 z-50 p-2 lg:hidden"
          >
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#cta"
              onClick={() => setMobileOpen(false)}
              className="btn-primary mt-1 block rounded-lg px-4 py-3 text-center text-sm font-semibold"
            >
              Get started
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
