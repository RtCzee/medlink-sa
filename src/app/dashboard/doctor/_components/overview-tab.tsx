'use client'

import React, { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Calendar, ClipboardList, MessageCircle,
  ArrowUpRight, CalendarCheck,
  CheckCircle, Clock, UserCheck, Pill
} from 'lucide-react'
import { ResponsiveContainer, AreaChart as ReArea, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, PieChart, Pie, Cell } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { fadeUp, RISK_STYLE, ChartTooltip, InfoTile } from './shared'
import {
  PATIENTS, TODAY_PRESCRIPTIONS, CLINICAL_NOTES, CONVERSATIONS, VIDEO_CONSULTS, EXTRA_SCHEDULE
} from './mock-data'

interface OverviewTabProps {
  goToTab?: (tab: string) => void
}

export function OverviewTab({ goToTab }: OverviewTabProps) {
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const statCards = useMemo(() => [
    { label: 'Patients Today', value: 14, delta: '+2', icon: Users, color: 'bg-blue-50 text-blue-600', deltaColor: 'text-emerald-600' },
    { label: 'Appointments', value: 8, delta: '1 pending', icon: Calendar, color: 'bg-emerald-50 text-emerald-600', deltaColor: 'text-slate-500' },
    { label: 'Prescriptions', value: 12, delta: '+3', icon: ClipboardList, color: 'bg-purple-50 text-purple-600', deltaColor: 'text-emerald-600' },
    { label: 'Messages', value: 5, delta: '2 urgent', icon: MessageCircle, color: 'bg-amber-50 text-amber-600', deltaColor: 'text-amber-600' }
  ], [])

  const chartData = useMemo(() => [
    { name: 'Mon', patients: 12, consultations: 8 }, { name: 'Tue', patients: 15, consultations: 11 },
    { name: 'Wed', patients: 18, consultations: 14 }, { name: 'Thu', patients: 14, consultations: 10 },
    { name: 'Fri', patients: 20, consultations: 16 }, { name: 'Sat', patients: 10, consultations: 7 },
    { name: 'Sun', patients: 6, consultations: 4 }
  ], [])

  const specialtyData = useMemo(() => [
    { name: 'General', value: 35 }, { name: 'Cardiology', value: 25 },
    { name: 'Pediatrics', value: 20 }, { name: 'Orthopedics', value: 15 },
    { name: 'Other', value: 5 }
  ], [])

  const highRisk = useMemo(() => PATIENTS.filter(p => p.risk === 'high'), [])
  const upcomingAppts = useMemo(() => {
    const now = new Date()
    return EXTRA_SCHEDULE
      .filter(a => new Date(a.date) > now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4)
  }, [])

  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444']

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Good morning, Dr. {user?.name?.split(' ').pop() ?? 'Doctor'}</h2>
          <p className="text-sm text-slate-500 mt-0.5">Here&apos;s your practice overview for today.</p>
        </div>
        <div className="flex gap-2">
          {goToTab && (
            <>
              <Button variant="outline" size="sm" onClick={() => goToTab('schedule')} className="text-slate-600">
                <Calendar className="mr-1.5 h-4 w-4" /> Schedule
              </Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => goToTab('patients')}>
                <Users className="mr-1.5 h-4 w-4" /> Patients
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <motion.div key={card.label} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.07 }}>
            <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{card.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1.5">{mounted ? card.value : '—'}</p>
                    <p className={cn('text-xs mt-1 font-medium', card.deltaColor)}>{card.delta}</p>
                  </div>
                  <div className={cn('rounded-xl p-2.5', card.color)}>
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Weekly Patient Flow</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[220px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <ReArea data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" />
                    <RTooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="patients" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.12} strokeWidth={2} />
                    <Area type="monotone" dataKey="consultations" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.08} strokeWidth={2} />
                  </ReArea>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Patient Distribution</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="h-[220px]">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={specialtyData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {specialtyData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <RTooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {specialtyData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700">High-Risk Patients</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-7" onClick={() => goToTab?.('patients')}>
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {highRisk.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between rounded-xl bg-red-50/60 border border-red-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-700 text-sm font-bold">
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.condition}</p>
                  </div>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', RISK_STYLE[p.risk])}>
                  {p.risk}
                </span>
              </div>
            ))}
            {highRisk.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No high-risk patients</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-slate-700">Today&apos;s Appointments</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-blue-600 h-7" onClick={() => goToTab?.('schedule')}>
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {upcomingAppts.map(a => (
              <div key={a.id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{a.patientName}</p>
                    <p className="text-xs text-slate-500">{a.type} — {a.time}</p>
                  </div>
                </div>
                <span className="text-xs text-slate-500">{a.date}</span>
              </div>
            ))}
            {upcomingAppts.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No upcoming appointments</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Recent Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {CLINICAL_NOTES.slice(0, 3).map(n => (
              <div key={n.id} className="rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition">
                <p className="text-sm font-medium text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.patientName} — {n.date}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Active Consultations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {VIDEO_CONSULTS.filter(v => v.status === 'active').slice(0, 3).map(v => (
              <div key={v.id} className="flex items-center justify-between rounded-lg border border-emerald-100 bg-emerald-50/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{v.patientName}</p>
                  <p className="text-xs text-emerald-600">{v.status}</p>
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            ))}
            {VIDEO_CONSULTS.filter(v => v.status === 'active').length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">No active consultations</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-700">Pending Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {CONVERSATIONS.filter(c => c.unread > 0).slice(0, 3).map(c => (
              <div key={c.id} className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">{c.patientName}</p>
                  <p className="text-xs text-slate-500 truncate max-w-[150px]">{c.lastMessage}</p>
                </div>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white px-1">
                  {c.unread}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
