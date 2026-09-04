"use client";

import {
  ShoppingCart,
  Package,
  Truck,
  Users,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { StatCard } from "./shared";
import {
  ORDERS_INITIAL,
  ORDERS_BY_STATUS_DATA,
  WEEKLY_REVENUE,
  STATUS_META,
} from "./mock-data";
import type { Order } from "./types";

export default function OverviewTab() {
  const orders = ORDERS_INITIAL;
  const activeOrders = orders.filter((o) => o.status !== "completed");
  const deliveryOrders = orders.filter((o) => o.delivery);
  const totalRevenue = orders.reduce((s, o) => s + o.price, 0);
  const completedOrders = orders.filter((o) => o.status === "completed");

  const lowStockCount = 3;

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Orders"
          value={activeOrders.length}
          icon={ShoppingCart}
          trend="+12% vs last week"
          trendUp
          color="from-medical to-cyan-500"
        />
        <StatCard
          label="Deliveries Today"
          value={deliveryOrders.length}
          icon={Truck}
          trend="On-time: 94%"
          trendUp
          color="from-violet-500 to-purple-600"
        />
        <StatCard
          label="Revenue Today"
          value={`R ${totalRevenue.toFixed(0)}`}
          icon={DollarSign}
          trend="+8% vs yesterday"
          trendUp
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          label="Low-Stock Items"
          value={lowStockCount}
          icon={AlertTriangle}
          trend="3 items need reorder"
          trendUp={false}
          color="from-amber-500 to-orange-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Revenue bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel rounded-2xl p-5 lg:col-span-2"
        >
          <h3 className="mb-4 text-sm font-semibold">Weekly revenue</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WEEKLY_REVENUE} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                <XAxis dataKey="d" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `R${v / 1000}k`} />
                <RechartsTooltip
                  formatter={(v: number) => [`R ${v.toFixed(2)}`, "Revenue"]}
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="r" radius={[6, 6, 0, 0]}>
                  {WEEKLY_REVENUE.map((_, i) => (
                    <Cell key={i} fill={cn(i === 4 ? "hsl(var(--chart-1))" : "hsl(var(--chart-1) / 0.35)")} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Orders by status pie */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="glass-panel rounded-2xl p-5"
        >
          <h3 className="mb-4 text-sm font-semibold">Orders by status</h3>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ORDERS_BY_STATUS_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {ORDERS_BY_STATUS_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    background: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {ORDERS_BY_STATUS_DATA.map((s) => (
              <div key={s.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
                  {s.status}
                </div>
                <span className="font-semibold">{s.count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent orders quick list */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="glass-panel rounded-2xl p-5"
      >
        <h3 className="mb-4 text-sm font-semibold">Recent orders</h3>
        <div className="space-y-2">
          {orders.slice(0, 5).map((order) => {
            const meta = STATUS_META[order.status];
            return (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="flex items-center gap-3">
                  <span className={cn("h-2 w-2 rounded-full", meta.dot)} />
                  <div>
                    <p className="text-sm font-medium">{order.patient}</p>
                    <p className="text-xs text-muted-foreground">{order.medicine}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>R {order.price.toFixed(2)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {order.createdAt}
                  </span>
                  <Badge variant="outline" className={cn("text-[10px]", meta.badge)}>
                    {meta.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
