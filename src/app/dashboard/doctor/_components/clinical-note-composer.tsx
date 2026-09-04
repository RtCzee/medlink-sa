'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Stethoscope, ChevronDown, ChevronRight, AlertTriangle, FileText, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { Field, fadeUp } from './shared'

interface ClinicalNoteComposerProps {
  open: boolean
  onClose: () => void
  onSave: (note: {
    title: string
    chiefComplaint: string
    subjective: string
    objective: string
    assessment: string
    plan: string
    alerts: string[]
    prescriptions: { medicine: string; dosage: string; instructions: string }[]
  }) => void
}

export function ClinicalNoteComposer({ open, onClose, onSave }: ClinicalNoteComposerProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [title, setTitle] = useState('')
  const [chiefComplaint, setChiefComplaint] = useState('')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [assessment, setAssessment] = useState('')
  const [plan, setPlan] = useState('')
  const [alerts, setAlerts] = useState<string[]>([])
  const [alertText, setAlertText] = useState('')
  const [prescriptions, setPrescriptions] = useState<{ medicine: string; dosage: string; instructions: string }[]>([])
  const [medName, setMedName] = useState('')
  const [medDosage, setMedDosage] = useState('')
  const [medInstructions, setMedInstructions] = useState('')

  const toggle = (section: string) => setExpanded(prev => ({ ...prev, [section]: !prev[section] }))

  const addAlert = () => {
    if (alertText.trim()) {
      setAlerts(prev => [...prev, alertText.trim()])
      setAlertText('')
    }
  }

  const addPrescription = () => {
    if (medName.trim()) {
      setPrescriptions(prev => [...prev, { medicine: medName.trim(), dosage: medDosage.trim(), instructions: medInstructions.trim() }])
      setMedName('')
      setMedDosage('')
      setMedInstructions('')
    }
  }

  const handleSave = () => {
    onSave({ title, chiefComplaint, subjective, objective, assessment, plan, alerts, prescriptions })
    setTitle('')
    setChiefComplaint('')
    setSubjective('')
    setObjective('')
    setAssessment('')
    setPlan('')
    setAlerts([])
    setPrescriptions([])
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-blue-600" />
            Clinical Note Composer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Field label="Note Title">
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Follow-up — Hypertension"
              className="w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </Field>

          <Field label="Chief Complaint">
            <input
              value={chiefComplaint}
              onChange={e => setChiefComplaint(e.target.value)}
              placeholder="Why is the patient here today?"
              className="w-full rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </Field>

          {[
            { key: 'subjective', label: 'Subjective', color: 'blue', value: subjective, setter: setSubjective },
            { key: 'objective', label: 'Objective', color: 'emerald', value: objective, setter: setObjective },
            { key: 'assessment', label: 'Assessment', color: 'amber', value: assessment, setter: setAssessment },
            { key: 'plan', label: 'Plan', color: 'red', value: plan, setter: setPlan }
          ].map(section => (
            <div key={section.key} className="rounded-xl border border-slate-200 overflow-hidden">
              <Button
                variant="ghost"
                className="flex w-full items-center justify-between px-4 py-3 h-auto text-sm font-semibold text-slate-700 hover:bg-slate-50 justify-start rounded-none"
                onClick={() => toggle(section.key)}
              >
                <span>{section.label}</span>
                {expanded[section.key] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <AnimatePresence>
                {expanded[section.key] && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <Textarea
                        value={section.value}
                        onChange={e => section.setter(e.target.value)}
                        placeholder={`Enter ${section.label.toLowerCase()} notes...`}
                        className="min-h-[100px] text-sm"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alerts & Flags
            </h4>
            {alerts.map((a, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {a}
              </div>
            ))}
            <div className="flex gap-2">
              <input
                value={alertText}
                onChange={e => setAlertText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addAlert()}
                placeholder="Add alert..."
                className="flex-1 rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none"
              />
              <Button type="button" variant="outline" size="sm" onClick={addAlert}>
                Add
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Pill className="h-4 w-4 text-blue-500" />
              Prescriptions
            </h4>
            {prescriptions.map((p, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                <Pill className="h-3.5 w-3.5" />
                <span className="font-medium">{p.medicine}</span>
                <span>{p.dosage}</span>
                <span className="text-blue-500">{p.instructions}</span>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-2">
              <input
                value={medName}
                onChange={e => setMedName(e.target.value)}
                placeholder="Medicine"
                className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                value={medDosage}
                onChange={e => setMedDosage(e.target.value)}
                placeholder="Dosage"
                className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
              <input
                value={medInstructions}
                onChange={e => setMedInstructions(e.target.value)}
                placeholder="Instructions"
                className="rounded-lg border border-slate-200 bg-white dark:bg-slate-800 dark:border-slate-700 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addPrescription}>
              Add Prescription
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
              <FileText className="mr-2 h-4 w-4" />
              Save Note
            </Button>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
