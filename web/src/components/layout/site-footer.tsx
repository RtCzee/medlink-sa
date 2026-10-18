"use client";

import Link from "next/link";
import {
  Activity,
  Github,
  Twitter,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { motion } from "framer-motion";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "For patients", href: "/sign-up?role=patient" },
      { label: "For doctors", href: "/sign-up?role=doctor" },
      { label: "For hospitals", href: "/sign-up?role=hospital" },
      { label: "For pharmacies", href: "/sign-up?role=pharmacy" },
      { label: "For administrators", href: "/sign-up?role=admin" },
    ],
  },
  {
    title: "Care",
    links: [
      { label: "Explore facilities", href: "/explore" },
      { label: "Find medicine", href: "/explore?tab=medication" },
      { label: "Queue & service", href: "/service" },
      { label: "Emergency", href: "/service" },
      { label: "Teleconsult", href: "/sign-in" },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "About MedLink SA", href: "/" },
      { label: "Status", href: "/" },
      { label: "Security", href: "/" },
      { label: "DHIS2 integration", href: "/" },
      { label: "API for partners", href: "/" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative mt-auto overflow-hidden border-t border-border bg-background-elev/30">
      {/* ambient top glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-32 h-32">
        <div
          className="glow-orb mx-auto"
          style={{
            width: 600,
            height: 200,
            background: "var(--glow-1)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Top: brand + CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-strong mb-14 flex flex-col items-start justify-between gap-6 rounded-3xl p-6 sm:p-8 lg:flex-row lg:items-center"
        >
          <div>
            <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Ready to join the network?
            </h3>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Patients, doctors, hospitals and pharmacies — one account, one
              record, one country.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sign-up"
              className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              Create account
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sign-in"
              className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        {/* Main grid */}
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          {/* brand */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5" aria-label="MedLink SA">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-medical to-cyan-400 shadow-[0_4px_16px_var(--glow-1)]">
                <Activity className="h-5 w-5 text-white" strokeWidth={2.5} />
              </span>
              <div className="flex flex-col leading-none">
                <span className="font-display text-[0.95rem] font-semibold tracking-tight">
                  MedLink<span className="text-medical"> SA</span>
                </span>
                <span className="text-[0.6rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  National Health Network
                </span>
              </div>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A national digital health ecosystem connecting patients, clinicians,
              facilities and pharmacies across all nine provinces of South Africa.
            </p>
            <div className="mt-5 space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-medical" />
                Johannesburg, Gauteng
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-medical" />
                0800 MEDLINK (0800 633 546)
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-medical" />
                care@medlink.sa
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Github, label: "GitHub" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Linkedin, label: "LinkedIn" },
                { Icon: Mail, label: "Email" },
              ].map(({ Icon, label }) => (
                <Link
                  key={label}
                  href="/"
                  aria-label={label}
                  className="glass grid h-9 w-9 place-items-center rounded-lg transition-transform hover:-translate-y-0.5"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-medical"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* provinces marquee */}
        <div className="my-10 overflow-hidden">
          <div className="flex w-max animate-marquee items-center gap-3 opacity-50">
            {[
              "Eastern Cape",
              "Free State",
              "Gauteng",
              "KwaZulu-Natal",
              "Limpopo",
              "Mpumalanga",
              "North West",
              "Northern Cape",
              "Western Cape",
              "Eastern Cape",
              "Free State",
              "Gauteng",
              "KwaZulu-Natal",
              "Limpopo",
              "Mpumalanga",
              "North West",
              "Northern Cape",
              "Western Cape",
            ].map((p, i) => (
              <span
                key={i}
                className="flex items-center gap-2 whitespace-nowrap text-xs font-medium uppercase tracking-widest text-muted-foreground"
              >
                <span className="h-1 w-1 rounded-full bg-medical" />
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} MedLink SA · Built for South Africa.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/" className="hover:text-foreground">
              POPIA
            </Link>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              POPIA compliant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="status-dot bg-emerald-500" />
              All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
