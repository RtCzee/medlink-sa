"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Eye,
  UserCheck,
  UserX,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  MapPin,
  Clock,
  Mail,
  Phone,
  ShieldAlert,
  Ban,
  RotateCcw,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn, getInitials } from "@/lib/utils";
import { fadeUp, VERIFIED_STYLE, ROLE_STYLE, SectionHeader, DetailCell } from "./shared";
import type { AdminUser, VerifiedStatus } from "./types";

/* ---------- helpers ---------- */

const STATUS_OPTIONS: { value: VerifiedStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "approved", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_OPTIONS = ["All", "Patient", "Doctor", "Hospital", "Pharmacy"] as const;

/* ---------- component ---------- */

interface UsersTabProps {
  users: AdminUser[];
  mutateUser: (id: string, patch: Partial<AdminUser>) => void;
}

export function UsersTab({ users, mutateUser }: UsersTabProps) {
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<VerifiedStatus | "all">("all");
  const [expandId, setExpandId] = useState<string | null>(null);
  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchQ =
        !query ||
        u.name.toLowerCase().includes(query.toLowerCase()) ||
        u.email.toLowerCase().includes(query.toLowerCase());
      const matchR = roleFilter === "All" || u.role === roleFilter;
      const matchS = statusFilter === "all" || u.verified === statusFilter;
      return matchQ && matchR && matchS;
    });
  }, [users, query, roleFilter, statusFilter]);

  return (
    <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.06 } } }} className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <SectionHeader
          kicker="User Management"
          icon={UserCheck}
          title="All Accounts"
          subtitle="Search, filter and manage registered users across all provinces."
        />
      </motion.div>

      {/* Toolbar */}
      <motion.div variants={fadeUp} className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email…"
            className="w-full rounded-lg border border-border/60 bg-background/60 py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-medical/30"
          />
        </div>

        {/* Role filter pills */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {ROLE_OPTIONS.map((r) => (
            <Button
              key={r}
              variant="ghost"
              size="sm"
              onClick={() => setRoleFilter(r)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                roleFilter === r ? "bg-medical text-white hover:bg-medical/90" : "bg-foreground/5 text-muted-foreground hover:bg-foreground/10"
              )}
            >
              {r}
            </Button>
          ))}
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VerifiedStatus | "all")}
          className="rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-medical/30"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </motion.div>

      {/* Results count */}
      <motion.div variants={fadeUp} className="text-xs text-muted-foreground">
        {filtered.length} user{filtered.length !== 1 && "s"} found
      </motion.div>

      {/* User table */}
      <motion.div variants={fadeUp} className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map((u) => {
                  const vs = VERIFIED_STYLE[u.verified];
                  const rs = ROLE_STYLE[u.role];
                  const RoleIcon = rs.icon;
                  const expanded = expandId === u.id;
                  return (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group border-b border-border/30 hover:bg-foreground/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandId(expanded ? null : u.id)}
                          className="h-auto justify-start p-0"
                        >
                          <span className={cn("grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white", rs.tint)}>
                            {getInitials(u.name)}
                          </span>
                          <div className="text-left">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-xs text-muted-foreground">{u.email}</div>
                          </div>
                          {expanded ? (
                            <ChevronDown className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-xs">
                          <RoleIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium", vs.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", vs.dot)} />
                          {vs.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.joined}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDetailUser(u)}
                            className="h-8 w-8 text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                            title="View details"
                            aria-label="View user details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {u.verified !== "approved" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10" title="Verify" aria-label="Verify user">
                                  <Check className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Approve {u.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will mark the account as verified and grant full access.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      mutateUser(u.id, { verified: "approved" });
                                      toast.success(`${u.name} verified`);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-700"
                                  >
                                    Approve
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {u.verified !== "suspended" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600 hover:bg-amber-500/10" title="Suspend" aria-label="Suspend user">
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Suspend {u.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    The account will be locked until an admin reinstates it.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      mutateUser(u.id, { verified: "suspended" });
                                      toast.success(`${u.name} suspended`);
                                    }}
                                    className="bg-amber-600 hover:bg-amber-700"
                                  >
                                    Suspend
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {u.verified === "suspended" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                mutateUser(u.id, { verified: "approved" });
                                toast.success(`${u.name} reinstated`);
                              }}
                              className="h-8 w-8 text-medical hover:bg-medical/10"
                              title="Reinstate"
                              aria-label="Reinstate user"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Detail sheet */}
      <Sheet open={!!detailUser} onOpenChange={() => setDetailUser(null)}>
        <SheetContent className="w-full max-w-md sm:max-w-lg">
          {detailUser && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className={cn("grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br text-xs font-bold text-white", ROLE_STYLE[detailUser.role].tint)}>
                    {getInitials(detailUser.name)}
                  </span>
                  {detailUser.name}
                </SheetTitle>
                <SheetDescription>{detailUser.email}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <DetailCell icon={RoleIcon(detailUser.role)} label="Role" value={detailUser.role} />
                  <DetailCell icon={ShieldAlert} label="Status" value={VERIFIED_STYLE[detailUser.verified].label} />
                  <DetailCell icon={Clock} label="Joined" value={detailUser.joined} />
                  {detailUser.province && <DetailCell icon={MapPin} label="Province" value={detailUser.province} />}
                  {detailUser.phone && <DetailCell icon={Phone} label="Phone" value={detailUser.phone} />}
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 pt-2">
                  {detailUser.verified !== "approved" && (
                    <Button
                      size="sm"
                      onClick={() => {
                        mutateUser(detailUser.id, { verified: "approved" });
                        setDetailUser({ ...detailUser, verified: "approved" });
                        toast.success(`${detailUser.name} verified`);
                      }}
                      className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                  )}
                  {detailUser.verified !== "suspended" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        mutateUser(detailUser.id, { verified: "suspended" });
                        setDetailUser({ ...detailUser, verified: "suspended" });
                        toast.success(`${detailUser.name} suspended`);
                      }}
                      className="gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
                    >
                      <Ban className="h-3.5 w-3.5" /> Suspend
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}

function RoleIcon(role: AdminUser["role"]) {
  const { icon: Icon } = ROLE_STYLE[role];
  return Icon;
}
