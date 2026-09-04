"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, Plus, Video } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { FACILITIES, PATIENT_APPOINTMENTS } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatCard, StatusPill, ViewHeader } from "./shared-utils";

const SPECIALTIES = ["General Practitioner", "Cardiology", "Dermatology", "Pediatrics", "Orthopedics"];
const TIME_SLOTS = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "13:00", "13:30", "14:00", "14:30", "15:00"];

export function AppointmentsView({ onJoinVideo }: { onJoinVideo: (a: (typeof PATIENT_APPOINTMENTS)[number]) => void }) {
  const [bookOpen, setBookOpen] = useState(false);
  const [form, setForm] = useState({ specialty: "", facility: "", date: "", slot: "", reason: "", type: "in-person" });

  const book = () => {
    if (!form.specialty || !form.facility || !form.date || !form.slot) {
      toast.error("Missing fields", { description: "Please select specialty, facility, date and time slot." });
      return;
    }
    toast.success("Appointment booked", { description: `${form.specialty} at ${FACILITIES.find((f) => f.id === form.facility)?.name} on ${form.date}.` });
    setBookOpen(false);
    setForm({ specialty: "", facility: "", date: "", slot: "", reason: "", type: "in-person" });
  };

  const upcoming = PATIENT_APPOINTMENTS.filter((a) => a.status === "confirmed" || a.status === "pending");
  const past = PATIENT_APPOINTMENTS.filter((a) => a.status === "completed" || a.status === "cancelled");

  return (
    <div>
      <ViewHeader title="Appointments" subtitle="Book, manage and join your healthcare visits."
        action={<Button onClick={() => setBookOpen(!bookOpen)} className="gap-2 rounded-xl"><Plus className="h-4 w-4" /> {bookOpen ? "Cancel" : "Book appointment"}</Button>}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={Calendar} label="Upcoming" value={String(upcoming.length)} sub="Appointments" accent="medical" index={0} />
        <StatCard icon={Clock} label="Total" value={String(PATIENT_APPOINTMENTS.length)} sub="All time" accent="cyan" index={1} />
        <StatCard icon={Video} label="Video visits" value={String(PATIENT_APPOINTMENTS.filter((a) => a.type === "video").length)} sub="Telehealth" accent="emerald" index={2} />
      </div>

      {bookOpen && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel mb-6 p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Book new appointment</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Specialty</Label>
              <Select value={form.specialty} onValueChange={(v) => setForm({ ...form, specialty: v })}>
                <SelectTrigger className="input-premium h-10"><SelectValue placeholder="Select specialty" /></SelectTrigger>
                <SelectContent>{SPECIALTIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Facility</Label>
              <Select value={form.facility} onValueChange={(v) => setForm({ ...form, facility: v })}>
                <SelectTrigger className="input-premium h-10"><SelectValue placeholder="Select facility" /></SelectTrigger>
                <SelectContent>{FACILITIES.filter((f) => f.category !== "pharmacy").map((f) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Date</Label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-premium flex h-10 w-full rounded-xl border border-border bg-card/60 px-3 text-sm" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Time slot</Label>
              <Select value={form.slot} onValueChange={(v) => setForm({ ...form, slot: v })}>
                <SelectTrigger className="input-premium h-10"><SelectValue placeholder="Select time" /></SelectTrigger>
                <SelectContent>{TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Visit type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger className="input-premium h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-person</SelectItem>
                  <SelectItem value="video">Video consultation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label className="mb-1.5 block text-xs font-medium">Reason for visit</Label>
              <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="Briefly describe your symptoms or reason…" className="input-premium min-h-[80px]" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={book} className="rounded-xl">Confirm booking</Button>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold text-muted-foreground">Upcoming</h3>
        {upcoming.map((a, i) => (
          <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="glass-panel flex items-center gap-4 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-medical/10 text-medical">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{a.doctor}</div>
              <div className="text-xs text-muted-foreground">{a.specialty} · {a.facility}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" /> {a.date} at {a.time}
              </div>
            </div>
            <StatusPill status={a.status} />
            {a.type === "video" && (
              <Button size="sm" variant="outline" className="gap-1 rounded-lg" onClick={() => onJoinVideo(a)}>
                <Video className="h-3.5 w-3.5" /> Join
              </Button>
            )}
            <Link href={`/dashboard/patient?tab=queue`} className="hidden h-9 items-center gap-1 rounded-lg px-3 text-xs font-semibold sm:flex">
              View queue
            </Link>
          </motion.div>
        ))}
        {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No upcoming appointments.</p>}
      </div>

      {past.length > 0 && (
        <div className="mt-8 space-y-3">
          <h3 className="font-display text-sm font-semibold text-muted-foreground">Past</h3>
          {past.map((a) => (
            <div key={a.id} className="glass-panel flex items-center gap-4 p-4 opacity-70">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Calendar className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{a.doctor}</div>
                <div className="text-xs text-muted-foreground">{a.specialty} · {a.facility}</div>
                <div className="mt-1 text-xs text-muted-foreground">{a.date} at {a.time}</div>
              </div>
              <StatusPill status={a.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
