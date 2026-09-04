"use client";

import { useState } from "react";
import {
  Settings,
  Save,
  ShieldCheck,
  Globe,
  MapPin,
  Phone,
  BedDouble,
  Bell,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { ViewHeader, StatusPill } from "./shared";

export default function SettingsTab() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.facility || "Chris Hani Baragwanath Hospital");
  const [province, setProvince] = useState("Gauteng");
  const [address, setAddress] = useState(
    "26 Chris Hani Rd, Diepkloof, Soweto, 1864"
  );
  const [phone, setPhone] = useState("+27 11 933 8000");
  const [totalBeds, setTotalBeds] = useState("2888");
  const [hours, setHours] = useState("24/7 emergency · elective services 07:00–18:00");
  const [publicContact, setPublicContact] = useState(true);
  const [saving, setSaving] = useState(false);

  function save() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      if (user && name !== user.facility) {
        updateUser({ name, facility: name });
      }
      toast.success("Hospital profile saved", {
        description: "Changes are live on your MedLink SA directory listing.",
      });
    }, 700);
  }

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Hospital settings"
        subtitle="Profile, contact & operating hours"
        icon={Settings}
        action={
          <Button
            onClick={save}
            disabled={saving}
            variant="default"
            className="gap-2 rounded-lg px-4 py-2"
            aria-label="Save settings"
          >
            {saving ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save changes
              </>
            )}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile form */}
        <div className="glass-panel p-5 lg:col-span-2">
          <h3 className="font-display text-base font-semibold">
            Hospital profile
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Public-facing details shown on the MedLink SA directory.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="h-name">Hospital name</Label>
              <Input
                id="h-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-province">Province</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger id="h-province" className="input-premium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Eastern Cape",
                    "Free State",
                    "Gauteng",
                    "KwaZulu-Natal",
                    "Limpopo",
                    "Mpumalanga",
                    "Northern Cape",
                    "North West",
                    "Western Cape",
                  ].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-beds">Licensed beds</Label>
              <Input
                id="h-beds"
                type="number"
                value={totalBeds}
                onChange={(e) => setTotalBeds(e.target.value)}
                className="input-premium"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="h-address">Street address</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="h-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-premium pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-phone">Switchboard</Label>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="h-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-premium pl-9"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-hours">Operating hours</Label>
              <Input
                id="h-hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="input-premium"
              />
            </div>
          </div>
        </div>

        {/* Right column: visibility + verification */}
        <div className="space-y-4">
          <div className="glass-panel p-5">
            <h3 className="font-display text-base font-semibold">
              Visibility
            </h3>
            <div className="mt-4 flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-medium">Public contact</div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Show phone & address on the public directory so patients can
                  reach you directly.
                </p>
              </div>
              <Switch
                checked={publicContact}
                onCheckedChange={setPublicContact}
                aria-label="Toggle public contact"
              />
            </div>
            <div className="mt-4 flex items-start justify-between gap-3 border-t border-border/60 pt-4">
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <Globe className="h-3.5 w-3.5 text-medical" />
                  Listed on directory
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Your facility appears in MedLink SA search results.
                </p>
              </div>
              <StatusPill tone="emerald">Live</StatusPill>
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="font-display text-base font-semibold">
              Verification
            </h3>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <div>
                <div className="text-sm font-semibold text-emerald-500">
                  DOH-verified
                </div>
                <div className="text-xs text-muted-foreground">
                  National Department of Health · since 03 Jan 2025
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Verification is renewed annually. You'll receive a reminder 30 days
              before expiry.
            </p>
          </div>

          <div className="glass-panel p-5">
            <h3 className="font-display text-base font-semibold">
              Notifications
            </h3>
            <div className="mt-3 space-y-3">
              {[
                {
                  label: "New approval requests",
                  on: true,
                  icon: UserCheck,
                },
                {
                  label: "Bed capacity alerts (<10%)",
                  on: true,
                  icon: BedDouble,
                },
                {
                  label: "Critical patient admissions",
                  on: true,
                  icon: AlertTriangle,
                },
                {
                  label: "Daily census summary (08:00)",
                  on: false,
                  icon: Bell,
                },
              ].map((n) => (
                <div
                  key={n.label}
                  className="flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <n.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {n.label}
                  </div>
                  <Switch
                    defaultChecked={n.on}
                    aria-label={n.label}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
