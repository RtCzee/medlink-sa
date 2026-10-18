"use client";

import { Activity, Github, Twitter, Linkedin, Mail } from "lucide-react";

const COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Patients", href: "#roles" },
      { label: "Doctors", href: "#roles" },
      { label: "Hospitals", href: "#roles" },
      { label: "Pharmacies", href: "#roles" },
      { label: "Administrators", href: "#roles" },
    ],
  },
  {
    title: "Capabilities",
    links: [
      { label: "Telemedicine", href: "#features" },
      { label: "Unified records", href: "#features" },
      { label: "DHIS2 sync", href: "#features" },
      { label: "Offline mode", href: "#features" },
      { label: "AI follow-ups", href: "#features" },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "Explore facilities", href: "#explore" },
      { label: "Roadmap", href: "#roadmap" },
      { label: "Status", href: "#platform" },
      { label: "Security", href: "#cta" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#top" },
      { label: "Careers", href: "#cta" },
      { label: "Press", href: "#cta" },
      { label: "Contact", href: "#cta" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border bg-background-elev/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          {/* brand */}
          <div className="max-w-xs">
            <a href="#top" className="flex items-center gap-2.5" aria-label="MedLink SA">
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
            </a>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              A prototype for a national digital health ecosystem — connecting
              patients, clinicians, facilities and administrators across all
              nine provinces.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { Icon: Github, label: "GitHub" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Linkedin, label: "LinkedIn" },
                { Icon: Mail, label: "Email" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#top"
                  aria-label={label}
                  className="btn-ghost grid h-9 w-9 place-items-center rounded-lg border border-border"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {col.title}
              </h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-medical"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="hairline my-10" />

        <div className="flex flex-col items-center justify-between gap-4 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} MedLink SA · Built as a prototype for
            South Africa.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a href="#top" className="hover:text-foreground">
              Privacy
            </a>
            <a href="#top" className="hover:text-foreground">
              Terms
            </a>
            <a href="#top" className="hover:text-foreground">
              POPIA
            </a>
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
