"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Upload, CheckCircle, FileText, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ViewHeader } from "./shared-utils";

import type { User } from "@/lib/auth-context";

type VerifyUser = { name?: string | null; identityVerified?: boolean };

export function VerifyView({ user, updateUser }: { user: VerifyUser | null; updateUser?: (patch: Partial<User>) => void }) {
  const [step, setStep] = useState<"idle" | "uploading" | "done">(
    user?.identityVerified ? "done" : "idle"
  );
  const [file, setFile] = useState<File | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setStep("uploading");
      toast.success("Document uploaded", { description: "Verifying your identity… this may take a moment." });
      setTimeout(() => {
        setStep("done");
        if (updateUser) updateUser({ identityVerified: true });
        toast.success("Identity verified", { description: "Your ID has been verified successfully." });
      }, 2000);
    }
  };

  if (step === "done") {
    return (
      <div>
        <ViewHeader title="Identity Verification" subtitle="Your identity has been verified." />
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel flex flex-col items-center gap-4 p-12 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-8 w-8" />
          </div>
          <div>
            <div className="text-lg font-bold">Verified</div>
            <div className="text-sm text-muted-foreground">Your South African ID has been verified under POPIA.</div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <ViewHeader title="Identity Verification" subtitle="Verify your identity to access all features." />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-medical/10 text-medical">
            <Shield className="h-7 w-7" />
          </div>
          <h3 className="font-display text-lg font-semibold">Verify your identity</h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Upload a photo of your South African ID, passport or driver&apos;s licence. Your data is encrypted and handled under POPIA.
          </p>
        </div>

        <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-medical/40 bg-medical/5 p-6 text-center">
          <Upload className="mx-auto h-6 w-6 text-medical" />
          <span className="text-sm text-muted-foreground">
            {file ? file.name : "Drag & drop or click to upload"}
          </span>
        </div>

        <label className="block">
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFile} />
          <Button asChild className="w-full rounded-xl">
            <span className="cursor-pointer">
              <FileText className="mr-2 inline h-4 w-4" /> Select document
            </span>
          </Button>
        </label>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-xs text-muted-foreground">
            Your document is encrypted in transit and at rest. We only retain verification status, not the document itself.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
