'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Video, Phone, MessageCircle, Clock, CheckCircle,
  Monitor, Mic, MicOff, Camera, CameraOff, ScreenShare,
  Pill
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { fadeUp, ControlBtn } from './shared'
import type { VideoConsult } from './types'
import { VIDEO_CONSULTS } from './mock-data'

interface VideoTabProps {
  goToTab?: (tab: string) => void
}

export function VideoTab({ goToTab }: VideoTabProps) {
  const [filter, setFilter] = useState<string>('all')
  const [callModal, setCallModal] = useState<VideoConsult | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ from: string; text: string }>>([])
  const [quickPrescOpen, setQuickPrescOpen] = useState(false)
  const [quickMed, setQuickMed] = useState('')
  const [quickDosage, setQuickDosage] = useState('')
  const [quickFreq, setQuickFreq] = useState('')

  const filtered = useMemo(() => {
    if (filter === 'all') return VIDEO_CONSULTS
    return VIDEO_CONSULTS.filter(v => v.status === filter)
  }, [filter])

  const handleSendChat = () => {
    if (!chatMsg.trim()) return
    setChatMessages(prev => [...prev, { from: 'You', text: chatMsg.trim() }])
    setChatMsg('')
    setTimeout(() => {
      setChatMessages(prev => [...prev, { from: 'Patient', text: 'Thank you, doctor.' }])
    }, 1500)
  }

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-slate-900">Video Consultations</h2>
        <div className="flex gap-2">
          <ControlBtn active={filter === 'all'} onClick={() => setFilter('all')}>All</ControlBtn>
          <ControlBtn active={filter === 'active'} onClick={() => setFilter('active')}>
            <div className="h-2 w-2 rounded-full bg-emerald-500" /> Active
          </ControlBtn>
          <ControlBtn active={filter === 'scheduled'} onClick={() => setFilter('scheduled')}>
            <Clock className="h-3.5 w-3.5" /> Scheduled
          </ControlBtn>
          <ControlBtn active={filter === 'completed'} onClick={() => setFilter('completed')}>
            <CheckCircle className="h-3.5 w-3.5" /> Completed
          </ControlBtn>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map(v => (
          <Card key={v.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCallModal(v)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <Video className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{v.patientName}</p>
                    <p className="text-xs text-slate-500">{v.type} — {v.duration} min</p>
                  </div>
                </div>
                <Badge variant={v.status === 'active' ? 'default' : v.status === 'scheduled' ? 'secondary' : 'outline'} className="text-[11px]">
                  {v.status}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{v.date} {v.time}</span>
                {v.status === 'active' && <span className="flex items-center gap-1 text-emerald-600"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> In progress</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card><CardContent className="py-12 text-center text-sm text-slate-400">No consultations match filter</CardContent></Card>
      )}

      <Dialog open={!!callModal} onOpenChange={() => setCallModal(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
          {callModal && (
            <div className="flex flex-col h-[70vh]">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
                    {callModal.patientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{callModal.patientName}</p>
                    <p className="text-xs text-slate-500">{callModal.type} — {callModal.date} {callModal.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {callModal.status === 'active' && (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-slate-900 flex items-center justify-center relative">
                <div className="text-center text-white/60">
                  <Monitor className="h-16 w-16 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Video feed placeholder</p>
                  <p className="text-xs mt-1 text-white/40">Patient: {callModal.patientName}</p>
                </div>
                {callModal.status === 'active' && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs text-white">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                    00:12:34
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 p-4 border-t bg-white dark:bg-slate-800">
                <Button
                  variant={micOn ? 'default' : 'destructive'}
                  size="icon"
                  className="rounded-full h-10 w-10"
                  onClick={() => setMicOn(!micOn)}
                  aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
                >
                  {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                </Button>
                <Button
                  variant={camOn ? 'default' : 'destructive'}
                  size="icon"
                  className="rounded-full h-10 w-10"
                  onClick={() => setCamOn(!camOn)}
                  aria-label={camOn ? 'Turn off camera' : 'Turn on camera'}
                >
                  {camOn ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10" aria-label="Share screen">
                  <ScreenShare className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setChatOpen(!chatOpen)} aria-label="Toggle chat">
                  <MessageCircle className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10" onClick={() => setQuickPrescOpen(true)} aria-label="Quick prescription">
                  <Pill className="h-4 w-4" />
                </Button>
                <Button variant="destructive" className="rounded-full px-6">
                  <Phone className="mr-2 h-4 w-4" /> End Call
                </Button>
              </div>

              {chatOpen && (
                <div className="absolute right-4 bottom-20 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border overflow-hidden">
                  <div className="p-3 border-b bg-slate-50 dark:bg-slate-700">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Chat</p>
                  </div>
                  <div className="h-48 overflow-y-auto p-3 space-y-2">
                    {chatMessages.map((m, i) => (
                      <div key={i} className={cn('text-xs rounded-lg px-3 py-2', m.from === 'You' ? 'bg-blue-50 dark:bg-blue-900/30 ml-8' : 'bg-slate-100 dark:bg-slate-700 mr-8')}>
                        <p className="font-medium text-slate-600 dark:text-slate-400">{m.from}</p>
                        <p className="text-slate-800 dark:text-slate-200">{m.text}</p>
                      </div>
                    ))}
                    {chatMessages.length === 0 && <p className="text-xs text-slate-400 text-center py-4">No messages yet</p>}
                  </div>
                  <div className="p-2 border-t flex gap-2">
                    <Input
                      value={chatMsg}
                      onChange={e => setChatMsg(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                      placeholder="Type..."
                      className="text-xs h-8"
                    />
                    <Button size="sm" className="h-8" onClick={handleSendChat}>Send</Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={quickPrescOpen} onOpenChange={setQuickPrescOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-600" /> Quick Prescription
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Medicine</label>
              <Input value={quickMed} onChange={e => setQuickMed(e.target.value)} placeholder="Medicine name" className="text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Dosage</label>
                <Input value={quickDosage} onChange={e => setQuickDosage(e.target.value)} placeholder="500mg" className="text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-500">Frequency</label>
                <Input value={quickFreq} onChange={e => setQuickFreq(e.target.value)} placeholder="Twice daily" className="text-sm" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => { setQuickPrescOpen(false); setQuickMed(''); setQuickDosage(''); setQuickFreq('') }}>
                <Pill className="mr-2 h-4 w-4" /> Save
              </Button>
              <Button variant="outline" onClick={() => setQuickPrescOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
