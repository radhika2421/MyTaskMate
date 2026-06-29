import { useEffect, useState } from 'react'
import { apiRequest } from '../api'

type TaskFormModalProps = {
  isOpen: boolean
  onClose: () => void
  onCreated: () => void
}

const emptyForm = { title: '', project: '', dueDate: '', timeHour: '', timeMinute: '00', timePeriod: 'AM', nextAction: '', highPriority: false }
const hours = Array.from({ length: 12 }, (_, index) => String(index + 1))
const minutes = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'))

const TaskFormModal = ({ isOpen, onClose, onCreated }: TaskFormModalProps) => {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm(emptyForm)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const hour = Number(form.timeHour)
      const time = form.timeHour
        ? `${String((hour % 12) + (form.timePeriod === 'PM' ? 12 : 0)).padStart(2, '0')}:${form.timeMinute}`
        : ''
      await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          project: form.project,
          dueDate: form.dueDate,
          time,
          nextAction: form.nextAction,
          priority: form.highPriority ? 'High' : 'Medium',
          status: 'Pending',
        }),
      })
      onCreated()
      onClose()
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to create task.')
    } finally {
      setSaving(false)
    }
  }

  const field = (name: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [name]: value }))

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4">
      <form onSubmit={submit} className="w-full max-w-xl rounded-lg bg-white p-6 shadow-2xl dark:bg-slate-950">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950 dark:text-white">Add new task</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Capture the deadline, priority, and next action.</p>
          </div>
          <button type="button" onClick={onClose} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-slate-800" aria-label="Close modal">x</button>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">Task title
            <input required value={form.title} onChange={(event) => field('title', event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-800" placeholder="Prepare sprint plan" />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">Project
            <input value={form.project} onChange={(event) => field('project', event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-800" placeholder="General" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">Due date
              <input required type="date" value={form.dueDate} onChange={(event) => field('dueDate', event.target.value)} className="rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-800" />
            </label>
            <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">Time
              <span className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <select value={form.timeHour} onChange={(event) => field('timeHour', event.target.value)} className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-violet-500 dark:border-slate-800 dark:bg-slate-950" aria-label="Hour">
                  <option value="">Hour</option>
                  {hours.map((hour) => <option key={hour} value={hour}>{hour}</option>)}
                </select>
                <select value={form.timeMinute} onChange={(event) => field('timeMinute', event.target.value)} disabled={!form.timeHour} className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-violet-500 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950" aria-label="Minute">
                  {minutes.map((minute) => <option key={minute} value={minute}>{minute}</option>)}
                </select>
                <select value={form.timePeriod} onChange={(event) => field('timePeriod', event.target.value)} disabled={!form.timeHour} className="rounded-lg border border-slate-200 bg-white px-3 py-3 outline-none focus:border-violet-500 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950" aria-label="AM or PM">
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </span>
            </label>
          </div>
          <label className="flex items-center gap-3 rounded-lg bg-rose-50 px-4 py-3 text-sm font-black text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
            <input type="checkbox" checked={form.highPriority} onChange={(event) => field('highPriority', event.target.checked)} className="h-5 w-5 accent-rose-500" />
            Mark as high priority
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 dark:text-slate-200">Next action
            <textarea value={form.nextAction} onChange={(event) => field('nextAction', event.target.value)} className="min-h-24 rounded-lg border border-slate-200 bg-transparent px-4 py-3 outline-none focus:border-violet-500 dark:border-slate-800" placeholder="What is the first concrete step?" />
          </label>
          {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-5 py-3 font-bold text-slate-600 dark:border-slate-800 dark:text-slate-300">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-violet-600 px-5 py-3 font-black text-white disabled:opacity-60">{saving ? 'Saving...' : 'Save task'}</button>
        </div>
      </form>
    </div>
  )
}

export default TaskFormModal
