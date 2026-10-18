"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Command,
  ScrollText,
  LayoutGrid,
  WifiOff,
  GraduationCap,
  Languages,
  ChevronDown,
  Check,
  Sparkles,
} from "lucide-react";
import { COMPETITORS, AUDIT_EVENTS } from "@/lib/data";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const ICONS: Record<string, React.ElementType> = {
  c1: Command,
  c2: ScrollText,
  c3: LayoutGrid,
  c4: WifiOff,
  c5: GraduationCap,
  c6: Languages,
};

const STATUS_STYLE: Record<string, string> = {
  live: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  integrated: "bg-medical/15 text-medical border-medical/20",
  planned: "bg-amber-500/15 text-amber-500 border-amber-500/20",
};

export default function CompetitiveSection() {
  const [openAudit, setOpenAudit] = useState<string | null>("a1");

  return (
    <section
      id="roadmap"
      className="relative overflow-hidden py-20 sm:py-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-dots absolute inset-0 opacity-40 dark:opacity-20" />
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Heading */}
        <div className="mb-12 max-w-2xl">
          <span className="chip mb-4">
            <Sparkles className="h-3 w-3" />
            Standout features
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            The best ideas from the best products,
            <span className="text-gradient-medical"> made for health.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            We studied how Linear, Notion, Vinta and Doximity make their tools
            feel effortless — then rebuilt them for the clinic, the ward and the
            field.
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPETITORS.map((c, i) => {
            const Icon = ICONS[c.id] ?? Command;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.6, ease: EASE, delay: i * 0.06 }}
                className="card-premium group relative overflow-hidden p-5"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-medical/20 to-cyan-400/10 text-medical transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider",
                      STATUS_STYLE[c.status]
                    )}
                  >
                    {c.status}
                  </span>
                </div>
                <h3 className="font-display text-base font-semibold">
                  {c.name}
                </h3>
                <p className="mt-1 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
                  {c.region}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {c.feature}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Notion-style audit log demo */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: EASE }}
          className="glass-card mt-12 overflow-hidden p-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-foreground/5">
                <ScrollText className="h-4 w-4 text-medical" />
              </span>
              <div>
                <h3 className="font-display text-sm font-semibold">
                  Audit timeline
                </h3>
                <p className="text-xs text-muted-foreground">
                  Every action, attributable — readable like a story.
                </p>
              </div>
            </div>
            <span className="chip">
              <span className="status-dot bg-emerald-500" />
              live
            </span>
          </div>
          <div className="divide-y divide-border">
            {AUDIT_EVENTS.map((ev) => {
              const open = openAudit === ev.id;
              return (
                <div key={ev.id}>
                  <button
                    onClick={() => setOpenAudit(open ? null : ev.id)}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-foreground/[0.03]"
                    aria-expanded={open}
                  >
                    <KindDot kind={ev.kind} />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">
                          {ev.actor}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {ev.action}
                        </span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {ev.target}
                      </p>
                    </div>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                      {ev.time}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-muted-foreground transition-transform",
                        open && "rotate-180"
                      )}
                    />
                  </button>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      transition={{ duration: 0.25, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 bg-foreground/[0.02] px-5 py-3 pl-12">
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs text-muted-foreground">
                          Attested &amp; signed · IP{" "}
                          <span className="font-mono">196.21.{ev.kind === "system" ? "0.*" : "12.*"}</span> ·
                          immutably stored
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function KindDot({ kind }: { kind: string }) {
  const map: Record<string, string> = {
    auth: "bg-medical",
    edit: "bg-amber-500",
    create: "bg-emerald-500",
    delete: "bg-rose-500",
    system: "bg-violet-500",
    verify: "bg-cyan-500",
  };
  return <span className={cn("status-dot", map[kind] ?? "bg-muted-foreground")} />;
}
