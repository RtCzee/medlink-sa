'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User, Bell, Shield, Palette,
  Camera, Save, ChevronRight, LogOut, Moon, Sun, Monitor
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { fadeUp, NotifToggle, Field } from './shared'

export function SettingsTab() {
  const { user, updateUser, signOut } = useAuth()
  const [activeSection, setActiveSection] = useState<'profile' | 'notifications' | 'security' | 'appearance'>('profile')
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState('')
  const [specialty, setSpecialty] = useState(user?.specialty ?? '')
  const [theme, setTheme] = useState('light')
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    appointments: true,
    messages: true,
    prescriptions: true,
    labResults: true,
    system: false
  })

  const handleSave = () => {
    if (updateUser) {
      updateUser({ name, email, specialty })
    }
  }

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette }
  ]

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Settings</h2>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="space-y-1">
          {sections.map(s => (
            <Button
              key={s.id}
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2.5 px-3 py-2.5 h-auto text-sm font-medium',
                activeSection === s.id
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200'
              )}
              onClick={() => setActiveSection(s.id)}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
            </Button>
          ))}
          <Separator className="my-2" />
          <Button
            variant="ghost"
            className="w-full justify-start gap-2.5 px-3 py-2.5 h-auto text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-600"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <div>
          {activeSection === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-bold">
                      {name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm"><Camera className="mr-1.5 h-4 w-4" /> Change Photo</Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name">
                    <Input value={name} onChange={e => setName(e.target.value)} className="text-sm" />
                  </Field>
                  <Field label="Email">
                    <Input value={email} onChange={e => setEmail(e.target.value)} className="text-sm" type="email" />
                  </Field>
                  <Field label="Phone">
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+27..." className="text-sm" />
                  </Field>
                  <Field label="Specialty">
                    <Input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="e.g., Cardiology" className="text-sm" />
                  </Field>
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Save className="mr-2 h-4 w-4" /> Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Channels</h4>
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive notifications via email' },
                    { key: 'push', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                    { key: 'sms', label: 'SMS Notifications', desc: 'Receive text message alerts' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <NotifToggle
                        on={notifications[item.key as keyof typeof notifications]}
                        onToggle={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      />
                    </div>
                  ))}
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Categories</h4>
                  {[
                    { key: 'appointments', label: 'Appointments', desc: 'New and updated appointments' },
                    { key: 'messages', label: 'Messages', desc: 'Patient messages' },
                    { key: 'prescriptions', label: 'Prescriptions', desc: 'Prescription updates' },
                    { key: 'labResults', label: 'Lab Results', desc: 'New lab results available' },
                    { key: 'system', label: 'System Updates', desc: 'Platform updates and maintenance' }
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <NotifToggle
                        on={notifications[item.key as keyof typeof notifications]}
                        onToggle={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field label="Current Password">
                  <Input type="password" placeholder="Enter current password" className="text-sm" />
                </Field>
                <Field label="New Password">
                  <Input type="password" placeholder="Enter new password" className="text-sm" />
                </Field>
                <Field label="Confirm New Password">
                  <Input type="password" placeholder="Confirm new password" className="text-sm" />
                </Field>
                <div className="flex justify-end pt-2">
                  <Button variant="outline">Update Password</Button>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Two-Factor Authentication</h4>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium text-slate-800">Enable 2FA</p>
                      <p className="text-xs text-slate-500">Add an extra layer of security to your account</p>
                    </div>
                    <NotifToggle on={false} onToggle={() => {}} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Sessions</h4>
                  <div className="rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">Current Session</p>
                        <p className="text-xs text-slate-500">Chrome on Windows — Last active now</p>
                      </div>
                      <span className="text-xs text-emerald-600 font-medium">Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Appearance Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Theme</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor }
                    ].map(t => (
                      <Button
                        key={t.value}
                        variant="outline"
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-xl border-2 p-4 h-auto',
                          theme === t.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-50 hover:text-blue-700'
                            : 'border-slate-200 hover:border-slate-300 text-slate-600'
                        )}
                        onClick={() => setTheme(t.value)}
                      >
                        <t.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{t.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Language</h4>
                  <Select defaultValue="en">
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="af">Afrikaans</SelectItem>
                      <SelectItem value="zu">isiZulu</SelectItem>
                      <SelectItem value="xh">isiXhosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Timezone</h4>
                  <Select defaultValue="SAST">
                    <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAST">South Africa (SAST, UTC+2)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="CET">Central European (CET, UTC+1)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  )
}
