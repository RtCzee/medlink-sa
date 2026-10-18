"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  LifeBuoy,
  Mail,
  MessageCircle,
  Phone,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import SiteNavbar from "@/components/layout/site-navbar";
import SiteFooter from "@/components/layout/site-footer";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

type Category =
  | "Getting started"
  | "Patients"
  | "Queue & service"
  | "Doctors & hospitals"
  | "Pharmacies"
  | "Privacy & security";

interface Faq {
  q: string;
  a: string;
  category: Category;
}

const FAQS: Faq[] = [
  // Getting started
  {
    category: "Getting started",
    q: "Who can sign up for MedLink SA?",
    a: "Anyone in South Africa can create an account — patients, doctors, pharmacists, hospital administrators and facility managers. Patients only need a South African ID or passport and a phone number; healthcare professionals must be verified against their HPCSA registration before they can practise on the network.",
  },
  {
    category: "Getting started",
    q: "Which provinces does MedLink SA cover?",
    a: "MedLink SA is live in all nine provinces — Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, North West, Northern Cape and Western Cape. Coverage depth (public clinics vs private hospitals vs pharmacies) varies by district and grows weekly.",
  },
  {
    category: "Getting started",
    q: "Do I need a smartphone to use it?",
    a: "No. The full experience lives on the web (and an Android app), but patients can also join a queue, receive a ticket and get SMS reminders using a basic feature phone via USSD on *134*633#.",
  },

  // Patients
  {
    category: "Patients",
    q: "How do I book an appointment?",
    a: "Sign in, open Explore, pick a facility and tap Book. You can filter by speciality, language, distance and the next available slot. Confirmed bookings appear on your dashboard and trigger an SMS reminder 24 hours and 1 hour before.",
  },
  {
    category: "Patients",
    q: "Can I see my full medical record?",
    a: "Yes. Every consultation, prescription, lab result and vaccination logged by a verified clinician on MedLink SA appears in your Record tab. Download a PDF summary, share a time-limited link with a specialist, or revoke access at any time.",
  },
  {
    category: "Patients",
    q: "What does it cost?",
    a: "MedLink SA is free for patients at public-sector facilities. Private clinics and pharmacies set their own consultation and dispensing fees, which are shown up-front before you confirm a booking or medicine order.",
  },

  // Queue & service
  {
    category: "Queue & service",
    q: "How does the virtual queue work?",
    a: "When you arrive at a participating clinic (or check in remotely), MedLink issues a digital ticket showing your number, estimated wait and live position. You'll get an SMS when you're 5 patients away so you can step out instead of sitting in a waiting room.",
  },
  {
    category: "Queue & service",
    q: "What happens if I miss my turn?",
    a: "If you miss being called, the system automatically re-queues you 5 positions back rather than sending you to the end. After three misses in a day the ticket expires and you'll need a new one — this keeps the queue fair for everyone.",
  },
  {
    category: "Queue & service",
    q: "Can I call an ambulance through MedLink?",
    a: "Yes. The red emergency button on every screen dispatches the nearest registered EMS provider with your GPS location, a one-tap call to 10177, and an optional pre-alert to your emergency contact and nearest hospital trauma unit.",
  },

  // Doctors & hospitals
  {
    category: "Doctors & hospitals",
    q: "How are doctors verified?",
    a: "Doctors register with their HPCSA number and ID. MedLink SA cross-checks the HPCSA register, the facility's HR roster and a one-time in-person or video check before activating clinical privileges. Re-verification happens annually and on role change.",
  },
  {
    category: "Doctors & hospitals",
    q: "Can hospitals manage beds and wards on the platform?",
    a: "Yes. The Hospital dashboard includes a real-time bed board with status colours (available, cleaning, occupied, reserved), ward-level filters, and discharge planning tools that freed beds up to 30% faster in pilot sites.",
  },
  {
    category: "Doctors & hospitals",
    q: "Does MedLink integrate with DHIS2?",
    a: "Yes — MedLink SA pushes aggregated daily indicators (attendances, admissions, discharges, stock-outs) into the national DHIS2 instance via a signed webhook, so district and provincial managers see one consistent source of truth.",
  },

  // Pharmacies
  {
    category: "Pharmacies",
    q: "How do I order medicine online?",
    a: "Open Explore → Medication, search by brand or generic name, and we'll show real-time stock and price at pharmacies near you. Add to cart, attach your prescription, and choose collection or same-day delivery.",
  },
  {
    category: "Pharmacies",
    q: "What if my medicine is out of stock?",
    a: "MedLink SA automatically surfaces the three nearest pharmacies with stock, the generic equivalent, and the estimated resupply date at your usual branch. You can reserve stock with one tap and collect it within 48 hours.",
  },
  {
    category: "Pharmacies",
    q: "How are Schedule 4–6 medicines handled?",
    a: "All prescription-only items require a valid electronic prescription signed by a verified clinician. Schedule 5 and 6 dispensing is biometrically confirmed at collection, logged to a tamper-evident audit trail, and reported to the relevant authority.",
  },

  // Privacy & security
  {
    category: "Privacy & security",
    q: "Is MedLink SA POPIA compliant?",
    a: "Yes. MedLink SA is built around the Protection of Personal Information Act: purpose-bound consent, data minimisation, encryption in transit and at rest, a resident data subject access request flow, and a documented Information Officer.",
  },
  {
    category: "Privacy & security",
    q: "Who can see my health data?",
    a: "Only you, by default. A clinician can view your record only after you grant access (or in a verified emergency break-glass flow), and every view is logged. You can see exactly who accessed what, when, and revoke access instantly.",
  },
  {
    category: "Privacy & security",
    q: "Where is my data stored?",
    a: "All identifiable health data is stored on encrypted, POPIA-resident infrastructure inside South Africa. Aggregated, de-identified indicators may be processed for public-health reporting in line with the National Health Act.",
  },
];

