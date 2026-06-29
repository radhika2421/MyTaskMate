import { useMemo, useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import type { Task, TaskStatus } from '../types'

type TaskFilter = 'All' | TaskStatus | 'Overdue'
const filters: TaskFilter[] = ['All', 'Pending', 'In Progress', 'Overdue', 'Completed']

const dateKey = (date: string) => new Date(date).toISOString().slice(0, 10)
const todayKey = () => new Date().toLocaleDateString('en-CA')
const isOverdue = (task: Task) => task.status !== 'Completed' && dateKey(task.dueDate) < todayKey()

const Tasks = () => {
  const [filter, setFilter] = useState<TaskFilter>('All')
  const [actionError, setActionError] = useState('')
  const [updatingId, setUpdatingId] = useState<Task['id'] | null>(null)
  const { tasks, loading, error, updateTask } = useTasks()

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (filter === 'All') return true
    if (filter === 'Overdue') return isOverdue(task)
    return task.status === filter
  }), [filter, tasks])

  const update = async (task: Task, changes: Partial<Task>) => {
    setUpdatingId(task.id)
    setActionError('')
    try {
      await updateTask(task.id, changes)
    } catch (requestError) {
      setActionError(requestError instanceof Error ? requestError.message : 'Unable to update task.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="grid gap-7">
      <section>
        <h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Task Repository</h2>
        <p className="mt-1 text-slate-500 dark:text-slate-400">All tasks, completed work, overdue items, and pending next actions.</p>
      </section>

      <div className="flex flex-wrap gap-2 border-b border-violet-100 pb-4 dark:border-slate-800">
        {filters.map((item) => (
          <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-lg px-4 py-2 text-sm font-black ${filter === item ? 'bg-violet-500 text-white' : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300'}`}>{item}</button>
        ))}
      </div>

      {(error || actionError) && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">{actionError || error}</p>}
      {loading && <p className="text-sm font-bold text-violet-500">Loading your tasks...</p>}

      <section className="grid gap-4">
        {!loading && !filteredTasks.length && (
          <div className="rounded-lg border border-dashed border-violet-200 bg-white/60 p-10 text-center dark:border-slate-700 dark:bg-slate-900/60">
            <p className="font-black">No tasks in this view</p>
            <p className="mt-1 text-sm text-slate-500">Use Add Task in the header to create one.</p>
          </div>
        )}
        {filteredTasks.map((task) => (
          <article key={task.id} className="grid gap-4 rounded-lg border border-violet-100 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-black uppercase text-violet-500">{task.project}</p>
                {isOverdue(task) && <span className="rounded-full bg-rose-100 px-2 py-1 text-xs font-black text-rose-700 dark:bg-rose-500/15 dark:text-rose-200">Overdue</span>}
              </div>
              <h3 className={`mt-1 text-lg font-black text-slate-950 dark:text-white ${task.status === 'Completed' ? 'line-through opacity-60' : ''}`}>{task.title}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{task.nextAction || 'No next action added.'}</p>
              <p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                {new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(task.dueDate))}{task.time ? ` at ${task.time}` : ''}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-sm font-black text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                <input type="checkbox" checked={task.priority === 'High'} disabled={updatingId === task.id} onChange={(event) => update(task, { priority: event.target.checked ? 'High' : 'Medium' })} className="h-4 w-4 accent-rose-500" />
                High priority
              </label>
              <label className="sr-only" htmlFor={`task-status-${task.id}`}>Task status</label>
              <select id={`task-status-${task.id}`} value={task.status} disabled={updatingId === task.id} onChange={(event) => update(task, { status: event.target.value as TaskStatus })} className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm font-black text-violet-700 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-violet-200">
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </article>
        ))}
      </section>
    </div>
  )
}

export default Tasks
