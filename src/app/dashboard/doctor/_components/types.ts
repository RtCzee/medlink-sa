export type TabId =
  | 'overview'
  | 'schedule'
  | 'patients'
  | 'prescriptions'
  | 'consults'
  | 'notes'
  | 'messages'
  | 'settings'

export type ApptStatus = 'scheduled' | 'checked-in' | 'upcoming' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled'
export type ApptType = 'video' | 'in-person'
export type Risk = 'low' | 'mild' | 'moderate' | 'high' | 'critical' | 'stable'

export type ScheduleItem = {
  id: string
  patient: string
  patientName: string
  age: number
  reason: string
  time: string
  date: string
  duration: number
  type: ApptType
  status: ApptStatus
}

export type Patient = {
  id: string
  name: string
  initials: string
  age: number
  gender: 'M' | 'F'
  condition: string
  lastVisit: string
  risk: Risk
  status: 'active' | 'stable' | 'monitoring' | 'new'
  phone: string
  province: string
  nextAppt: string
  vitals: {
    bp: string
    hr: string
    temp: string
    spo2: string
  }
  allergies: string[]
}

export type Prescription = {
  id: string
  patientName: string
  medicine: string
  strength: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
  refills: number
  status: 'sent' | 'pending' | 'dispensed' | 'active'
  time: string
  date: string
  notes: string
}

export type ClinicalNote = {
  id: string
  patientName: string
  doctorName: string
  date: string
  time: string
  title: string
  type: 'consultation' | 'follow-up' | 'procedure' | 'discharge'
  chiefComplaint: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  alerts: string[]
  prescriptions: { medicine: string; dosage: string; instructions: string }[]
  status: 'draft' | 'final'
}

export type Conversation = {
  id: string
  patientName: string
  patientEmail: string
  initials: string
  role: 'patient' | 'staff'
  lastMessage: string
  lastTime: string
  unread: number
  online: boolean
  messages: { id: string; from: 'me' | 'them'; text: string; time: string }[]
}

export type VideoConsult = {
  id: string
  patientName: string
  initials: string
  reason: string
  type: string
  date: string
  time: string
  duration: string
  status: 'upcoming' | 'live' | 'completed' | 'missed' | 'active' | 'scheduled'
}