const CATEGORIES: Category[] = [
  "Getting started",
  "Patients",
  "Queue & service",
  "Doctors & hospitals",
  "Pharmacies",
  "Privacy & security",
];

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Category | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      const matchesCat = active === "All" || f.category === active;
      const matchesQ =
        !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
      return matchesCat && matchesQ;
    });
  }, [query, active]);

  const grouped = useMemo(() => {
    const map = new Map<Category, Faq[]>();
    for (const f of filtered) {
      if (!map.has(f.category)) map.set(f.category, []);
      map.get(f.category)!.push(f);
    }
    return CATEGORIES.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, [filtered]);

  return (
    <div className="flex min-h-[100svh] flex-col bg-background">
      <SiteNavbar />

      {/* ambient */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="bg-grid absolute inset-0 opacity-[0.25] dark:opacity-[0.08]" />
        <div
          className="glow-orb animate-float-slow"
          style={{
            width: 460,
            height: 460,
            background: "var(--glow-1)",
            top: "6%",
            right: "-8%",
          }}
        />
        <div
          className="glow-orb animate-float-slow"
          style={{
            width: 360,
            height: 360,
            background: "var(--glow-2)",
            bottom: "8%",
            left: "-6%",
            animationDelay: "-5s",
          }}
        />
      </div>

      <main className="flex-1 px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <div className="mx-auto w-[92%] max-w-[1600px]">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="mx-auto max-w-3xl text-center"
          >
            <span className="chip mx-auto mb-5">
              <HelpCircle className="h-3.5 w-3.5 text-medical" />
              Help center
            </span>
            <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              Frequently asked{" "}
              <span className="text-gradient-medical">questions</span>
            </h1>
            <p className="mt-4 text-base text-muted-foreground sm:text-lg">
              Everything about MedLink SA — from your first sign-up to
              ambulance dispatch and POPIA-grade privacy.
            </p>

            {/* Search */}
            <div className="glass-iphone mx-auto mt-8 flex max-w-xl items-center gap-3 rounded-2xl px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search questions, e.g. 'queue', 'POPIA', 'prescription'…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                aria-label="Search FAQs"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="btn-ghost rounded-md px-2 py-1 text-xs"
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>

          {/* Category chips */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE, delay: 0.1 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-2"
          >
            {(["All", ...CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setActive(c)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                  active === c
                    ? "border-medical/40 bg-medical/12 text-medical"
                    : "border-border bg-background/40 text-muted-foreground hover:border-medical/30 hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </motion.div>

          {/* Accordion groups */}
          <div className="mt-12 space-y-12">
            {grouped.length === 0 && (
              <div className="glass-card mx-auto max-w-xl p-10 text-center">
                <p className="text-sm text-muted-foreground">
                  No questions match &ldquo;{query}&rdquo;. Try another term or
                  reach out below.
                </p>
              </div>
            )}

            {grouped.map((group, gi) => (
              <motion.section
                key={group.category}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, ease: EASE, delay: gi * 0.05 }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/12 text-medical">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <h2 className="font-display text-lg font-semibold tracking-tight">
                    {group.category}
                  </h2>
                  <span className="hairline flex-1" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "question" : "questions"}
                  </span>
                </div>

                <div className="space-y-3">
                  {group.items.map((f) => {
                    const id = `${group.category}::${f.q}`;
                    const open = openId === id;
                    return (
                      <div
                        key={id}
                        className={cn(
                          "glass-card overflow-hidden transition-colors",
                          open && "border-medical/40"
                        )}
                      >
                        <button
                          onClick={() => setOpenId(open ? null : id)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                          aria-expanded={open}
                        >
                          <span className="text-[0.95rem] font-semibold leading-snug">
                            {f.q}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-5 w-5 shrink-0 text-medical transition-transform duration-300",
                              open && "rotate-180"
                            )}
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {open && (
                            <motion.div
                              key="content"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: EASE }}
                              className="overflow-hidden"
                            >
                              <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                                {f.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </div>

          {/* Still have a question CTA */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="glass-iphone mt-20 overflow-hidden rounded-3xl p-8 text-center sm:p-12"
          >
            <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-medical/12 text-medical">
              <LifeBuoy className="h-7 w-7" />
            </span>
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Still have a question?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground sm:text-base">
              Our care team replies within one working day. For anything urgent
              — prescriptions, queue issues, emergencies — use the phone line.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <a
                href="mailto:care@medlink.sa"
                className="btn-primary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                <Mail className="h-4 w-4" />
                care@medlink.sa
              </a>
              <Link
                href="/service"
                className="btn-secondary inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                <MessageCircle className="h-4 w-4" />
                Open service hub
              </Link>
              <a
                href="tel:0800633546"
                className="btn-ghost inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold"
              >
                <Phone className="h-4 w-4 text-medical" />
                0800 MEDLINK
              </a>
            </div>
          </motion.div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
