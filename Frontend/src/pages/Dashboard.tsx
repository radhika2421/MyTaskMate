import FocusTimer from '../components/FocusTimer'
import { useHabits } from '../hooks/useHabits'
import { useTasks } from '../hooks/useTasks'
import { useProductivityReport } from '../hooks/useProductivityReport'

const Dashboard = () => {
  const { tasks, updateTask, loading: tasksLoading } = useTasks()
  const { habits, loading: habitsLoading } = useHabits()
  const { report, loading: reportLoading } = useProductivityReport()
  const today = new Date().toLocaleDateString('en-CA')
  const dueToday = tasks.filter((task) => new Date(task.dueDate).toISOString().slice(0, 10) === today)
  const highPriority = tasks.filter((task) => task.priority === 'High' && task.status !== 'Completed')
  const currentStreak = habits.length ? Math.round(habits.reduce((total, habit) => total + habit.score, 0) / habits.length) : 0
  const completedToday = dueToday.filter((task) => task.status === 'Completed').length
  const quote = report?.quote || { text: 'Your mind is for having ideas, not holding them.', author: 'David Allen' }
  const timeline = report?.timeline.length ? report.timeline : null

  return (
    <div className="grid gap-7">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 dark:text-white sm:text-3xl">Your Daily Focus Space</h2>
          <p className="mt-1 text-slate-500 dark:text-slate-400">Plan actions, protect focus blocks, and finish before deadlines.</p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Tasks due today', report?.metrics.dueToday ?? dueToday.length, `${report?.metrics.completedToday ?? completedToday} completed`, 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-200'],
          ['High priority tasks', report?.metrics.highPriorityOpen ?? highPriority.length, 'Need focused action', 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-200'],
          ['Current streak', report ? `${report.metrics.currentStreakDays} days` : `${currentStreak}%`, report ? 'Consecutive habit check-in days' : 'Habit consistency score', 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200'],
        ].map(([label, value, note, tone]) => (
          <article key={label} className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className={`mb-4 grid h-12 w-12 place-items-center rounded-2xl text-lg font-black ${tone}`}>*</div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
            <p className="mt-2 text-4xl font-black text-slate-950 dark:text-white">{value}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{note}</p>
          </article>
        ))}
      </section>

      {(tasksLoading || habitsLoading || reportLoading) && <p className="text-sm font-bold text-violet-500">Syncing your productivity data...</p>}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr_1fr]">
        <div className="grid gap-6">
          <article className="rounded-3xl border border-violet-100 bg-violet-50/80 p-6 dark:border-violet-500/20 dark:bg-violet-500/10">
            <p className="text-3xl text-violet-500">"</p>
            <p className="mt-2 text-lg font-semibold italic text-slate-800 dark:text-slate-100">
              {quote.text}
            </p>
            <p className="mt-3 text-right text-sm font-bold text-slate-500 dark:text-slate-400">{quote.author}</p>
          </article>
          <FocusTimer />
        </div>

        <article className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">Scheduled Timeline</h3>
          <div className="mt-5 grid gap-4">
            {timeline ?
              timeline.map((item) => (
              <div key={item.id} className="flex gap-4 rounded-2xl bg-[#f7f0ff] p-4 dark:bg-slate-950">
                <span className="w-20 text-sm font-black text-violet-600 dark:text-violet-300">{item.time}</span>
                <div>
                  <p className="font-black text-slate-900 dark:text-white">{item.title}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{item.type}</p>
                </div>
              </div>
            )) : <p className="font-black text-slate-900 dark:text-white">Nothing to show</p>}
          </div>
        </article>

        <article className="rounded-3xl border border-violet-100 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black text-slate-950 dark:text-white">Today&apos;s Focus Tasks</h3>
            <span className="text-sm font-black text-slate-400">{completedToday}/{dueToday.length} done</span>
          </div>
          <div className="mt-5 grid gap-3">
            {dueToday.map((task) => (
              <label key={task.id} className="flex gap-3 rounded-2xl bg-rose-50 p-4 dark:bg-slate-950">
                <input
                  type="checkbox"
                  checked={task.status === 'Completed'}
                  onChange={(event) => updateTask(task.id, { status: event.target.checked ? 'Completed' : 'Pending' })}
                  className="mt-1 h-5 w-5 accent-violet-500"
                />
                <span>
                  <span className="block font-black text-slate-900 dark:text-white">{task.title}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{task.nextAction}</span>
                </span>
              </label>
            ))}
            {!tasksLoading && !dueToday.length && <p className="rounded-lg bg-[#fbf7f2] p-4 text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">No tasks due today.</p>}
          </div>
        </article>
      </section>
    </div>
  )
}

export default Dashboard
