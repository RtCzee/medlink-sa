'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Pill,
  Printer, Send, MoreHorizontal
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { fadeUp } from './shared'
import type { Prescription } from './types'
import { TODAY_PRESCRIPTIONS, RECENT_PRESCRIBED } from './mock-data'

export function PrescriptionsTab() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [composerOpen, setComposerOpen] = useState(false)
  const [selectedRx, setSelectedRx] = useState<Prescription | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [newMed, setNewMed] = useState('')
  const [newDosage, setNewDosage] = useState('')
  const [newFrequency, setNewFrequency] = useState('')
  const [newDuration, setNewDuration] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(TODAY_PRESCRIPTIONS)

  const filtered = useMemo(() => {
    return prescriptions.filter(p => {
      if (search && !p.patientName.toLowerCase().includes(search.toLowerCase()) && !p.medicine.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      return true
    })
  }, [prescriptions, search, statusFilter])

  const handleAddPrescription = () => {
    if (!newMed.trim()) return
    const rx: Prescription = {
      id: `rx-${Date.now()}`,
      patientName: 'New Patient',
      medicine: newMed.trim(),
      strength: '',
      dosage: newDosage.trim() || '500mg',
      frequency: newFrequency.trim() || 'Twice daily',
      duration: newDuration.trim() || '7 days',
      quantity: 0,
      refills: 0,
      status: 'pending',
      time: new Date().toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }),
      date: new Date().toISOString().split('T')[0],
      notes: newNotes.trim()
    }
    setPrescriptions(prev => [rx, ...prev])
    setNewMed('')
    setNewDosage('')
    setNewFrequency('')
    setNewDuration('')
    setNewNotes('')
    setComposerOpen(false)
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-900">Prescriptions</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-8 text-sm w-[180px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="dispensed">Dispensed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setComposerOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Rx
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(rx => (
          <Card key={rx.id} className="hover:shadow-sm transition-shadow cursor-pointer" onClick={() => { setSelectedRx(rx); setDrawerOpen(true) }}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                  <Pill className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{rx.medicine}</p>
                  <p className="text-xs text-slate-500">{rx.patientName} — {rx.dosage} — {rx.frequency}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold',
                  rx.status === 'dispensed' ? 'bg-emerald-100 text-emerald-700' :
                  rx.status === 'active' ? 'bg-blue-100 text-blue-700' :
                  'bg-amber-100 text-amber-700'
                )}>
                  {rx.status}
                </span>
                <MoreHorizontal className="h-4 w-4 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-slate-400">No prescriptions match</CardContent></Card>
      )}

      <Dialog open={composerOpen} onOpenChange={setComposerOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-600" />
              New Prescription
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Medicine</label>
              <Input value={newMed} onChange={e => setNewMed(e.target.value)} placeholder="Medicine name" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Dosage</label>
                <Input value={newDosage} onChange={e => setNewDosage(e.target.value)} placeholder="500mg" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Frequency</label>
                <Input value={newFrequency} onChange={e => setNewFrequency(e.target.value)} placeholder="Twice daily" className="text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Duration</label>
              <Input value={newDuration} onChange={e => setNewDuration(e.target.value)} placeholder="7 days" className="text-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Notes</label>
              <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Additional notes..." className="text-sm min-h-[80px]" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAddPrescription} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Pill className="mr-2 h-4 w-4" /> Save Prescription
              </Button>
              <Button variant="outline" onClick={() => setComposerOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogContent className="max-w-lg">
          {selectedRx && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedRx.medicine}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 pt-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-slate-500">Patient:</span> {selectedRx.patientName}</div>
                  <div><span className="text-slate-500">Dosage:</span> {selectedRx.dosage}</div>
                  <div><span className="text-slate-500">Frequency:</span> {selectedRx.frequency}</div>
                  <div><span className="text-slate-500">Duration:</span> {selectedRx.duration}</div>
                  <div><span className="text-slate-500">Status:</span> {selectedRx.status}</div>
                  <div><span className="text-slate-500">Date:</span> {selectedRx.date}</div>
                </div>
                {selectedRx.notes && (
                  <div className="rounded-lg bg-slate-50 p-3">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Notes</p>
                    <p className="text-sm text-slate-700">{selectedRx.notes}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm"><Printer className="mr-1.5 h-4 w-4" /> Print</Button>
                  <Button variant="outline" size="sm"><Send className="mr-1.5 h-4 w-4" /> Send to Pharmacy</Button>
                  <Button variant="outline" size="sm" onClick={() => setDrawerOpen(false)}>Close</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
