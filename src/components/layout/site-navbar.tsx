"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  Compass,
  ClipboardList,
  HelpCircle,
  Plus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_DASHBOARDS } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export default function SiteNavbar() {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { lang, setLang, t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Hide navbar when scrolled past half the page AND scrolling down.
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        const halfPage = document.body.scrollHeight / 2;
        setScrolled(currentY > 16);
        if (currentY < 80) {
          setHidden(false);
        } else if (currentY > halfPage && currentY > lastScrollY + 4) {
          setHidden(true);
        } else if (currentY < lastScrollY - 4) {
          setHidden(false);
        }
        lastScrollY = currentY;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (pathname?.startsWith("/dashboard")) return null;

  const menuLinks = [
    { label: t("nav.explore"), href: "/explore", icon: Compass },
    { label: t("nav.service"), href: "/service", icon: ClipboardList },
    { label: t("nav.faq"), href: "/faq", icon: HelpCircle },
    ...(user ? [{ label: t("nav.dashboard"), href: ROLE_DASHBOARDS[user.role], icon: LayoutDashboard }] : []),
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: hidden ? -100 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50"
      style={{ pointerEvents: hidden ? "none" : "auto" }}
    >
      <nav
        className={cn(
          "glass-iphone mx-auto flex h-14 items-center justify-between gap-2 px-3 transition-all duration-500 sm:h-16 sm:px-5",
          "mt-4 sm:mt-1",
          scrolled ? "shadow-2xl" : ""
        )}
        style={{ width: "calc(100% - 1rem)", maxWidth: "100%" }}
      >
        {/* === LEFT: Brand === */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="MedLink SA home">
          <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-medical to-cyan-400 shadow-[0_4px_16px_var(--glow-1)]">
            <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
            <span className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/30" />
          </span>
          <div className="hidden flex-col sm:flex" style={{ gap: "0.2rem" }}>
            <span className="font-display text-[0.95rem] font-semibold leading-none tracking-tight">
              MedLink<span className="text-medical"> SA</span>
            </span>
            <span className="text-[0.5rem] font-medium uppercase leading-none tracking-[0.18em] text-muted-foreground">
              National Health Network
            </span>
          </div>
        </Link>

        {/* === CENTER: Emergency button === */}
        <Link
          href="/service"
          className="emergency-fab grid h-11 w-11 shrink-0 place-items-center rounded-full"
          aria-label="Emergency — call ambulance"
          title="Emergency: call an ambulance to your location"
        >
          <Plus className="h-6 w-6" strokeWidth={3} />
        </Link>

        {/* === RIGHT: Actions === */}
        <div className="flex shrink-0 items-center gap-1.5">
          {/* Language switcher */}
          <LanguageSwitcher />

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {mounted && theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Auth CTA — gated on mounted to avoid hydration mismatch */}
          {!mounted ? (
            <span className="hidden h-9 w-24 rounded-lg md:inline-block" />
          ) : user ? (
            <Button
              variant="outline"
              onClick={() => router.push(ROLE_DASHBOARDS[user.role])}
              className="hidden items-center gap-2 rounded-lg px-3 py-1.5 font-semibold md:flex"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-[0.6rem] font-bold text-white">
                {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </span>
              {t("nav.dashboard")}
            </Button>
          ) : (
            <Button variant="outline" asChild className="hidden rounded-lg px-4 py-2 font-semibold md:inline-flex">
              <Link href="/sign-in">{t("nav.signin")}</Link>
            </Button>
          )}

          {/* Hamburger */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>

      {/* Opaque dropdown — uses bg-card (not white/transparent) for readability */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <div className="fixed inset-0 top-0 z-40 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-2 top-16 z-50 mt-2 w-auto min-w-[240px] max-w-[320px] rounded-2xl border border-border bg-card p-3 shadow-2xl sm:top-20 sm:right-3 sm:left-auto sm:inset-x-auto lg:right-5"
            >
              <div className="grid gap-1">
                {menuLinks.map((l) => (
                  <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-foreground/5">
                    <l.icon className="h-4 w-4 text-muted-foreground" />
                    {l.label}
                  </Link>
                ))}
              </div>
              <div className="my-2 hairline" />
              {/* Language switcher in dropdown */}
              <div className="mb-2 px-3 py-1.5">
                <LanguageSwitcher variant="sm" />
              </div>
              <div className="my-2 hairline" />
              {user ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-xs font-bold text-white">
                      {user.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{user.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{user.email}</div>
                    </div>
                  </div>
                  <Button variant="ghost" onClick={() => { signOut(); setMobileOpen(false); router.push("/"); }} className="w-full justify-start gap-3 rounded-xl px-3 py-3 text-sm text-rose-500 hover:bg-rose-500/10">
                    <LogOut className="h-4 w-4" />
                    {t("nav.signout")}
                  </Button>
                </div>
              ) : (
                <div className="grid gap-2">
                  <Button variant="outline" asChild className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold">
                    <Link href="/sign-in" onClick={() => setMobileOpen(false)}>
                      {t("nav.signin")}
                    </Link>
                  </Button>
                  <Button variant="default" asChild className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold">
                    <Link href="/sign-up" onClick={() => setMobileOpen(false)}>
                      {t("nav.getstarted")}
                    </Link>
                  </Button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
