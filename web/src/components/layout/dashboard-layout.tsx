"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  Command,
  Plus,
  ChevronDown,
  Languages,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { useAuth, ROLE_LABELS, type UserRole } from "@/lib/auth-context";
import { useLang, LANGUAGES, type LangCode } from "@/lib/lang-context";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number | string;
};

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  patient: [
    { label: "Overview", href: "/dashboard/patient", icon: Home },
    { label: "Appointments", href: "/dashboard/patient?tab=appointments", icon: Calendar },
    { label: "Records", href: "/dashboard/patient?tab=records", icon: FileText },
    { label: "Prescriptions", href: "/dashboard/patient?tab=prescriptions", icon: Pill },
    { label: "Order medicine", href: "/dashboard/patient?tab=medicine", icon: Truck },
    { label: "Telemedicine", href: "/dashboard/patient?tab=video", icon: Video },
    { label: "Queue ticket", href: "/service", icon: QrCode },
    { label: "Verify ID", href: "/dashboard/patient?tab=verify", icon: ShieldCheck },
    { label: "Messages", href: "/dashboard/patient?tab=messages", icon: MessageSquare, badge: 3 },
    { label: "Settings", href: "/dashboard/patient?tab=settings", icon: Settings },
  ],
  doctor: [
    { label: "Overview", href: "/dashboard/doctor", icon: Home },
    { label: "Schedule", href: "/dashboard/doctor?tab=schedule", icon: Calendar },
    { label: "Patients", href: "/dashboard/doctor?tab=patients", icon: Users },
    { label: "Prescriptions", href: "/dashboard/doctor?tab=prescriptions", icon: Pill },
    { label: "Video consults", href: "/dashboard/doctor?tab=video", icon: Video },
    { label: "Clinical notes", href: "/dashboard/doctor?tab=notes", icon: FileText },
    { label: "Messages", href: "/dashboard/doctor?tab=messages", icon: MessageSquare, badge: 5 },
    { label: "Settings", href: "/dashboard/doctor?tab=settings", icon: Settings },
  ],
  hospital: [
    { label: "Overview", href: "/dashboard/hospital", icon: Home },
    { label: "Beds & wards", href: "/dashboard/hospital?tab=beds", icon: BedDouble },
    { label: "Queue", href: "/dashboard/hospital?tab=queue", icon: ListOrdered },
    { label: "Staff", href: "/dashboard/hospital?tab=staff", icon: Users },
    { label: "Approvals", href: "/dashboard/hospital?tab=approvals", icon: UserCheck, badge: 2 },
    { label: "Departments", href: "/dashboard/hospital?tab=departments", icon: Building2 },
    { label: "Settings", href: "/dashboard/hospital?tab=settings", icon: Settings },
  ],
  pharmacy: [
    { label: "Overview", href: "/dashboard/pharmacy", icon: Home },
    { label: "Orders", href: "/dashboard/pharmacy?tab=orders", icon: ShoppingCart, badge: 4 },
    { label: "Inventory", href: "/dashboard/pharmacy?tab=inventory", icon: Package },
    { label: "Medicine & pricing", href: "/dashboard/pharmacy?tab=pricing", icon: Tag },
    { label: "Delivery", href: "/dashboard/pharmacy?tab=delivery", icon: Truck, badge: 2 },
    { label: "Settings", href: "/dashboard/pharmacy?tab=settings", icon: Settings },
  ],
  admin: [
    { label: "Overview", href: "/dashboard/admin", icon: Home },
    { label: "Users", href: "/dashboard/admin?tab=users", icon: Users },
    { label: "Hospitals", href: "/dashboard/admin?tab=hospitals", icon: Building2 },
    { label: "Verifications", href: "/dashboard/admin?tab=verifications", icon: ShieldCheck, badge: 3 },
    { label: "Audit log", href: "/dashboard/admin?tab=audit", icon: ScrollText },
    { label: "System health", href: "/dashboard/admin?tab=health", icon: Activity },
    { label: "Settings", href: "/dashboard/admin?tab=settings", icon: Settings },
  ],
};

import {
  Home,
  Calendar,
  FileText,
  Pill,
  Truck,
  Video,
  QrCode,
  ShieldCheck,
  MessageSquare,
  Settings,
  Users,
  BedDouble,
  ListOrdered,
  UserCheck,
  Building2,
  ShoppingCart,
  Package,
  Tag,
  ScrollText,
} from "lucide-react";

