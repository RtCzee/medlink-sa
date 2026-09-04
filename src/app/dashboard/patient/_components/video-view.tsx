"use client";

import { Video, Phone, Calendar, Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ViewHeader } from "./shared-utils";

const UPCOMING = [
  { id: "1", doctor: "Dr. Sipho Dlamini", specialty: "Cardiology", date: "2024-12-20", time: "10:00", status: "Confirmed" },
  { id: "2", doctor: "Dr. Thandi Nkosi", specialty: "General Practitioner", date: "2024-12-28", time: "14:30", status: "Confirmed" },
];

export function VideoView({ onStart }: { onStart: () => void }) {
  return (
    <div>
      <ViewHeader title="Video Consultations" subtitle="Connect with your doctors via secure video calls."
        action={<Button onClick={onStart} className="gap-2 rounded-xl"><Video className="h-4 w-4" /> Start video call</Button>}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="glass-panel flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-medical/10 text-medical">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Active call</div>
            <div className="text-xs text-muted-foreground">No active sessions</div>
          </div>
        </div>
        <div className="glass-panel flex items-center gap-3 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold">Past calls</div>
            <div className="text-xs text-muted-foreground">3 completed this month</div>
          </div>
        </div>
      </div>

      <h3 className="mb-3 font-display text-sm font-semibold text-muted-foreground">Upcoming video visits</h3>
      <div className="space-y-3">
        {UPCOMING.map((a) => (
          <div key={a.id} className="glass-panel flex items-center gap-4 p-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-medical/10 text-medical">
              <Video className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">{a.doctor}</div>
              <div className="text-xs text-muted-foreground">{a.specialty}</div>
              <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" /> {a.date}
                <Clock className="h-3 w-3 ml-2" /> {a.time}
              </div>
            </div>
            <Button onClick={onStart} size="sm" className="gap-1 rounded-lg">
              <Video className="h-3.5 w-3.5" /> Join
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
