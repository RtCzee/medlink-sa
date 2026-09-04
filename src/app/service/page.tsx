"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  QrCode,
  Clock,
  Users,
  Bell,
  ArrowRight,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Plus,
  Stethoscope,
  Building2,
  Pill,
  Navigation,
} from "lucide-react";
import SiteNavbar from "@/components/layout/site-navbar";
import SiteFooter from "@/components/layout/site-footer";
import { useAuth } from "@/lib/auth-context";
import { FACILITIES, CURRENT_TICKET, QUEUE_STATE } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;

function ServiceContent() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [view, setView] = useState<"home" | "ticket" | "emergency">(
    (params.get("view") as "home" | "ticket" | "emergency") || "home"
  );
  const [nowServing, setNowServing] = useState(QUEUE_STATE.nowServing);
  const [ticket, setTicket] = useState<typeof CURRENT_TICKET | null>(
    user?.role === "patient" ? CURRENT_TICKET : null
  );
  const [selectedFacility, setSelectedFacility] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("General");
  const [emergencyStep, setEmergencyStep] = useState<"confirm" | "dispatched">(
    "confirm"
  );
  const [eta, setEta] = useState(8);

  // live now-serving counter
  useEffect(() => {
    if (view !== "ticket") return;
    const id = setInterval(() => {
      setNowServing((n) => {
        if (n >= (ticket?.number ?? 42)) return n;
        return n + 1;
      });
    }, 9000);
    return () => clearInterval(id);
  }, [view, ticket]);

  const facilities = FACILITIES.filter(
    (f) => f.category === "hospital" || f.category === "clinic"
  );

  const issueTicket = () => {
    if (!user) {
      router.push("/sign-in?redirect=/service");
      return;
    }
    const newTicket = {
      ...CURRENT_TICKET,
      number: Math.floor(Math.random() * 80) + 43,
      facility: selectedFacility || "Rosebank Clinic",
      service: selectedService,
      issuedAt: "Just now",
      estimatedWaitMin: 32,
      status: "waiting" as const,
    };
    setTicket(newTicket);
    setNowServing(newTicket.number - 6);
    setView("ticket");
    toast.success(`Queue ticket #${newTicket.number} issued`);
  };

  const callEmergency = () => {
    setEmergencyStep("dispatched");
    setEta(8);
    const id = setInterval(() => {
      setEta((e) => (e > 1 ? e - 1 : e));
    }, 4000);
    setTimeout(() => clearInterval(id), 40000);
  };

  return (
    <div className="min-h-[100svh] bg-background">
      <SiteNavbar />

      {/* ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-[0.25] dark:opacity-[0.08]" />
        <div
          className="glow-orb animate-float-slow"
          style={{
            width: 480,
            height: 480,
            background:
              view === "emergency" ? "rgba(239,68,68,0.18)" : "var(--glow-1)",
            top: "10%",
            right: "-8%",
          }}
        />
      </div>

      <main className="mx-auto max-w-5xl px-4 pb-20 pt-28 sm:px-6 sm:pt-32">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10 text-center"
        >
          <span className="chip mb-4">
            <span className="status-dot bg-medical" />
            Service & queue
          </span>
          <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {view === "emergency"
              ? "Emergency response"
              : view === "ticket"
                ? "Your queue ticket"
                : "Skip the waiting room"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
            {view === "emergency"
              ? "An ambulance is on its way. Stay on the line."
              : view === "ticket"
                ? "We'll tell you when your number is ~10 minutes away. Relax somewhere comfortable."
                : "Pull a queue ticket from home. We'll notify you when it's almost your turn — so you stop waiting in corridors."}
          </p>
        </motion.div>

        {/* Mode switcher */}
        <div className="mb-8 flex justify-center">
          <div className="glass-strong inline-flex gap-1 rounded-2xl p-1.5">
            <Button
              variant={view === "home" ? "default" : "ghost"}
              onClick={() => setView("home")}
              className="rounded-xl px-4 py-2 font-semibold"
            >
              <QrCode className="h-4 w-4" />
              Queue ticket
            </Button>
            <Button
              variant={view === "emergency" ? "default" : "ghost"}
              onClick={() => {
                setView("emergency");
                setEmergencyStep("confirm");
              }}
              className={cn(
                "rounded-xl px-4 py-2 font-semibold",
                view === "emergency" && "bg-gradient-to-r from-rose-500 to-red-600 text-white hover:bg-gradient-to-r hover:from-rose-500 hover:to-red-600"
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={3} />
              Emergency
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {view === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]"
            >
              {/* Left: get a ticket */}
              <div className="glass-panel p-6 sm:p-8">
                <h2 className="font-display text-xl font-semibold">
                  Get a queue ticket
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose a facility and service. We'll assign the next number.
                </p>

                <div className="mt-6 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Facility
                    </label>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {facilities.slice(0, 4).map((f) => (
                        <Button
                          key={f.id}
                          variant="outline"
                          onClick={() => setSelectedFacility(f.name)}
                          className={cn(
                            "flex h-auto items-start gap-2.5 p-3 text-left",
                            selectedFacility === f.name
                              ? "border-medical bg-medical/10 ring-1 ring-medical/30"
                              : "border-border bg-card/40 hover:border-medical/40"
                          )}
                        >
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-medical/12 text-medical">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">
                              {f.name}
                            </div>
                            <div className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {f.distanceKm} km · wait ~{f.queueWait}min
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Service
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {["General", "Triage", "Lab", "Pharmacy", "Vaccination"].map(
                        (s) => (
                          <Button
                            key={s}
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedService(s)}
                            className={cn(
                              "rounded-full px-3",
                              selectedService === s
                                ? "border border-medical bg-medical/15 text-medical"
                                : ""
                            )}
                          >
                            {s}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  <Button
                    variant="default"
                    onClick={issueTicket}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold"
                  >
                    <QrCode className="h-5 w-5" />
                    Issue my queue ticket
                  </Button>
                  {!user && (
                    <p className="text-center text-xs text-muted-foreground">
                      You&apos;ll need to sign in first.{" "}
                      <Link href="/sign-in" className="font-semibold text-medical">
                        Sign in
                      </Link>
                    </p>
                  )}
                </div>
              </div>

              {/* Right: how it works */}
              <div className="space-y-4">
                <div className="glass-panel p-6">
                  <h3 className="font-display text-base font-semibold">
                    How the queue works
                  </h3>
                  <ol className="mt-4 space-y-4">
                    {[
                      {
                        icon: QrCode,
                        title: "Pull a ticket",
                        desc: "From home or on the way. No need to be in the building.",
                      },
                      {
                        icon: Clock,
                        title: "Watch the live counter",
                        desc: "We show who's being seen now, in real time.",
                      },
                      {
                        icon: Bell,
                        title: "Come when it's near",
                        desc: "We notify you ~10 minutes before your number.",
                      },
                      {
                        icon: AlertTriangle,
                        title: "Missed your turn?",
                        desc: "You'll be skipped — and re-queued after 5 people.",
                      },
                    ].map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-medical/12 text-medical">
                          <s.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="text-sm font-semibold">
                            {i + 1}. {s.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {s.desc}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="glass-panel border-amber-500/20 p-5">
                  <div className="flex gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
                    <div>
                      <div className="text-sm font-semibold">
                        Why this matters
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        South African clinics are overcrowded. Patients wait
                        hours in corridors for 5-minute consults. Live queueing
                        spreads the load — and keeps infectious people out of
                        crowded waiting rooms.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {view === "ticket" && ticket && (
            <motion.div
              key="ticket"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mx-auto max-w-2xl"
            >
              <div className="glass-panel relative overflow-hidden p-6 sm:p-10">
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <div
                    className="glow-orb"
                    style={{
                      width: 300,
                      height: 300,
                      background: "var(--glow-1)",
                      top: "-20%",
                      right: "-10%",
                    }}
                  />
                </div>

                {/* QR + number */}
                <div className="flex flex-col items-center text-center">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Now serving at {ticket.facility}
                  </div>
                  <motion.div
                    key={nowServing}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="font-display text-7xl font-bold text-medical sm:text-8xl"
                  >
                    {String(nowServing).padStart(2, "0")}
                  </motion.div>

                  <div className="my-6 hairline w-full" />

                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your number
                  </div>
                  <div className="font-display text-6xl font-bold sm:text-7xl">
                    {ticket.number}
                  </div>

                  {/* QR */}
                  <div className="mt-6 grid h-40 w-40 place-items-center rounded-2xl bg-white dark:bg-slate-800 p-3 shadow-lg">
                    <QrPattern seed={ticket.number} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Show this at the clinic, or tap your phone.
                  </div>
                </div>

                {/* stats */}
                <div className="mt-8 grid grid-cols-3 gap-3">
                  <Stat
                    icon={Users}
                    label="Ahead of you"
                    value={String(ticket.number - nowServing)}
                  />
                  <Stat
                    icon={Clock}
                    label="Est. wait"
                    value={`${Math.max(
                      0,
                      (ticket.number - nowServing) * 8
                    )} min`}
                  />
                  <Stat
                    icon={Activity}
                    label="Service"
                    value={ticket.service}
                  />
                </div>

                {/* live status */}
                <div className="mt-6 flex items-center justify-between rounded-xl border border-border bg-card/40 p-4">
                  <div className="flex items-center gap-2.5">
                    <span className="status-dot bg-emerald-500" />
                    <span className="text-sm font-medium">
                      Live · updated {QUEUE_STATE.lastUpdated}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg {QUEUE_STATE.avgWaitMin}min per patient
                  </div>
                </div>

                {/* missed-turn notice */}
                <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/8 p-3.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-xs text-muted-foreground">
                    If you miss your turn, you&apos;ll be skipped and re-queued
                    after 5 patients. Please arrive before your number is called.
                  </p>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => setView("home")}
                    className="flex items-center gap-2 rounded-xl px-4 py-2.5 font-semibold"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    New ticket
                  </Button>
                  <Button
                    variant="default"
                    asChild
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold"
                  >
                    <Link href="/dashboard/patient">
                      Back to dashboard
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {view === "emergency" && (
            <motion.div
              key="emergency"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="mx-auto max-w-2xl"
            >
              <div className="glass-panel relative overflow-hidden border-rose-500/30 p-6 sm:p-10">
                <div className="pointer-events-none absolute inset-0 -z-10">
                  <div
                    className="glow-orb"
                    style={{
                      width: 360,
                      height: 360,
                      background: "rgba(239,68,68,0.18)",
                      top: "-15%",
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  />
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="emergency-fab grid h-20 w-20 place-items-center rounded-full">
                    <Plus className="h-10 w-10" strokeWidth={3} />
                  </div>

                  {emergencyStep === "confirm" ? (
                    <>
                      <h2 className="mt-6 font-display text-2xl font-semibold">
                        Call an ambulance?
                      </h2>
                      <p className="mt-2 max-w-md text-sm text-muted-foreground">
                        This will dispatch the nearest EMS ambulance to your
                        current location. Use only for genuine emergencies.
                      </p>

                      <div className="mt-6 w-full rounded-xl border border-border bg-card/40 p-4 text-left">
                        <div className="flex items-center gap-2 text-sm">
                          <Navigation className="h-4 w-4 text-medical" />
                          <span className="font-semibold">Your location</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Rosebank, Johannesburg · GPS -26.1438, 28.0401
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Building2 className="h-4 w-4 text-medical" />
                          <span className="font-semibold">
                            Nearest EMS station
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Johannesburg EMS · 3.4 km away · 2 units available
                        </div>
                      </div>

                      <Button
                        onClick={callEmergency}
                        className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-base font-bold text-white shadow-[0_8px_30px_rgba(239,68,68,0.5)] transition-transform hover:scale-[1.02]"
                      >
                        <Phone className="h-5 w-5" />
                        Dispatch ambulance now
                      </Button>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Also calls 10177 (national EMS) — stay on the line.
                      </p>
                    </>
                  ) : (
                    <>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-6"
                      >
                        <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                      </motion.div>
                      <h2 className="mt-4 font-display text-2xl font-semibold">
                        Ambulance dispatched
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Unit <span className="font-semibold">EMS-07</span> is on
                        the way. Stay where you are.
                      </p>

                      <div className="mt-8 grid w-full grid-cols-3 gap-3">
                        <Stat icon={Clock} label="ETA" value={`${eta} min`} />
                        <Stat
                          icon={Navigation}
                          label="Distance"
                          value="3.4 km"
                        />
                        <Stat icon={Phone} label="Unit" value="EMS-07" />
                      </div>

                      <div className="mt-6 w-full rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-4 text-left">
                        <div className="flex items-center gap-2 text-sm font-semibold text-emerald-500">
                          <span className="status-dot bg-emerald-500" />
                          Live tracking
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          Driver: J. Mthembu · En route · Heading south on Oxford
                          Rd
                        </div>
                        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-card">
                          <motion.div
                            className="h-full bg-emerald-500"
                            initial={{ width: "10%" }}
                            animate={{ width: "65%" }}
                            transition={{ duration: 20, ease: "linear" }}
                          />
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        onClick={() => {
                          toast.success("Stay calm. Help is on the way.");
                        }}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold"
                      >
                        <Phone className="h-4 w-4" />
                        Call the driver
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Facilities nearby (always visible) */}
        {view !== "emergency" && (
          <div className="mt-14">
            <h3 className="mb-4 font-display text-lg font-semibold">
              Facilities near you
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {FACILITIES.slice(0, 6).map((f) => (
                <div key={f.id} className="glass-card p-4">
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "grid h-9 w-9 place-items-center rounded-lg",
                        f.category === "hospital"
                          ? "bg-medical/12 text-medical"
                          : f.category === "clinic"
                            ? "bg-cyan-500/12 text-cyan-500"
                            : "bg-emerald-500/12 text-emerald-500"
                      )}
                    >
                      {f.category === "pharmacy" ? (
                        <Pill className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                    </span>
                    <span
                      className={cn(
                        "chip py-0 text-[0.6rem]",
                        f.open
                          ? "border-emerald-500/30 text-emerald-500"
                          : "border-rose-500/30 text-rose-500"
                      )}
                    >
                      {f.open ? "Open" : "Closed"}
                    </span>
                  </div>
                  <div className="mt-3 text-sm font-semibold">{f.name}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {f.location} · {f.distanceKm} km
                  </div>
                  {f.queueWait !== undefined && (
                    <div className="mt-2 flex items-center gap-1 text-xs">
                      <Clock className="h-3 w-3 text-medical" />
                      <span className="font-medium text-foreground">
                        ~{f.queueWait}min
                      </span>{" "}
                      <span className="text-muted-foreground">queue wait</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <div className="mt-1.5 text-sm font-bold">{value}</div>
      <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}

/* Decorative QR-style pattern (no library) */
function QrPattern({ seed }: { seed: number }) {
  // deterministic pseudo-random based on seed
  const cells = 21;
  const rng = (i: number, j: number) => {
    const x = Math.sin((i + 1) * 7.3 + (j + 1) * 13.1 + seed * 0.7) * 10000;
    return x - Math.floor(x) > 0.5;
  };
  const isFinder = (i: number, j: number) => {
    const inBox = (oi: number, oj: number) =>
      i >= oi && i < oi + 7 && j >= oj && j < oj + 7;
    return inBox(0, 0) || inBox(0, cells - 7) || inBox(cells - 7, 0);
  };
  const finderOn = (i: number, j: number) => {
    const ii = i % 7;
    const jj = j % 7;
    if (ii === 0 || ii === 6 || jj === 0 || jj === 6) return true;
    if (ii >= 2 && ii <= 4 && jj >= 2 && jj <= 4) return true;
    return false;
  };
  return (
    <svg viewBox={`0 0 ${cells} ${cells}`} className="h-full w-full">
      {Array.from({ length: cells }).map((_, i) =>
        Array.from({ length: cells }).map((_, j) => {
          let on = false;
          if (isFinder(i, j)) on = finderOn(i, j);
          else on = rng(i, j);
          if (!on) return null;
          return (
            <rect
              key={`${i}-${j}`}
              x={j}
              y={i}
              width={1}
              height={1}
              fill="#0b1220"
            />
          );
        })
      )}
    </svg>
  );
}

export default function ServicePage() {
  return (
    <Suspense fallback={<div className="min-h-[100svh]" />}>
      <ServiceContent />
    </Suspense>
  );
}
