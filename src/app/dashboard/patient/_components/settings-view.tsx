"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Bell, Shield, Globe, Moon, Sun, Save, LogOut, Trash2, Phone, Heart } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ViewHeader } from "./shared-utils";
import type { User as AuthUser } from "@/lib/auth-context";

type SettingsUser = {
  name?: string | null;
  email?: string | null;
};

type SettingsProps = {
  user: SettingsUser | null;
  updateUser: (patch: Partial<AuthUser>) => void;
  signOut: () => void;
};

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zu", label: "isiZulu" },
  { value: "af", label: "Afrikaans" },
  { value: "st", label: "Sesotho" },
];

export function SettingsView({ user, updateUser, signOut }: SettingsProps) {
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [language, setLanguage] = useState("en");
  const [dark, setDark] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  const save = () => {
    if (name !== user?.name) updateUser({ name });
    toast.success("Settings saved");
  };

  return (
    <div>
      <ViewHeader title="Settings" subtitle="Manage your profile, notifications and preferences." />

      <div className="space-y-6">
        {/* Profile */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-medical" />
            <h3 className="font-display text-base font-semibold">Profile</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="input-premium h-10 rounded-xl" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Email</Label>
              <div className="input-premium flex h-10 items-center rounded-xl px-3 text-sm text-muted-foreground">{user?.email ?? "—"}</div>
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add phone number" className="input-premium h-10 rounded-xl" />
            </div>
          </div>
        </motion.div>

        {/* Emergency Contact */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-3">
            <Heart className="h-5 w-5 text-medical" />
            <h3 className="font-display text-base font-semibold">Emergency Contact</h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Contact name</Label>
              <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} placeholder="Full name" className="input-premium h-10 rounded-xl" />
            </div>
            <div>
              <Label className="mb-1.5 block text-xs font-medium">Contact phone</Label>
              <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="Phone number" className="input-premium h-10 rounded-xl" />
            </div>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-medical" />
            <h3 className="font-display text-base font-semibold">Notifications</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: "Email notifications", desc: "Appointment reminders and updates", checked: emailNotif, onChange: setEmailNotif },
              { label: "SMS notifications", desc: "Critical alerts via SMS", checked: smsNotif, onChange: setSmsNotif },
              { label: "Push notifications", desc: "Real-time browser notifications", checked: pushNotif, onChange: setPushNotif },
            ].map((n) => (
              <div key={n.label} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{n.label}</div>
                  <div className="text-xs text-muted-foreground">{n.desc}</div>
                </div>
                <Switch checked={n.checked} onCheckedChange={n.onChange} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Appearance */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-3">
            {dark ? <Moon className="h-5 w-5 text-medical" /> : <Sun className="h-5 w-5 text-medical" />}
            <h3 className="font-display text-base font-semibold">Appearance</h3>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Dark mode</div>
              <div className="text-xs text-muted-foreground">Switch between light and dark theme</div>
            </div>
            <Switch checked={dark} onCheckedChange={setDark} />
          </div>
        </motion.div>

        {/* Language */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-medical" />
            <h3 className="font-display text-base font-semibold">Language</h3>
          </div>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="input-premium h-10 max-w-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Privacy */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-panel p-6">
          <div className="mb-4 flex items-center gap-3">
            <Shield className="h-5 w-5 text-medical" />
            <h3 className="font-display text-base font-semibold">Privacy &amp; Security</h3>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Your data is encrypted and handled in compliance with POPIA. You can request full data export or deletion.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl text-xs" onClick={() => toast.info("Export request submitted")}>
              Export my data
            </Button>
            <Button variant="destructive" className="rounded-xl text-xs" onClick={() => setShowDelete(true)}>
              Delete my account
            </Button>
          </div>
        </motion.div>

        <div className="flex items-center gap-3">
          <Button onClick={save} className="gap-2 rounded-xl">
            <Save className="h-4 w-4" /> Save settings
          </Button>
          <Button onClick={signOut} variant="outline" className="gap-2 rounded-xl">
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </div>

      {/* Delete account confirmation */}
      {showDelete && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
          <div className="glass-panel mx-4 max-w-sm p-6">
            <div className="mb-2 flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              <h3 className="font-display text-base font-semibold">Delete Account</h3>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              This action is irreversible. All your medical records and data will be permanently deleted.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" className="rounded-xl text-xs" onClick={() => setShowDelete(false)}>Cancel</Button>
              <Button variant="destructive" className="rounded-xl text-xs" onClick={() => { setShowDelete(false); toast.info("Deletion request submitted"); }}>Delete</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
