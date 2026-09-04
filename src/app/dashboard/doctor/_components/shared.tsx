import React from 'react'
import { cn } from '@/lib/utils'
import type { Risk, ApptStatus } from './types'

export const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
}

export const RISK_STYLE: Record<Risk, string> = {
  low: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20 dark:text-emerald-400 dark:bg-emerald-900/30 dark:ring-emerald-400/20',
  stable: 'text-emerald-700 bg-emerald-50 ring-emerald-600/20 dark:text-emerald-400 dark:bg-emerald-900/30 dark:ring-emerald-400/20',
  mild: 'text-amber-700 bg-amber-50 ring-amber-600/20 dark:text-amber-400 dark:bg-amber-900/30 dark:ring-amber-400/20',
  moderate: 'text-orange-700 bg-orange-50 ring-orange-600/20 dark:text-orange-400 dark:bg-orange-900/30 dark:ring-orange-400/20',
  high: 'text-red-700 bg-red-50 ring-red-600/20 dark:text-red-400 dark:bg-red-900/30 dark:ring-red-400/20',
  critical: 'text-red-800 bg-red-100 ring-red-700/30 dark:text-red-300 dark:bg-red-900/40 dark:ring-red-400/30'
}

export const STATUS_STYLE: Record<ApptStatus, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'checked-in': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  upcoming: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'no-show': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rescheduled: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
}

export function Field({
  label,
  children,
  className
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export function ChartTooltip({
  active,
  payload,
  label,
  unit
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
  unit?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-white dark:bg-slate-800 px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-slate-600">
        {payload[0].value}
        {unit ?? ''}
      </p>
    </div>
  )
}

export function NotifToggle({
  on,
  onToggle
}: {
  on: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none',
        on ? 'bg-blue-600' : 'bg-slate-200'
      )}
      aria-label="Toggle"
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out',
          on ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}

export function ControlBtn({
  children,
  active,
  onClick,
  className,
  ariaLabel
}: {
  children: React.ReactNode
  active?: boolean
  onClick?: () => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active
          ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
        className
      )}
    >
      {children}
    </button>
  )
}

export function SoapBlock({
  label,
  color,
  children
}: {
  label: string
  color: string
  children: React.ReactNode
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700'
  }
  return (
    <div className="space-y-2">
      <span className={cn('inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide', colorMap[color] ?? 'bg-slate-100 text-slate-600')}>
        {label}
      </span>
      <div className="text-sm text-slate-700 leading-relaxed">{children}</div>
    </div>
  )
}

export function InfoTile({
  icon,
  label,
  value
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="rounded-xl border bg-white dark:bg-slate-800 p-4 space-y-2">
      <div className="flex items-center gap-2 text-slate-500">{icon}<span className="text-xs font-medium uppercase tracking-wide">{label}</span></div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
    </div>
  )
}

