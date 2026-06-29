import { useEffect, useState } from 'react'
import { API_URL, apiRequest } from '../api'
import Avatar from '../components/Avatar'
import { avatarOptions } from '../config/avatarOptions'
import { useProductivityReport } from '../hooks/useProductivityReport'
import type { AuthUser } from '../types'

type CalendarEvent = { id: string; title: string; start?: string; location?: string }

const Profile = () => {
  const { report } = useProductivityReport()
  const [user, setUser] = useState<AuthUser | null>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const today = new Date().toLocaleDateString('en-CA')
  const todayEvents = events.filter((event) => event.start && new Date(event.start).toLocaleDateString('en-CA') === today)

  useEffect(() => {
    apiRequest<{ user: AuthUser }>('/api/auth/me').then(({ user: currentUser }) => {
      setUser(currentUser)
      setDisplayName(currentUser.displayName)
      setAvatar(currentUser.avatar || avatarOptions[0]?.imageUrl || '')
    }).catch((requestError) => setError(requestError.message))

    fetch(`${API_URL}/api/calendar/status`, { credentials: 'include' })
      .then((response) => response.json())
      .then(async (status) => {
        setCalendarConnected(Boolean(status.connected))
        if (!status.connected) return
        const response = await fetch(`${API_URL}/api/calendar/events`, { credentials: 'include' })
        if (response.ok) setEvents((await response.json()).events || [])
      })
      .catch(() => setCalendarConnected(false))

  }, [])

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const data = await apiRequest<{ user: AuthUser }>('/api/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({ displayName, avatar }),
      })
      setUser(data.user)
      setEditing(false)
      setSuccess('Profile updated.')
      window.dispatchEvent(new Event('profile:changed'))
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const metrics = [
    { label: 'Current streak', value: `${report?.metrics.currentStreakDays ?? 0} days`, detail: 'Consecutive habit check-ins', tone: 'bg-violet-100 dark:bg-violet-500/15' },
    { label: 'Pending today', value: report?.metrics.pendingToday ?? 0, detail: 'Tasks still open', tone: 'bg-rose-100 dark:bg-rose-500/15' },
    { label: 'Average focus', value: `${report?.metrics.averageFocusMinutes ?? 0}m`, detail: `${report?.metrics.totalFocusSessions ?? 0} recent sessions`, tone: 'bg-emerald-100 dark:bg-emerald-500/15' },
    { label: 'Events today', value: report?.metrics.eventsToday ?? todayEvents.length, detail: calendarConnected ? 'Google Calendar' : 'Calendar not connected', tone: 'bg-sky-100 dark:bg-sky-500/15' },
  ]

  return (
    <div className="grid gap-7">
      <section className="rounded-lg border border-violet-100 bg-white/80 p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar avatar={user?.avatar} name={user?.displayName} className="h-24 w-24 text-3xl" />
            <div><p className="text-sm font-black uppercase text-violet-500">Profile</p><h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">{user?.displayName || 'Loading...'}</h2><p className="mt-1 text-slate-500 dark:text-slate-400">{user?.email}</p></div>
          </div>
          <button type="button" onClick={() => { setEditing((value) => !value); setError(''); setSuccess('') }} className="rounded-lg border border-violet-200 px-5 py-3 font-black text-violet-700 dark:border-slate-700 dark:text-violet-200">{editing ? 'Cancel' : 'Edit profile'}</button>
        </div>

        {editing && (
          <form onSubmit={saveProfile} className="mt-7 border-t border-violet-100 pt-6 dark:border-slate-800">
            <label className="grid max-w-lg gap-2 text-sm font-bold">Display name<input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700" /></label>
            {avatarOptions.length > 0 && <fieldset className="mt-6"><legend className="text-sm font-black">Choose an avatar</legend><div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-6">{avatarOptions.map((option) => <button key={option.id} type="button" onClick={() => setAvatar(option.imageUrl)} className={`grid justify-items-center gap-2 rounded-lg border p-3 text-xs font-black ${avatar === option.imageUrl ? 'border-violet-500 bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-200' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`} aria-label={`Choose ${option.name} avatar`}><Avatar avatar={option.imageUrl} name={option.name} className="h-12 w-12 text-lg" /><span>{option.name}</span></button>)}</div></fieldset>}
            <p className='text-slate-500'>Avatars by <a href='https://www.magnific.com/' className='underline font-semibold'>Freepik</a>  </p>
            <div className="mt-6 flex justify-end"><button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-6 py-3 font-black text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save profile'}</button></div>
          </form>
        )}
        {error && <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        {success && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{success}</p>}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className={`rounded-lg p-5 ${metric.tone}`}><p className="text-sm font-black text-slate-600 dark:text-slate-300">{metric.label}</p><p className="mt-2 text-4xl font-black">{metric.value}</p><p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">{metric.detail}</p></article>)}</section>

      <section className="rounded-lg border border-violet-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3"><h3 className="text-xl font-black">Today&apos;s events</h3><span className="text-xs font-black uppercase text-violet-500">Google Calendar</span></div>
        <div className="mt-5 grid gap-3">
          {todayEvents.map((event) => <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 p-4 dark:bg-slate-950"><div><p className="font-black">{event.title}</p>{event.location && <p className="mt-1 text-sm text-slate-500">{event.location}</p>}</div><span className="text-sm font-black text-violet-600 dark:text-violet-300">{event.start && new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit' }).format(new Date(event.start))}</span></div>)}
          {!todayEvents.length && <p className="rounded-lg bg-[#fbf7f2] p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">{calendarConnected ? 'No events scheduled today.' : 'Connect Google Calendar to show today\'s events.'}</p>}
        </div>
      </section>
    </div>
  )
}

export default Profile
