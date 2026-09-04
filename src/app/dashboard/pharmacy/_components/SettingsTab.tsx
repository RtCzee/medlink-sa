"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Globe,
  UserCheck,
  Save,
  Eye,
  EyeOff,
  X,
  Bell,
  Lock,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { SectionHeader, ToggleRow } from "./shared";
import { PHARMACY_PROFILE } from "./mock-data";
import { useAuth } from "@/lib/auth-context";

export default function SettingsTab() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(PHARMACY_PROFILE.name);
  const [branch, setBranch] = useState(PHARMACY_PROFILE.branch);
  const [address, setAddress] = useState(PHARMACY_PROFILE.address);
  const [phone, setPhone] = useState(PHARMACY_PROFILE.phone);
  const [hours, setHours] = useState(PHARMACY_PROFILE.hours);
  const [radius, setRadius] = useState(String(PHARMACY_PROFILE.deliveryRadiusKm));
  const [fee, setFee] = useState(String(PHARMACY_PROFILE.deliveryFee));
  const [visible, setVisible] = useState(PHARMACY_PROFILE.publicVisible);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [autoVerify, setAutoVerify] = useState(false);

  const save = () => {
    if (user) updateUser({ name });
    toast.success("Pharmacy profile saved", {
      description: visible
        ? "Your pharmacy is visible to patients searching the directory."
        : "Your pharmacy is hidden from public search.",
    });
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Settings"
        subtitle="Pharmacy profile, operating hours, delivery configuration and public visibility."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Profile card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-5 lg:col-span-2"
        >
          <h3 className="mb-4 text-sm font-semibold">Pharmacy profile</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ph-name">Pharmacy name</Label>
              <Input id="ph-name" className="input-premium" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-branch">Branch</Label>
              <Input id="ph-branch" className="input-premium" value={branch} onChange={(e) => setBranch(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-phone">Phone</Label>
              <Input id="ph-phone" className="input-premium" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ph-address">Address</Label>
              <Textarea id="ph-address" className="input-premium min-h-[68px] resize-none" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="ph-hours">Operating hours</Label>
              <Input id="ph-hours" className="input-premium" value={hours} onChange={(e) => setHours(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-radius">Delivery radius (km)</Label>
              <Input id="ph-radius" className="input-premium" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ph-fee">Delivery fee (R)</Label>
              <Input id="ph-fee" className="input-premium" type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} />
            </div>
          </div>

          <div className="mt-5">
            <ToggleRow
              icon={visible ? Eye : EyeOff}
              label="Public visibility"
              description={visible ? "Patients can find you in the explore directory." : "Hidden from public search."}
              checked={visible}
              onCheckedChange={setVisible}
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button variant="ghost" aria-label="Discard changes">Discard</Button>
            <Button className="gap-2" onClick={save} aria-label="Save pharmacy profile">
              <Save className="h-4 w-4" /> Save changes
            </Button>
          </div>
        </motion.div>

        {/* Side cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-4"
        >
          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">SAPC verified</div>
                <div className="text-xs text-muted-foreground">Pharm licence #40082179</div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Your pharmacy is verified by the South African Pharmacy Council. Verification status is shown
              to patients as a trust signal.
            </p>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-medical/10 text-medical">
                <Globe className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">Public profile</div>
                <div className="text-xs text-muted-foreground">medlink.sa/clicks-rosebank</div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2 text-xs"
              onClick={() => toast.info("Opening public profile preview…")}
              aria-label="Preview public profile"
            >
              <Eye className="h-3 w-3" /> Preview public profile
            </Button>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <UserCheck className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold">Responsible pharmacist</div>
                <div className="text-xs text-muted-foreground">On duty: M. Khumalo</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="text-sm font-semibold">Notifications</div>
            <div className="mt-3 space-y-2">
              <ToggleRow icon={Bell} label="Email notifications" description="Order alerts and stock updates" checked={emailNotifs} onCheckedChange={setEmailNotifs} />
              <ToggleRow icon={MessageSquare} label="SMS notifications" description="Critical alerts via SMS" checked={smsNotifs} onCheckedChange={setSmsNotifs} />
            </div>
          </div>

          <div className="glass-card rounded-xl p-5">
            <div className="text-sm font-semibold">Danger zone</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Closing the pharmacy temporarily hides you from search and pauses new orders.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-2 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 text-xs"
              onClick={() =>
                toast.error("Confirm temporary closure", {
                  description: "This will pause new orders immediately.",
                })
              }
              aria-label="Close pharmacy temporarily"
            >
              <X className="h-3 w-3" /> Close pharmacy temporarily
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
