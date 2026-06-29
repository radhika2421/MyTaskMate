import { useState } from 'react'
import { apiRequest } from '../api'
import { useHabits } from '../hooks/useHabits'
import type { Habit } from '../types'

const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const HabitsView = () => {
  const { habits, loading, error, updateHabit } = useHabits()
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [cadence, setCadence] = useState<Habit['cadence']>('Daily')
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')

  const createHabit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setActionError('')
    try {
      await apiRequest('/api/habits', { method: 'POST', body: JSON.stringify({ name, cadence }) })
      setName('')
      setCadence('Daily')
      setFormOpen(false)
      window.dispatchEvent(new Event('habits:changed'))
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to create habit.')
    } finally {
      setSaving(false)
    }
  }

  const toggleDay = async (habit: Habit, index: number, checked: boolean) => {
    const nextDays = [...habit.days]
    nextDays[index] = checked
    try {
      await updateHabit(habit.id, { days: nextDays })
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to update habit.')
    }
  }

  return (
    <div className="grid gap-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950 dark:text-white">Weekly Habits Tracker</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Daily and long-term habits with checklists, streaks, and completion scores.</p>
        </div>
        <button type="button" onClick={() => setFormOpen((open) => !open)} className="rounded-lg bg-violet-500 px-5 py-3 font-black text-white">{formOpen ? 'Cancel' : 'New Habit'}</button>
      </section>

      {formOpen && (
        <form onSubmit={createHabit} className="grid gap-4 rounded-lg border border-violet-100 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="grid gap-2 text-sm font-bold">Habit name
            <input required value={name} onChange={(event) => setName(event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700" placeholder="Read for 20 minutes" />
          </label>
          <label className="grid gap-2 text-sm font-bold">Cadence
            <select value={cadence} onChange={(event) => setCadence(event.target.value as Habit['cadence'])} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-slate-700">
              <option value="Daily">Daily</option>
              <option value="Long term">Long term</option>
            </select>
          </label>
          <button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-60">{saving ? 'Saving...' : 'Create habit'}</button>
        </form>
      )}

      {(error || actionError) && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{actionError || error}</p>}
      {loading && <p className="text-sm font-bold text-violet-500">Loading your habits...</p>}

      <section className="grid gap-5">
        {!loading && !habits.length && (
          <div className="rounded-lg border border-dashed border-violet-200 bg-white/60 p-10 text-center dark:border-slate-700 dark:bg-slate-900/60">
            <p className="font-black">No habits yet</p>
            <p className="mt-1 text-sm text-slate-500">Create one and start checking in for this week.</p>
          </div>
        )}
        {habits.map((habit) => (
          <article key={habit.id} className="rounded-lg border border-violet-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase text-violet-500">{habit.cadence}</p>
                <h3 className="text-xl font-black text-slate-950 dark:text-white">{habit.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-black text-amber-700 dark:bg-amber-500/15 dark:text-amber-200">{habit.score}% streak</span>
                <label className="sr-only" htmlFor={`habit-status-${habit.id}`}>Habit status</label>
                <select id={`habit-status-${habit.id}`} value={habit.status} onChange={(event) => updateHabit(habit.id, { status: event.target.value as Habit['status'] }).catch((requestError) => setActionError(requestError.message))} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-black text-violet-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-violet-200">
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-7 gap-2">
              {habit.days.map((done, index) => (
                <label key={`${habit.id}-${index}`} className={`grid min-w-0 gap-2 rounded-lg p-3 text-center text-sm font-black ${done ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200' : 'bg-[#fbf7f2] text-slate-500 dark:bg-slate-950 dark:text-slate-400'}`}>
                  {days[index]}
                  <input type="checkbox" checked={done} onChange={(event) => toggleDay(habit, index, event.target.checked)} className="mx-auto h-5 w-5 accent-violet-500" />
                </label>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default HabitsView
