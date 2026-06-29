import { useEffect, useState } from 'react'
import { apiRequest } from '../api'
import { useGoals } from '../hooks/useGoals'
import type { Goal } from '../types'

const periods: Goal['period'][] = ['Day', 'Week', 'Month', 'Year']
const tags: Goal['tag'][] = ['Work', 'Personal', 'Mind', 'Health', 'Relationships', 'Finance', 'Learning', 'Other']
const tagTone: Record<Goal['tag'], string> = {
  Work: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200',
  Personal: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200',
  Mind: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200',
  Health: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200',
  Relationships: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200',
  Finance: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200',
  Learning: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-200',
  Other: 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
}

type GoalCardProps = {
  goal: Goal
  updateGoal: (id: Goal['id'], updates: Partial<Goal>) => Promise<Goal>
  addNote: (id: Goal['id'], text: string) => Promise<Goal>
  onError: (message: string) => void
}

const GoalCard = ({ goal, updateGoal, addNote, onError }: GoalCardProps) => {
  const [progress, setProgress] = useState(goal.progress)
  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)

  useEffect(() => setProgress(goal.progress), [goal.progress])

  const saveProgress = async () => {
    if (progress === goal.progress) return
    try { await updateGoal(goal.id, { progress }) } catch (error) { onError(error instanceof Error ? error.message : 'Unable to update progress.') }
  }

  const submitNote = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!note.trim()) return
    setSavingNote(true)
    try {
      await addNote(goal.id, note)
      setNote('')
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Unable to save progress note.')
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <article className="rounded-lg border border-violet-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-black ${tagTone[goal.tag]}`}>{goal.tag}</span>
            <span className="text-xs font-black uppercase text-slate-400">{goal.period} goal</span>
          </div>
          <h3 className="mt-3 text-xl font-black text-slate-950 dark:text-white">{goal.title}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Milestone: {goal.milestone || 'No milestone defined yet.'}</p>
        </div>
        <select value={goal.status} onChange={(event) => updateGoal(goal.id, { status: event.target.value as Goal['status'] }).catch((error) => onError(error.message))} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-black text-violet-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-violet-200">
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <input type="range" min="0" max="100" step="5" value={progress} onChange={(event) => setProgress(Number(event.target.value))} onPointerUp={saveProgress} onKeyUp={saveProgress} onBlur={saveProgress} className="h-2 flex-1 accent-violet-600" aria-label={`Progress for ${goal.title}`} />
        <span className="w-14 text-right text-2xl font-black">{progress}%</span>
      </div>

      <div className="mt-6 border-t border-violet-100 pt-5 dark:border-slate-800">
        <h4 className="font-black text-slate-950 dark:text-white">Daily progress notes</h4>
        <form onSubmit={submitNote} className="mt-3 flex flex-col gap-3 sm:flex-row">
          <textarea value={note} onChange={(event) => setNote(event.target.value)} className="min-h-20 flex-1 resize-none rounded-lg border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700" placeholder="What did you do toward this goal today?" />
          <button type="submit" disabled={savingNote || !note.trim()} className="self-end rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-50">{savingNote ? 'Saving...' : 'Add note'}</button>
        </form>
        <div className="mt-4 grid gap-3">
          {[...goal.notes].reverse().slice(0, 3).map((entry) => (
            <div key={entry.id} className="border-l-2 border-violet-300 pl-4">
              <p className="text-xs font-black uppercase text-violet-500">{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(entry.date))}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{entry.text}</p>
            </div>
          ))}
          {!goal.notes.length && <p className="text-sm text-slate-400">No progress notes yet.</p>}
        </div>
      </div>
    </article>
  )
}

const GoalsView = () => {
  const { goals, loading, error, refresh, updateGoal, addNote } = useGoals()
  const [period, setPeriod] = useState<Goal['period']>('Day')
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState({ title: '', period: 'Week' as Goal['period'], tag: 'Personal' as Goal['tag'], milestone: '' })
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState('')
  const visibleGoals = goals.filter((goal) => goal.period === period)
  const completed = goals.filter((goal) => goal.status === 'Completed').length
  const average = goals.length ? Math.round(goals.reduce((sum, goal) => sum + goal.progress, 0) / goals.length) : 0

  const createGoal = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setActionError('')
    try {
      await apiRequest('/api/goals', { method: 'POST', body: JSON.stringify(form) })
      await refresh()
      setPeriod(form.period)
      setForm({ title: '', period: 'Week', tag: 'Personal', milestone: '' })
      setFormOpen(false)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to create goal.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div><h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Milestone and Target Goals</h2><p className="mt-1 text-slate-500 dark:text-slate-400">Organize meaningful goals and capture daily evidence of progress.</p></div>
        <button type="button" onClick={() => setFormOpen((open) => !open)} className="rounded-lg bg-violet-500 px-5 py-3 font-black text-white">{formOpen ? 'Cancel' : 'New Goal'}</button>
      </section>

      {formOpen && (
        <form onSubmit={createGoal} className="grid gap-4 rounded-lg border border-violet-100 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold">Goal title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700" placeholder="Run my first 10K" /></label>
          <label className="grid gap-2 text-sm font-bold">Milestone<input value={form.milestone} onChange={(event) => setForm({ ...form, milestone: event.target.value })} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-700" placeholder="Complete three training runs this week" /></label>
          <label className="grid gap-2 text-sm font-bold">Time horizon<select value={form.period} onChange={(event) => setForm({ ...form, period: event.target.value as Goal['period'] })} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-slate-700">{periods.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          <label className="grid gap-2 text-sm font-bold">Category tag<select value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value as Goal['tag'] })} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none dark:border-slate-700">{tags.map((tag) => <option key={tag} value={tag}>{tag}</option>)}</select></label>
          <button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-60 lg:col-span-2 lg:justify-self-end">{saving ? 'Saving...' : 'Create goal'}</button>
        </form>
      )}

      {(error || actionError) && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{actionError || error}</p>}

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-lg bg-violet-100 p-5 dark:bg-violet-500/15"><p className="text-sm font-black text-violet-700 dark:text-violet-200">Completed Goals</p><p className="mt-2 text-4xl font-black">{completed}</p></article>
        <article className="rounded-lg bg-rose-100 p-5 dark:bg-rose-500/15"><p className="text-sm font-black text-rose-700 dark:text-rose-200">Active Goals</p><p className="mt-2 text-4xl font-black">{goals.length - completed}</p></article>
        <article className="rounded-lg bg-sky-100 p-5 dark:bg-sky-500/15"><p className="text-sm font-black text-sky-700 dark:text-sky-200">Average Progress</p><p className="mt-2 text-4xl font-black">{average}%</p></article>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-violet-100 pb-4 dark:border-slate-800">{periods.map((item) => <button key={item} type="button" onClick={() => setPeriod(item)} className={`rounded-lg px-4 py-2 text-sm font-black ${period === item ? 'bg-violet-500 text-white' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>{item} Goals</button>)}</div>

      {loading && <p className="text-sm font-bold text-violet-500">Loading your goals...</p>}
      <section className="grid gap-4">
        {!loading && !visibleGoals.length && <div className="rounded-lg border border-dashed border-violet-200 bg-white/60 p-10 text-center dark:border-slate-700 dark:bg-slate-900/60"><p className="font-black">No {period.toLowerCase()} goals yet</p><p className="mt-1 text-sm text-slate-500">Create one and add a small progress note today.</p></div>}
        {visibleGoals.map((goal) => <GoalCard key={goal.id} goal={goal} updateGoal={updateGoal} addNote={addNote} onError={setActionError} />)}
      </section>
    </div>
  )
}

export default GoalsView
