"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Key,
  FileText,
  Database,
  Globe,
  Bell,
  Trash2,
  Save,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fadeUp, SectionHeader, ToggleRow } from "./shared";

/* ---------- component ---------- */

export function SettingsTab() {
  // Profile form
  const [name, setName] = useState("System Admin");
  const [email, setEmail] = useState("admin@medlink.co.za");
  const [phone, setPhone] = useState("+27 11 000 0000");
  const [province, setProvince] = useState("Gauteng");

  // Toggles
  const [popia, setPopia] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [autoVerify, setAutoVerify] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [signups, setSignups] = useState(true);
  const [auditEmails, setAuditEmails] = useState(true);

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <SectionHeader
          kicker="Platform Settings"
          icon={SettingsIcon}
          title="Configuration"
          subtitle="Manage admin profile, security policies and platform-wide toggles."
        />
      </motion.div>

      {/* Admin profile */}
      <motion.div variants={fadeUp} className="glass-panel p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-medical/10 text-medical">
            <User className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold">Admin Profile</h3>
            <p className="text-[0.7rem] text-muted-foreground">Your platform administrator account details</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Name */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/60 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-medical/30"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/60 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-medical/30"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/60 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-medical/30"
              />
            </div>
          </div>

          {/* Province */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Province</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background/60 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-medical/30"
              >
                {["Gauteng", "KwaZulu-Natal", "Western Cape", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "Northern Cape", "North West"].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Button
          onClick={() => toast.success("Profile saved")}
          className="mt-4 gap-2"
        >
          <Save className="h-4 w-4" /> Save Profile
        </Button>
      </motion.div>

      {/* Security & compliance toggles */}
      <motion.div variants={fadeUp} className="glass-panel p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <Shield className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold">Security & Compliance</h3>
            <p className="text-[0.7rem] text-muted-foreground">POPIA, authentication and access policies</p>
          </div>
        </div>

        <div className="space-y-3">
          <ToggleRow
            icon={FileText}
            title="POPIA Compliance Mode"
            desc="Enforce data encryption, consent tracking and audit logging"
            checked={popia}
            onCheckedChange={setPopia}
            tone="emerald"
          />
          <ToggleRow
            icon={Key}
            title="Two-Factor Authentication"
            desc="Require 2FA for all admin accounts"
            checked={twoFactor}
            onCheckedChange={setTwoFactor}
            tone="medical"
          />
          <ToggleRow
            icon={Shield}
            title="Auto-Verify Doctors"
            desc="Automatically approve doctors with valid HPCSA registration"
            checked={autoVerify}
            onCheckedChange={setAutoVerify}
            tone="amber"
          />
        </div>
      </motion.div>

      {/* Platform toggles */}
      <motion.div variants={fadeUp} className="glass-panel p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Globe className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold">Platform Controls</h3>
            <p className="text-[0.7rem] text-muted-foreground">Registration, maintenance and notifications</p>
          </div>
        </div>

        <div className="space-y-3">
          <ToggleRow
            icon={AlertTriangle}
            title="Maintenance Mode"
            desc="Show maintenance page to all non-admin users"
            checked={maintenance}
            onCheckedChange={setMaintenance}
            tone="amber"
          />
          <ToggleRow
            icon={User}
            title="Open Signups"
            desc="Allow new user registrations"
            checked={signups}
            onCheckedChange={setSignups}
            tone="emerald"
          />
          <ToggleRow
            icon={Bell}
            title="Audit Email Notifications"
            desc="Send daily digest of critical audit events"
            checked={auditEmails}
            onCheckedChange={setAuditEmails}
            tone="medical"
          />
        </div>
      </motion.div>

      {/* Danger zone */}
      <motion.div variants={fadeUp} className="glass-panel border-rose-500/20 p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold text-rose-600 dark:text-rose-400">Danger Zone</h3>
            <p className="text-[0.7rem] text-muted-foreground">Irreversible platform actions</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="destructive"
            onClick={() => toast.info("Database reset — this is a demo")}
            className="gap-2"
          >
            <Database className="h-4 w-4" /> Reset Database
          </Button>
          <Button
            variant="destructive"
            onClick={() => toast.info("Platform deletion — this is a demo")}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" /> Delete Platform
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
