'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, FileText, ChevronDown, ChevronRight,
  Plus, Download, Stethoscope
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { fadeUp, SoapBlock } from './shared'
import { ClinicalNoteComposer } from './clinical-note-composer'
import type { ClinicalNote } from './types'
import { CLINICAL_NOTES } from './mock-data'

export function NotesTab() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const [notes, setNotes] = useState<ClinicalNote[]>(CLINICAL_NOTES)

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (search && !n.patientName.toLowerCase().includes(search.toLowerCase()) && !n.title.toLowerCase().includes(search.toLowerCase())) return false
      if (typeFilter !== 'all' && n.type !== typeFilter) return false
      return true
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [notes, search, typeFilter])

  const toggleExpand = (id: string) => {
    setExpandedNote(prev => prev === id ? null : id)
  }

  const handleSaveNote = (noteData: {
    title: string
    chiefComplaint: string
    subjective: string
    objective: string
    assessment: string
    plan: string
    alerts: string[]
    prescriptions: { medicine: string; dosage: string; instructions: string }[]
  }) => {
    const newNote: ClinicalNote = {
      id: `note-${Date.now()}`,
      patientName: 'New Patient',
      doctorName: 'Dr. Current',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      title: noteData.title,
      type: 'consultation',
      chiefComplaint: noteData.chiefComplaint,
      subjective: noteData.subjective,
      objective: noteData.objective,
      assessment: noteData.assessment,
      plan: noteData.plan,
      alerts: noteData.alerts,
      prescriptions: noteData.prescriptions,
      status: 'draft'
    }
    setNotes(prev => [newNote, ...prev])
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-900">Clinical Notes</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search notes..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm w-[180px]"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="consultation">Consultation</SelectItem>
              <SelectItem value="follow-up">Follow-up</SelectItem>
              <SelectItem value="procedure">Procedure</SelectItem>
              <SelectItem value="discharge">Discharge</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setComposerOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Note
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(note => (
          <Card key={note.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-0">
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between px-5 py-4 h-auto text-left"
                onClick={() => toggleExpand(note.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{note.title}</p>
                    <p className="text-xs text-slate-500">{note.patientName} — {note.date} {note.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={note.status === 'final' ? 'default' : 'secondary'} className="text-[11px]">
                    {note.status}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">{note.type}</Badge>
                  {expandedNote === note.id ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                </div>
              </Button>
              <AnimatePresence>
                {expandedNote === note.id && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 space-y-4 border-t">
                      {note.chiefComplaint && (
                        <div className="pt-4">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Chief Complaint</p>
                          <p className="text-sm text-slate-700">{note.chiefComplaint}</p>
                        </div>
                      )}
                      {note.subjective && <SoapBlock label="Subjective" color="blue">{note.subjective}</SoapBlock>}
                      {note.objective && <SoapBlock label="Objective" color="emerald">{note.objective}</SoapBlock>}
                      {note.assessment && <SoapBlock label="Assessment" color="amber">{note.assessment}</SoapBlock>}
                      {note.plan && <SoapBlock label="Plan" color="red">{note.plan}</SoapBlock>}
                      {note.alerts && note.alerts.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alerts</p>
                          {note.alerts.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              {a}
                            </div>
                          ))}
                        </div>
                      )}
                      {note.prescriptions && note.prescriptions.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Prescriptions</p>
                          {note.prescriptions.map((p, i) => (
                            <div key={i} className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-700">
                              <span className="font-medium">{p.medicine}</span>
                              <span>{p.dosage}</span>
                              <span className="text-blue-500">{p.instructions}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm"><Download className="mr-1.5 h-4 w-4" /> Export</Button>
                        <Button variant="outline" size="sm"><Stethoscope className="mr-1.5 h-4 w-4" /> Edit</Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-slate-400">No notes match search</CardContent></Card>
      )}

      <ClinicalNoteComposer
        open={composerOpen}
        onClose={() => setComposerOpen(false)}
        onSave={handleSaveNote}
      />
    </motion.div>
  )
}
