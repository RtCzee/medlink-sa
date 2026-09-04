'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, User, Calendar, Pill, Activity,
  Heart
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { fadeUp, RISK_STYLE, InfoTile } from './shared'
import type { Patient, Risk } from './types'
import { PATIENTS } from './mock-data'

interface PatientsTabProps {
  goToTab?: (tab: string) => void
}

export function PatientsTab({ goToTab }: PatientsTabProps) {
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<string>('all')
  const [drawerPatient, setDrawerPatient] = useState<Patient | null>(null)

  const filtered = useMemo(() => {
    return PATIENTS.filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.condition.toLowerCase().includes(search.toLowerCase())) return false
      if (riskFilter !== 'all' && p.risk !== riskFilter) return false
      return true
    })
  }, [search, riskFilter])

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-900">Patients</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search patients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm w-[200px]"
            />
          </div>
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Risk" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="mild">Mild</SelectItem>
              <SelectItem value="stable">Stable</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(p => (
          <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDrawerPatient(p)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {p.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.age}y {p.gender}</p>
                  </div>
                </div>
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', RISK_STYLE[p.risk])}>
                  {p.risk}
                </span>
              </div>
              <div className="space-y-1.5 text-xs text-slate-600">
                <p><span className="font-medium text-slate-500">Condition:</span> {p.condition}</p>
                <p><span className="font-medium text-slate-500">Last visit:</span> {p.lastVisit}</p>
                <p><span className="font-medium text-slate-500">Next appt:</span> {p.nextAppt}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-slate-400">No patients match search</CardContent></Card>
      )}

      <Dialog open={!!drawerPatient} onOpenChange={() => setDrawerPatient(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {drawerPatient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {drawerPatient.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  {drawerPatient.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <InfoTile icon={<User className="h-4 w-4" />} label="Age" value={`${drawerPatient.age}y`} />
                  <InfoTile icon={<Activity className="h-4 w-4" />} label="Risk" value={drawerPatient.risk} />
                  <InfoTile icon={<Calendar className="h-4 w-4" />} label="Last Visit" value={drawerPatient.lastVisit} />
                  <InfoTile icon={<Heart className="h-4 w-4" />} label="Condition" value={drawerPatient.condition} />
                </div>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Vitals</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-slate-500">BP:</span> {drawerPatient.vitals.bp}</div>
                    <div><span className="text-slate-500">HR:</span> {drawerPatient.vitals.hr}</div>
                    <div><span className="text-slate-500">Temp:</span> {drawerPatient.vitals.temp}</div>
                    <div><span className="text-slate-500">SpO2:</span> {drawerPatient.vitals.spo2}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Allergies</CardTitle></CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {drawerPatient.allergies.map(a => (
                      <Badge key={a} variant="outline" className="text-xs">{a}</Badge>
                    ))}
                    {drawerPatient.allergies.length === 0 && <p className="text-xs text-slate-400">No known allergies</p>}
                  </CardContent>
                </Card>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDrawerPatient(null)}>Close</Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => goToTab?.('prescriptions')}>
                    <Pill className="mr-1.5 h-4 w-4" /> Prescribe
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
