"use client";

import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export function VideoCallModal({
  appt,
  onClose,
}: {
  appt: { doctor: string; specialty: string; date: string; time: string } | null;
  onClose: () => void;
}) {
  const [muted, setMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);

  if (!appt) return null;

  return (
    <Dialog open={!!appt} onOpenChange={onClose}>
      <DialogContent className="glass-strong max-w-lg p-0">
        <div className="relative flex h-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-medical/20 to-cyan-400/10">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-32 rounded-full bg-medical/20 animate-pulse" />
          </div>
          <div className="relative z-10 text-center">
            <div className="mb-2 text-sm font-semibold text-muted-foreground">Connecting to</div>
            <div className="text-xl font-bold">{appt.doctor}</div>
            <div className="text-sm text-muted-foreground">{appt.specialty}</div>
            <div className="mt-1 text-xs text-muted-foreground">{appt.date} · {appt.time}</div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 p-4">
          <Button
            variant={muted ? "default" : "outline"}
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setMuted(!muted)}
          >
            {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Button
            variant={videoOff ? "default" : "outline"}
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => setVideoOff(!videoOff)}
          >
            {videoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={onClose}
          >
            <PhoneOff className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
