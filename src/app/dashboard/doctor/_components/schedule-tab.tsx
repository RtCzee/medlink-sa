'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar, Plus, MoreHorizontal, Users
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { fadeUp, STATUS_STYLE, ControlBtn } from './shared'
import { ClinicalNoteComposer } from './clinical-note-composer'
import type { ScheduleItem, ApptStatus } from './types'
import { SCHEDULE } from './mock-data'

export function ScheduleTab() {
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [selectedAppt, setSelectedAppt] = useState<ScheduleItem | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [notes, setNotes] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    return SCHEDULE.filter(a => {
      if (filterType !== 'all' && a.type !== filterType) return false
      if (filterStatus !== 'all' && a.status !== filterStatus) return false
      return true
    }).sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
  }, [filterType, filterStatus])

  const grouped = useMemo(() => {
    const groups: Record<string, ScheduleItem[]> = {}
    filtered.forEach(a => {
      if (!groups[a.date]) groups[a.date] = []
      groups[a.date].push(a)
    })
    return groups
  }, [filtered])

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-900">Schedule</h2>
        <div className="flex gap-2">
          <ControlBtn active={view === 'list'} onClick={() => setView('list')}>
            <Calendar className="h-3.5 w-3.5" /> List
          </ControlBtn>
          <ControlBtn active={view === 'kanban'} onClick={() => setView('kanban')}>
            <Users className="h-3.5 w-3.5" /> Kanban
          </ControlBtn>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setComposerOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Note
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="consultation">Consultation</SelectItem>
            <SelectItem value="follow-up">Follow-up</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
            <SelectItem value="telehealth">Telehealth</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {view === 'list' ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, appts]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-slate-700 mb-2">{date}</h3>
              <div className="space-y-2">
                {appts.map(a => (
                  <Card key={a.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelectedAppt(a); setDrawerOpen(true) }}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[48px]">
                          <p className="text-lg font-bold text-slate-900">{a.time}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{a.patientName}</p>
                          <p className="text-xs text-slate-500">{a.type} — {a.duration} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[a.status])}>
                          {a.status}
                        </span>
                        <MoreHorizontal className="h-4 w-4 text-slate-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <Card><CardContent className="py-12 text-center text-sm text-slate-400">No appointments match filters</CardContent></Card>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          {(['scheduled', 'completed', 'cancelled'] as ApptStatus[]).map(status => (
            <div key={status} className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700 capitalize">{status}</h3>
              {filtered.filter(a => a.status === status).map(a => (
                <Card key={a.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelectedAppt(a); setDrawerOpen(true) }}>
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold text-slate-800">{a.patientName}</p>
                    <p className="text-xs text-slate-500">{a.time} — {a.type}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}

      {composerOpen && (
        <ClinicalNoteComposer
          open={composerOpen}
          onClose={() => setComposerOpen(false)}
          onSave={() => {
            setComposerOpen(false)
          }}
        />
      )}

      {drawerOpen && selectedAppt && (
        <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Appointment — {selectedAppt.patientName}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Date:</span> {selectedAppt.date}</div>
                <div><span className="text-slate-500">Time:</span> {selectedAppt.time}</div>
                <div><span className="text-slate-500">Type:</span> {selectedAppt.type}</div>
                <div><span className="text-slate-500">Duration:</span> {selectedAppt.duration} min</div>
                <div><span className="text-slate-500">Status:</span>
                  <span className={cn('ml-2 rounded-full px-2 py-0.5 text-[11px] font-semibold', STATUS_STYLE[selectedAppt.status])}>
                    {selectedAppt.status}
                  </span>
                </div>
              </div>
              {notes[selectedAppt.id] && (
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Quick Note</p>
                  <p className="text-sm text-slate-700">{notes[selectedAppt.id]}</p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>Close</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
                  setComposerOpen(true)
                  setDrawerOpen(false)
                }}>Open Composer</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  )
}
