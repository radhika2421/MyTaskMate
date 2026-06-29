import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../api'

const activities = ['Study', 'Workout', 'Read', 'Deep work', 'Custom'] as const
const durations = [10, 25, 45, 60]

const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

const FocusTimer = () => {
  const [activity, setActivity] = useState<(typeof activities)[number]>('Study')
  const [customActivity, setCustomActivity] = useState('')
  const [duration, setDuration] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(duration * 60)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const deadlineRef = useRef<number | null>(null)
  const recordedRef = useRef(false)

  const focusName = useMemo(
    () => (activity === 'Custom' ? customActivity.trim() || 'Custom focus' : activity),
    [activity, customActivity],
  )

  const recordSession = useCallback((focusedSeconds: number, wasCompleted: boolean) => {
    if (recordedRef.current || focusedSeconds < 1) return
    recordedRef.current = true
    apiRequest('/api/focus-sessions', {
      method: 'POST',
      body: JSON.stringify({ activity: focusName, plannedMinutes: duration, focusedSeconds, completed: wasCompleted }),
    }).then(() => window.dispatchEvent(new Event('focus-sessions:changed'))).catch(() => { recordedRef.current = false })
  }, [duration, focusName])

  useEffect(() => {
    if (!sessionOpen || !running) return

    const tick = () => {
      if (!deadlineRef.current) return
      const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))
      setSecondsLeft(next)
      if (next === 0) {
        recordSession(duration * 60, true)
        setRunning(false)
        setCompleted(true)
        deadlineRef.current = null
      }
    }

    tick()
    const interval = window.setInterval(tick, 250)
    return () => window.clearInterval(interval)
  }, [duration, recordSession, running, sessionOpen])

  useEffect(() => {
    if (!sessionOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [sessionOpen])

  useEffect(() => {
    if (!sessionOpen) return
    const previousTitle = document.title
    document.title = `${formatTime(secondsLeft)} - ${focusName}`
    return () => { document.title = previousTitle }
  }, [focusName, secondsLeft, sessionOpen])

  const startSession = () => {
    const seconds = duration * 60
    setSecondsLeft(seconds)
    setCompleted(false)
    recordedRef.current = false
    setSessionOpen(true)
    setRunning(true)
    deadlineRef.current = Date.now() + seconds * 1000
  }

  const togglePause = () => {
    if (running) {
      setRunning(false)
      deadlineRef.current = null
    } else {
      deadlineRef.current = Date.now() + secondsLeft * 1000
      setRunning(true)
    }
  }

  const restart = () => {
    const seconds = duration * 60
    setSecondsLeft(seconds)
    setCompleted(false)
    recordedRef.current = false
    setRunning(true)
    deadlineRef.current = Date.now() + seconds * 1000
  }

  const finish = () => {
    if (!completed) recordSession(duration * 60 - secondsLeft, false)
    setRunning(false)
    setSessionOpen(false)
    setCompleted(false)
    deadlineRef.current = null
    setSecondsLeft(duration * 60)
  }

  return (
    <>
      <section className="rounded-lg border border-violet-100 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div>
          <h2 className="text-lg font-black text-slate-950 dark:text-white">Focus timer</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Start a short, distraction-free session.</p>
        </div>

        <label className="mt-5 grid gap-2 text-xs font-black uppercase text-slate-500 dark:text-slate-400">
          Activity
          <select value={activity} onChange={(event) => setActivity(event.target.value as (typeof activities)[number])} className="rounded-lg border border-violet-100 bg-white px-3 py-3 text-sm font-bold normal-case text-slate-800 outline-none focus:border-violet-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
            {activities.map((item) => <option key={item}>{item}</option>)}
          </select>
        </label>

        {activity === 'Custom' && (
          <input value={customActivity} onChange={(event) => setCustomActivity(event.target.value)} className="mt-3 w-full rounded-lg border border-violet-100 bg-transparent px-3 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700" placeholder="Name this focus task" />
        )}

        <div className="mt-4">
          <p className="text-xs font-black uppercase text-slate-500 dark:text-slate-400">Duration</p>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {durations.map((minutes) => (
              <button key={minutes} type="button" onClick={() => { setDuration(minutes); setSecondsLeft(minutes * 60) }} className={`h-10 rounded-lg text-sm font-black ${duration === minutes ? 'bg-violet-600 text-white' : 'bg-violet-50 text-violet-700 dark:bg-slate-950 dark:text-violet-200'}`}>{minutes}m</button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-500/10">
          <div><p className="text-xs font-black uppercase text-amber-700 dark:text-amber-200">Focus target</p><p className="mt-1 font-black text-slate-900 dark:text-white">{focusName}</p></div>
          <span className="text-xl font-black text-amber-700 dark:text-amber-200">{formatTime(duration * 60)}</span>
        </div>
        <button type="button" onClick={startSession} className="mt-4 w-full rounded-lg bg-violet-600 px-4 py-3 font-black text-white shadow-lg shadow-violet-200 dark:shadow-none">Start focus block</button>
      </section>

      {sessionOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-label={`${focusName} focus timer`}>
          <section className="max-h-[calc(100svh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-violet-300/30 bg-[#fffdfb] p-4 text-center shadow-2xl dark:bg-slate-950 sm:p-10">
            <div className="mx-auto flex max-w-md items-center justify-between gap-4">
              <div className="text-left"><p className="text-xs font-black uppercase text-violet-500">Focus session</p><h2 className="mt-1 text-2xl font-black text-slate-950 dark:text-white">{focusName}</h2></div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${completed ? 'bg-emerald-100 text-emerald-700' : running ? 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-200' : 'bg-amber-100 text-amber-700'}`}>{completed ? 'Complete' : running ? 'Focusing' : 'Paused'}</span>
            </div>

            <div className="mx-auto mt-7 grid aspect-square w-[min(16rem,74vw)] place-items-center rounded-full border-[12px] border-violet-200 bg-white shadow-inner dark:border-violet-500/25 dark:bg-slate-900 sm:mt-10 sm:w-72 sm:border-[14px]">
              <div>
                <p className="font-mono text-5xl font-black text-slate-950 dark:text-white min-[380px]:text-6xl sm:text-7xl">{formatTime(secondsLeft)}</p>
                <p className="mt-3 text-sm font-bold text-slate-500">{completed ? 'Session complete' : running ? 'Stay with this one thing' : 'Your time is held'}</p>
              </div>
            </div>

            {completed ? (
              <div className="mt-10"><p className="text-lg font-black text-emerald-700 dark:text-emerald-300">Nice work. That block is complete.</p><button type="button" onClick={finish} className="mt-5 rounded-lg bg-emerald-600 px-8 py-3 font-black text-white">Done</button></div>
            ) : (
              <div className="mt-7 grid gap-3 min-[420px]:flex min-[420px]:flex-wrap min-[420px]:justify-center sm:mt-10">
                <button type="button" onClick={togglePause} className="min-w-32 rounded-lg bg-violet-600 px-6 py-3 font-black text-white">{running ? 'Pause' : 'Resume'}</button>
                <button type="button" onClick={restart} className="rounded-lg border border-violet-200 px-6 py-3 font-black text-violet-700 dark:border-slate-700 dark:text-violet-200">Restart</button>
                <button type="button" onClick={finish} className="rounded-lg border border-rose-200 px-6 py-3 font-black text-rose-600 dark:border-rose-900 dark:text-rose-300">End session</button>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  )
}

export default FocusTimer