export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role: UserRole;
}) {
  const { user, loading, signOut } = useAuth();
  const { lang, setLang } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // auth guard — only fires when auth state actually changes, not on every pathname change
  useEffect(() => {
    if (!loading && (!user || user.role !== role)) {
      router.replace("/sign-in?redirect=" + encodeURIComponent("/dashboard/" + role));
    }
  }, [user, loading, role]);

  // Cmd+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Wait for mount before rendering user-dependent content — prevents
  // hydration mismatch (user is null on server, populated from localStorage
  // on client via lazy useState initializer).
  if (!mounted || loading || !user) {
    return (
      <div className="grid min-h-[100svh] place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-medical border-t-transparent" />
      </div>
    );
  }

  const items = NAV_BY_ROLE[role];
  const activeHref = pathname + (typeof window !== "undefined" ? window.location.search : "");

  return (
    <div className="min-h-[100svh] bg-background">
      {/* ambient bg */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-[0.25] dark:opacity-[0.08]" />
        <div
          className="glow-orb"
          style={{
            width: 500,
            height: 500,
            background: "var(--glow-1)",
            top: "-15%",
            right: "-10%",
            opacity: 0.4,
          }}
        />
      </div>

      {/* Desktop sidebar */}
      <aside className="glass-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border/50 px-5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-medical to-cyan-400 shadow-[0_4px_16px_var(--glow-1)]">
              <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
            </span>
            <span className="font-display text-sm font-semibold tracking-tight">
              MedLink<span className="text-medical"> SA</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <div className="px-2 py-2 text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
            {ROLE_LABELS[role]} workspace
          </div>
          {items.map((item) => {
            const isActive = activeHref.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn("nav-item", isActive && "active")}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className="grid h-5 min-w-5 place-items-center rounded-full bg-medical px-1 text-[0.6rem] font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border/50 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-[0.65rem] font-bold text-white">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-semibold">{user.name}</div>
              <div className="truncate text-[0.65rem] text-muted-foreground">
                {user.email}
              </div>
            </div>
            <button
              onClick={() => {
                signOut();
                router.push("/");
              }}
              className="btn-ghost grid h-7 w-7 place-items-center rounded-md"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar (drawer) */}
      <AnimatePresence>
        {mobileNav && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNav(false)}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="glass-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col lg:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-border/50 px-5">
                <Link href="/" className="flex items-center gap-2.5">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-medical to-cyan-400">
                    <Activity className="h-4 w-4 text-white" strokeWidth={2.5} />
                  </span>
                  <span className="font-display text-sm font-semibold">
                    MedLink<span className="text-medical"> SA</span>
                  </span>
                </Link>
                <button
                  onClick={() => setMobileNav(false)}
                  className="btn-ghost grid h-8 w-8 place-items-center rounded-md"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
                {items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileNav(false)}
                    className={cn(
                      "nav-item",
                      activeHref.startsWith(item.href.split("?")[0]) && "active"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-medical px-1 text-[0.6rem] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-border/50 p-3">
                <button
                  onClick={() => {
                    signOut();
                    router.push("/");
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2.5 text-sm text-rose-500 hover:bg-rose-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="glass-strong sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/50 px-4 sm:px-6">
          <button
            onClick={() => setMobileNav(true)}
            className="btn-ghost grid h-9 w-9 place-items-center rounded-lg lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-4 w-4" />
          </button>

          <button
            onClick={() => setCmdOpen(true)}
            className="input-premium hidden h-9 max-w-xs flex-1 items-center gap-2 px-3 text-sm text-muted-foreground sm:flex"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search…</span>
            <kbd className="ml-auto rounded bg-foreground/10 px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold">
              ⌘K
            </kbd>
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              href="/service"
              className="emergency-fab grid h-9 w-9 place-items-center rounded-full sm:hidden"
              aria-label="Emergency"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
            </Link>
            {/* Language switcher */}
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="btn-ghost flex h-9 items-center gap-1 rounded-lg px-2"
                aria-label="Change language"
                aria-expanded={langOpen}
              >
                <Languages className="h-4 w-4" />
                <span className="hidden text-[0.65rem] font-bold uppercase sm:inline">{lang}</span>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-11 z-50 w-44 overflow-hidden rounded-xl border border-border bg-card p-1 shadow-2xl"
                    >
                      {LANGUAGES.map((l) => (
                        <button
                          key={l.code}
                          onClick={() => { setLang(l.code as LangCode); setLangOpen(false); }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-foreground/5",
                            lang === l.code && "bg-foreground/5"
                          )}
                        >
                          <span className="font-medium">{l.native}</span>
                          {lang === l.code && <Check className="h-3.5 w-3.5 text-medical" />}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="btn-ghost grid h-9 w-9 place-items-center rounded-lg"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              className="btn-ghost relative grid h-9 w-9 place-items-center rounded-lg"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>
            <div className="flex items-center gap-2 rounded-lg px-2 py-1">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-medical to-cyan-400 text-[0.6rem] font-bold text-white">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div className="hidden sm:block">
                <div className="text-xs font-semibold leading-tight">
                  {user.name.split(" ")[0]}
                </div>
                <div className="text-[0.65rem] text-muted-foreground">
                  {ROLE_LABELS[role]}
                </div>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      {/* Command menu (simplified, reuses site one) */}
      <DashboardCommandMenu
        open={cmdOpen}
        onOpenChange={setCmdOpen}
        items={items}
      />
    </div>
  );
}

/* ---------------- Inline command menu for dashboards ---------------- */
function DashboardCommandMenu({
  open,
  onOpenChange,
  items,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  items: NavItem[];
}) {
  const [query, setQuery] = useState("");
  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(query.toLowerCase())
  );
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-start justify-center px-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
            className="glass-strong relative w-full max-w-lg overflow-hidden rounded-2xl p-0 shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search this workspace…"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              <Command className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="max-h-[52vh] overflow-y-auto p-2">
              {filtered.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => onOpenChange(false)}
                  className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-colors hover:bg-medical/10"
                >
                  <span className="grid h-7 w-7 place-items-center rounded-md bg-foreground/5 text-muted-foreground">
                    <item.icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="flex-1 font-medium">{item.label}</span>
                </Link>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-10 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
