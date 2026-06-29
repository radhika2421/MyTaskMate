import { fallbackInsights, useProductivityReport } from '../hooks/useProductivityReport'

const InsightsView = () => {
  const { report, loading, error, recalculate } = useProductivityReport()
  const insights = report?.insights || fallbackInsights
  const metrics = [
    { label: 'Best focus window', value: report?.metrics.bestFocusWindow || '--', detail: report?.metrics.totalFocusSessions ? `Based on ${report.metrics.totalFocusSessions} recent sessions` : 'Based on completed focus work', tone: 'bg-violet-100 dark:bg-violet-500/15' },
    { label: 'On-time completion', value: report ? (report.metrics.onTimeCompletionRate === null ? '--' : `${report.metrics.onTimeCompletionRate}%`) : '0%', detail: report?.metrics.onTimeCompletionRate === null ? 'Complete timed tasks to establish a rate' : 'Using recorded completion timestamps', tone: 'bg-emerald-100 dark:bg-emerald-500/15' },
    { label: 'Average focus', value: report ? `${report.metrics.averageFocusMinutes} min` : '---', detail: report?.metrics.totalFocusSessions ? 'Across recent focus sessions' : 'Per active work session', tone: 'bg-sky-100 dark:bg-sky-500/15' },
    { label: 'Deadlines missed', value: report?.metrics.deadlinesMissed ?? 0, detail: 'Currently overdue tasks', tone: 'bg-rose-100 dark:bg-rose-500/15' },
  ]

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-sm font-black uppercase text-violet-600 dark:text-violet-300">Pattern intelligence</p><h2 className="mt-1 text-3xl font-black text-slate-950 dark:text-white">Productivity insights</h2><p className="mt-2 text-slate-500 dark:text-slate-400">Verified metrics and AI interpretation from your tasks, goals, habits, focus sessions, profile, and calendar.</p></div>
        <button type="button" onClick={recalculate} disabled={loading} className="rounded-lg bg-violet-600 px-5 py-3 text-sm font-black text-white disabled:opacity-60">{loading ? 'Analysing...' : 'Recalculate with AI'}</button>
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map((metric) => <article key={metric.label} className={`rounded-lg p-5 ${metric.tone}`}><p className="text-sm font-black text-slate-600 dark:text-slate-300">{metric.label}</p><p className="mt-3 text-3xl font-black text-slate-950 dark:text-white">{metric.value}</p><p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{metric.detail}</p></article>)}</section>

      <section className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
        <article className="rounded-lg border border-violet-100 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-3"><h3 className="text-lg font-black">AI recommendations</h3><span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700 dark:bg-violet-500/15 dark:text-violet-200">{report?.source === 'gemini' ? 'Gemini' : 'Fallback'}</span></div>
          <div className="mt-5 space-y-3">{!(insights.length) ? <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-600 text-xs font-black text-white">insights[0]</span> :
            insights.map((insight, index) => <div key={`${index}-${insight}`} className="flex gap-3 rounded-lg bg-[#fbf7f2] p-4 dark:bg-slate-950"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-violet-600 text-xs font-black text-white">{index + 1}</span><p className="text-sm leading-6 text-slate-600 dark:text-slate-300">{insight}</p></div>)
          }</div>
        </article>
        <article className="rounded-lg border border-violet-100 bg-white/85 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"><h3 className="text-lg font-black">Consistency signal</h3><div className="mt-8 grid place-items-center"><div className="grid h-40 w-40 place-items-center rounded-full border-14px border-violet-200 text-center dark:border-violet-500/30"><div><p className="text-4xl font-black">{report?.metrics.habitScore ?? 0}%</p><p className="text-xs font-bold text-slate-500">habit score</p></div></div></div></article>
      </section>
    </div>
  )
}

export default InsightsView
