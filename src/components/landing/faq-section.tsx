"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ArrowRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Faq {
  q: string;
  a: string;
}

/**
 * Master FAQ list — 12 realistic South African healthcare questions.
 * Only the first 3 are rendered on the landing page; the full set lives
 * on /faq. Keep these in sync with src/app/faq/page.tsx.
 */
const FAQS: Faq[] = [
  {
    q: "Who can sign up for MedLink SA?",
    a: "Anyone in South Africa — patients, doctors, pharmacists, hospital administrators and facility managers. Patients need a SA ID or passport and a phone number; healthcare professionals are verified against their HPCSA registration.",
  },
  {
    q: "Which provinces does MedLink SA cover?",
    a: "All nine — Eastern Cape, Free State, Gauteng, KwaZulu-Natal, Limpopo, Mpumalanga, North West, Northern Cape and Western Cape. Coverage depth (clinics vs private hospitals vs pharmacies) varies by district and grows weekly.",
  },
  {
    q: "How does the virtual queue work?",
    a: "When you arrive at a participating clinic (or check in remotely), MedLink issues a digital ticket with your number, estimated wait and live position. You get an SMS when you're 5 patients away so you can step out instead of sitting in the waiting room.",
  },
  {
    q: "Can I see my full medical record?",
    a: "Yes. Every consultation, prescription, lab result and vaccination logged by a verified clinician appears in your Record tab. Download a PDF summary, share a time-limited link with a specialist, or revoke access at any time.",
  },
  {
    q: "How do I order medicine online?",
    a: "Open Explore → Medication, search by brand or generic name, and we show real-time stock and price at pharmacies near you. Add to cart, attach your prescription, and choose collection or same-day delivery.",
  },
  {
    q: "What happens if my medicine is out of stock?",
    a: "MedLink automatically surfaces the three nearest pharmacies with stock, the generic equivalent, and the estimated resupply date at your usual branch. Reserve stock with one tap and collect within 48 hours.",
  },
  {
    q: "How are doctors verified?",
    a: "Doctors register with their HPCSA number and ID. We cross-check the HPCSA register, the facility's HR roster and a one-time in-person or video check before activating clinical privileges. Re-verification happens annually.",
  },
  {
    q: "Does MedLink integrate with DHIS2?",
    a: "Yes. MedLink pushes aggregated daily indicators (attendances, admissions, discharges, stock-outs) into the national DHIS2 instance via a signed webhook, so district and provincial managers see one consistent source of truth.",
  },
  {
    q: "Can I call an ambulance through MedLink?",
    a: "Yes. The red emergency button on every screen dispatches the nearest registered EMS provider with your GPS location, a one-tap call to 10177, and an optional pre-alert to your emergency contact and nearest trauma unit.",
  },
  {
    q: "What does it cost?",
    a: "MedLink SA is free for patients at public-sector facilities. Private clinics and pharmacies set their own consultation and dispensing fees, shown up-front before you confirm a booking or medicine order.",
  },
  {
    q: "Is MedLink SA POPIA compliant?",
    a: "Yes. MedLink is built around POPIA: purpose-bound consent, data minimisation, encryption in transit and at rest, a resident data subject access request flow, and a documented Information Officer.",
  },
  {
    q: "Who can see my health data?",
    a: "Only you, by default. A clinician can view your record only after you grant access (or in a verified emergency break-glass flow), and every view is logged. You can see who accessed what, when, and revoke access instantly.",
  },
];

export default function FaqSection() {
  // Only the first 3 questions render here — the rest live on /faq.
  const visible = FAQS.slice(0, 3);
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="glow-orb"
          style={{
            width: 520,
            height: 520,
            background: "var(--glow-1)",
            top: "10%",
            left: "-12%",
          }}
        />
        <div
          className="glow-orb"
          style={{
            width: 380,
            height: 380,
            background: "var(--glow-2)",
            bottom: "0%",
            right: "-8%",
          }}
        />
      </div>

      <div className="mx-auto w-[92%] max-w-[1600px]">
        <div className="mb-12 max-w-2xl">
          <span className="chip mb-4">
            <HelpCircle className="h-3.5 w-3.5 text-medical" />
            Questions, answered
          </span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
            The things South Africans ask us{" "}
            <span className="text-gradient-medical">most.</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            A quick primer on signing up, queueing, ordering medicine and how we
            keep your health data private.
          </p>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Accordion (first 3 only) */}
          <div className="space-y-3">
            {visible.map((f, i) => {
              const open = openId === i;
              return (
                <motion.div
                  key={f.q}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
                  className={cn(
                    "glass-card overflow-hidden transition-colors",
                    open && "border-medical/40"
                  )}
                >
                  <Button
                    variant="ghost"
                    onClick={() => setOpenId(open ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left h-auto"
                    aria-expanded={open}
                  >
                    <span className="text-[0.95rem] font-semibold leading-snug sm:text-base">
                      {f.q}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-5 w-5 shrink-0 text-medical transition-transform duration-300",
                        open && "rotate-180"
                      )}
                    />
                  </Button>
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
                </motion.div>
              );
            })}

            <div className="pt-2">
              <Button variant="secondary" asChild className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold">
                <Link href="/faq">
                  Learn more
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Side card */}
          <motion.aside
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
            className="glass-card flex flex-col justify-between gap-6 p-7 sm:p-8"
          >
            <div>
              <span className="chip mb-4">
                <span className="status-dot bg-emerald-500" />
                Help center
              </span>
              <h3 className="font-display text-xl font-semibold tracking-tight">
                12 questions, all nine provinces.
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                From your very first sign-up to ambulance dispatch and
                POPIA-grade privacy — every answer in the help center is written
                for South African patients, clinicians and pharmacists.
              </p>
            </div>
            <Button variant="default" asChild className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 font-semibold">
              <Link href="/faq">
                Browse all FAQs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.aside>
        </div>
      </div>
    </section>
  );
}
