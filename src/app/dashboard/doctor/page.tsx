'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Activity, Users, Calendar, MessageCircle, Video, Settings, FileText, Pill
} from 'lucide-react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

import type { TabId } from './_components/types'

const OverviewTab = dynamic(() => import('./_components/overview-tab').then(m => ({ default: m.OverviewTab })), { ssr: false })
const ScheduleTab = dynamic(() => import('./_components/schedule-tab').then(m => ({ default: m.ScheduleTab })), { ssr: false })
const PatientsTab = dynamic(() => import('./_components/patients-tab').then(m => ({ default: m.PatientsTab })), { ssr: false })
const PrescriptionsTab = dynamic(() => import('./_components/prescriptions-tab').then(m => ({ default: m.PrescriptionsTab })), { ssr: false })
const VideoTab = dynamic(() => import('./_components/video-tab').then(m => ({ default: m.VideoTab })), { ssr: false })
const NotesTab = dynamic(() => import('./_components/notes-tab').then(m => ({ default: m.NotesTab })), { ssr: false })
const MessagesTab = dynamic(() => import('./_components/messages-tab').then(m => ({ default: m.MessagesTab })), { ssr: false })
const SettingsTab = dynamic(() => import('./_components/settings-tab').then(m => ({ default: m.SettingsTab })), { ssr: false })

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'schedule', label: 'Schedule', icon: Calendar },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
  { id: 'consults', label: 'Consults', icon: Video },
  { id: 'notes', label: 'Notes', icon: FileText },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings }
]

export default function DoctorDashboardPage() {
  const [tab, setTab] = useState<TabId>('overview')

  const goToTab = (t: string) => setTab(t as TabId)

  const renderTab = () => {
    switch (tab) {
      case 'overview':
        return <OverviewTab goToTab={goToTab} />
      case 'schedule':
        return <ScheduleTab />
      case 'patients':
        return <PatientsTab goToTab={goToTab} />
      case 'prescriptions':
        return <PrescriptionsTab />
      case 'consults':
        return <VideoTab goToTab={goToTab} />
      case 'notes':
        return <NotesTab />
      case 'messages':
        return <MessagesTab />
      case 'settings':
        return <SettingsTab />
      default:
        return <OverviewTab goToTab={goToTab} />
    }
  }

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <nav className="flex gap-1 rounded-xl bg-slate-100 dark:bg-slate-700/50 p-1 overflow-x-auto">
          {TABS.map(t => (
            <Button
              key={t.id}
              variant="ghost"
              size="sm"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-lg px-3 py-2 h-auto text-sm font-medium',
                tab === t.id
                  ? 'bg-white text-blue-700 shadow-sm hover:bg-white/90 hover:text-blue-700 dark:bg-slate-700 dark:text-blue-400 dark:hover:bg-slate-600 dark:hover:text-blue-400'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-600/50'
              )}
            >
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </Button>
          ))}
        </nav>

        {renderTab()}
      </div>
    </DashboardLayout>
  )
}
