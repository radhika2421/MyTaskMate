export type Priority = 'High' | 'Medium' | 'Low'

export type TaskStatus = 'In Progress' | 'Completed' | 'Pending'

export type Task = {
  id: string | number
  title: string
  project: string
  dueDate: string
  time: string
  priority: Priority
  status: TaskStatus
  nextAction: string
}

export type Goal = {
  id: string | number
  title: string
  period: 'Day' | 'Week' | 'Month' | 'Year'
  progress: number
  status: 'Completed' | 'In Progress' | 'Pending'
  milestone: string
  tag: 'Work' | 'Personal' | 'Mind' | 'Health' | 'Relationships' | 'Finance' | 'Learning' | 'Other'
  notes: Array<{ id: string; text: string; date: string }>
}

export type Habit = {
  id: string | number
  name: string
  cadence: 'Daily' | 'Long term'
  days: boolean[]
  score: number
  status: 'Pending' | 'In Progress' | 'Completed'
}

export type ScheduleItem = {
  id: number
  title: string
  time: string
  type: 'Focus' | 'Meeting' | 'Break' | 'Planning'
}

export type AuthUser = {
  _id: string
  email: string
  displayName: string
  avatar?: string
  emailVerified?: boolean
}

export type ProductivityMetrics = {
  bestFocusWindow: string
  averageFocusMinutes: number
  totalFocusSessions: number
  onTimeCompletionRate: number | null
  deadlinesMissed: number
  currentStreakDays: number
  habitScore: number
  pendingToday: number
  dueToday: number
  completedToday: number
  highPriorityOpen: number
  eventsToday: number
}

export type ProductivityReport = {
  insights: string[]
  quote: { text: string; author: string }
  metrics: ProductivityMetrics
  timeline: Array<{ id: string; title: string; time: string; type: string }>
  source: 'gemini' | 'fallback'
}
