"use client";

/* =========================================================================
   MedLink SA — Pharmacy Dashboard (thin shell)
   Task ID: 9-PHARMACY
   =========================================================================
   This file is the entry point for the pharmacy dashboard. It holds only
   shared mutable state and tab-switching logic. All UI lives under
   _components/.
   ========================================================================= */

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster as SonnerToaster } from "sonner";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Truck,
  Settings,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/layout/dashboard-layout";

type TabId = "overview" | "orders" | "inventory" | "pricing" | "ptv" | "delivery" | "settings";

/* -------------------------------------------------------------------------
   Lazy-loaded tab components
   ------------------------------------------------------------------------- */

const OverviewTab = dynamic(() => import("./_components/OverviewTab"), { ssr: false });
const OrdersTab = dynamic(() => import("./_components/OrdersTab"), { ssr: false });
const InventoryTab = dynamic(() => import("./_components/InventoryTab"), { ssr: false });
const PricingTab = dynamic(() => import("./_components/PricingTab"), { ssr: false });
const PTVTab = dynamic(() => import("./_components/PTVTab"), { ssr: false });
const DeliveryTab = dynamic(() => import("./_components/DeliveryTab"), { ssr: false });
const SettingsTab = dynamic(() => import("./_components/SettingsTab"), { ssr: false });

/* -------------------------------------------------------------------------
   Tab definitions
   ------------------------------------------------------------------------- */

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ShoppingCart },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "pricing", label: "Medicine & pricing", icon: Tag },
  { id: "ptv", label: "PTV Review", icon: ShieldCheck },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "settings", label: "Settings", icon: Settings },
];

/* -------------------------------------------------------------------------
   TabBar
   ------------------------------------------------------------------------- */

function TabBar({ tab, setTab }: { tab: TabId; setTab: (t: TabId) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-2xl border border-border/50 bg-muted/30 p-1.5 backdrop-blur-sm">
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <Button
            key={t.id}
            variant="ghost"
            size="sm"
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            )}
          >
            <Icon className="h-4 w-4" />
            {t.label}
          </Button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------
   Page
   ------------------------------------------------------------------------- */

export default function PharmacyDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[60vh] place-items-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-medical border-t-transparent" />
        </div>
      }
    >
      <PharmacyDashboardInner />
      <SonnerToaster position="top-right" richColors closeButton />
    </Suspense>
  );
}

function PharmacyDashboardInner() {
  const params = useSearchParams();
  const tabParam = (params.get("tab") as TabId) || "overview";
  const [tab, setTab] = useState<TabId>(tabParam);

  useEffect(() => {
    setTab(tabParam);
  }, [tabParam]);

  return (
    <DashboardLayout role="pharmacy">
      <div className="space-y-6">
        <TabBar tab={tab} setTab={setTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {tab === "overview" && <OverviewTab />}
            {tab === "orders" && <OrdersTab />}
            {tab === "inventory" && <InventoryTab />}
            {tab === "pricing" && <PricingTab />}
            {tab === "ptv" && <PTVTab />}
            {tab === "delivery" && <DeliveryTab />}
            {tab === "settings" && <SettingsTab />}
          </motion.div>
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
