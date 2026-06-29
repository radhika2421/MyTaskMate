import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_URL } from '../api'
import { useTasks } from '../hooks/useTasks'

type CalendarEvent = {
  id: string
  title: string
  description?: string
  location?: string
  start?: string
  end?: string
  htmlLink?: string
}

const pad = (value: number) => String(value).padStart(2, '0')
const toLocalInput = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
const dateKey = (date: Date) => date.toLocaleDateString('en-CA')

const initialEventForm = () => {
  const start = new Date()
  start.setHours(start.getHours() + 1, 0, 0, 0)
  const end = new Date(start)
  end.setHours(end.getHours() + 1)
  return { title: '', description: '', location: '', start: toLocalInput(start), end: toLocalInput(end) }
}

const formatEventTime = (value?: string) => {
  if (!value) return 'Time not set'
  return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

const CalendarView = () => {
  const { tasks } = useTasks()
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventForm, setEventForm] = useState(initialEventForm)
  const [saving, setSaving] = useState(false)

  const now = useMemo(() => new Date(), [])
  const monthLabel = new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(now)
  const monthCells = useMemo(() => {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    return Array.from({ length: 42 }, (_, index) => {
      const day = index - firstDay + 1
      return day > 0 && day <= daysInMonth ? new Date(now.getFullYear(), now.getMonth(), day) : null
    })
  }, [now])
  const eventDateKeys = useMemo(() => new Set(events.filter((event) => event.start).map((event) => dateKey(new Date(event.start!)))), [events])
  const importantDeadlines = useMemo(() => tasks
    .filter((task) => task.priority === 'High' && task.status !== 'Completed')
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
    .slice(0, 5), [tasks])

  const loadEvents = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/calendar/events`, { credentials: 'include' })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Unable to load calendar events.')
    setEvents(data.events || [])
  }, [])

  useEffect(() => {
    const loadCalendar = async () => {
      try {
        const statusResponse = await fetch(`${API_URL}/api/calendar/status`, { credentials: 'include' })
        const statusData = await statusResponse.json()
        setConnected(Boolean(statusData.connected))
        if (statusData.connected) await loadEvents()
      } catch (calendarError) {
        setError(calendarError instanceof Error ? calendarError.message : 'Unable to load calendar.')
      } finally {
        setLoading(false)
      }
    }
    loadCalendar()
  }, [loadEvents])

  const openEventModal = () => {
    setEventForm(initialEventForm())
    setError('')
    setSuccess('')
    setEventModalOpen(true)
  }

  const submitEvent = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const start = new Date(eventForm.start)
      const end = new Date(eventForm.end)
      if (end <= start) throw new Error('End time must be after start time.')

      const response = await fetch(`${API_URL}/api/calendar/events`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: eventForm.title.trim(),
          description: eventForm.description.trim(),
          location: eventForm.location.trim(),
          start: start.toISOString(),
          end: end.toISOString(),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Unable to create event.')

      await loadEvents()
      setEventModalOpen(false)
      setSuccess('Event added to MyTaskMate and Google Calendar.')
    } catch (calendarError) {
      setError(calendarError instanceof Error ? calendarError.message : 'Unable to create event.')
    } finally {
      setSaving(false)
    }
  }

  const field = (name: keyof ReturnType<typeof initialEventForm>, value: string) => setEventForm((current) => ({ ...current, [name]: value }))

  return (
    <div className="grid gap-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Integrated Calendar</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Google Calendar events, important dates, and monthly schedule awareness.</p>
        </div>
        <div className="grid w-full gap-3 min-[480px]:flex min-[480px]:w-auto min-[480px]:flex-wrap">
          {connected && <button type="button" onClick={openEventModal} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white">Add Event</button>}
          <a href={`${API_URL}/api/auth/google`} className="rounded-lg bg-white px-5 py-3 text-center font-black text-slate-700 shadow-sm ring-1 ring-violet-100 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-800">
            {connected ? 'Reconnect Calendar' : 'Connect Google Calendar'}
          </a>
        </div>
      </section>

      {error && <p className="rounded-lg bg-rose-100 p-4 font-bold text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
      {success && <p className="rounded-lg bg-emerald-100 p-4 font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">{success}</p>}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <article className="rounded-lg border border-violet-100 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-950 dark:text-white">{monthLabel}</h3>
            <span className="text-xs font-black text-violet-500 sm:text-sm">Google synced</span>
          </div>
          <div className="mt-4 grid grid-cols-7 gap-1 text-center sm:mt-6 sm:gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-2 text-[10px] font-black uppercase text-slate-500 sm:text-xs"><span className="sm:hidden">{day[0]}</span><span className="hidden sm:inline">{day}</span></span>)}
            {monthCells.map((date, index) => {
              const isToday = date ? dateKey(date) === dateKey(new Date()) : false
              const hasEvent = date ? eventDateKeys.has(dateKey(date)) : false
              return (
                <div key={date ? date.toISOString() : `empty-${index}`} className={`relative grid aspect-square place-items-center rounded-md border text-xs font-black sm:rounded-lg sm:text-sm ${!date ? 'border-transparent' : isToday ? 'border-violet-500 bg-violet-500 text-white shadow-lg shadow-violet-200 dark:shadow-none' : 'border-violet-50 bg-[#fbf7f2] text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200'}`}>
                  {date?.getDate()}
                  {hasEvent && <span className={`absolute bottom-1 h-1 w-1 rounded-full sm:bottom-2 sm:h-1.5 sm:w-1.5 ${isToday ? 'bg-white' : 'bg-rose-500'}`} />}
                </div>
              )
            })}
          </div>
        </article>

        <div className="grid gap-6">
          <article className="rounded-lg border border-violet-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between"><h3 className="text-xl font-black text-slate-950 dark:text-white">Agenda Stream</h3><span className="text-xs font-black text-violet-500">Next 30 days</span></div>
            <div className="mt-5 grid gap-3">
              {loading ? <p className="text-slate-500">Loading calendar...</p> : !connected ? <p className="rounded-lg bg-violet-50 p-4 text-sm font-bold text-slate-600 dark:bg-slate-950 dark:text-slate-300">Connect Google Calendar to show and create events.</p> : !events.length ? <p className="rounded-lg bg-violet-50 p-4 text-sm font-bold text-slate-600 dark:bg-slate-950 dark:text-slate-300">No events found for the next 30 days.</p> : events.map((event) => (
                <article key={event.id} className="rounded-lg bg-violet-50 p-4 dark:bg-slate-950">
                  <p className="text-sm font-black text-violet-600 dark:text-violet-300">{formatEventTime(event.start)}</p>
                  <h4 className="mt-1 font-black text-slate-950 dark:text-white">{event.title}</h4>
                  {event.location && <p className="text-sm text-slate-500">{event.location}</p>}
                  {event.htmlLink && <a href={event.htmlLink} target="_blank" rel="noreferrer" className="mt-2 inline-flex text-sm font-black text-violet-600">Open in Google Calendar</a>}
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-lg border border-violet-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xl font-black text-slate-950 dark:text-white">Important Deadlines</h3>
            <div className="mt-5 grid gap-3">
              {importantDeadlines.map((task) => <div key={task.id} className="flex items-center justify-between gap-4 rounded-lg bg-rose-50 p-4 dark:bg-slate-950"><p className="font-black text-slate-900 dark:text-white">{task.title}</p><span className="shrink-0 text-sm font-black text-rose-600 dark:text-rose-200">{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(task.dueDate))}</span></div>)}
              {!importantDeadlines.length && <p className="rounded-lg bg-[#fbf7f2] p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">No open high-priority deadlines.</p>}
            </div>
          </article>
        </div>
      </section>

      {eventModalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/60 p-3 sm:p-4">
          <form onSubmit={submitEvent} className="max-h-[calc(100svh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-4 shadow-2xl dark:bg-slate-950 sm:max-h-[calc(100svh-2rem)] sm:p-6">
            <div className="flex items-start justify-between gap-4"><div><h3 className="text-2xl font-black">Add calendar event</h3><p className="mt-1 text-sm text-slate-500">This will be saved directly to your primary Google Calendar.</p></div><button type="button" onClick={() => setEventModalOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 dark:border-slate-800" aria-label="Close event form">x</button></div>
            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-bold">Event title<input required value={eventForm.title} onChange={(event) => field('title', event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700" placeholder="Project review" /></label>
              <label className="grid gap-2 text-sm font-bold">Location<input value={eventForm.location} onChange={(event) => field('location', event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700" placeholder="Google Meet or meeting room" /></label>
              <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Starts<input required type="datetime-local" value={eventForm.start} onChange={(event) => field('start', event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-slate-700" /></label><label className="grid gap-2 text-sm font-bold">Ends<input required type="datetime-local" value={eventForm.end} onChange={(event) => field('end', event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-slate-700" /></label></div>
              <label className="grid gap-2 text-sm font-bold">Description<textarea value={eventForm.description} onChange={(event) => field('description', event.target.value)} className="min-h-24 rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700" placeholder="Agenda or preparation notes" /></label>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 min-[480px]:flex-row min-[480px]:justify-end"><button type="button" onClick={() => setEventModalOpen(false)} className="rounded-lg border border-slate-200 px-5 py-3 font-bold dark:border-slate-800">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-60">{saving ? 'Adding...' : 'Add to Google Calendar'}</button></div>
          </form>
        </div>
      )}
    </div>
  )
}

export default CalendarView
