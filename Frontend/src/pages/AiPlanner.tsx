import { useState } from 'react'
import { useGoals } from '../hooks/useGoals'
import { useHabits } from '../hooks/useHabits'
import { useTasks } from '../hooks/useTasks'
import { API_URL } from '../api'

type Message = { id: number; role: 'assistant' | 'user'; text: string }

const AiPlanner = () => {
  const { tasks } = useTasks()
  const { habits } = useHabits()
  const { goals } = useGoals()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: 'assistant',
      text: 'Tell me what changed: a new deadline, less time, low energy, or an urgent event. I will rebuild the plan around it.',
    },
  ])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [connection, setConnection] = useState<'ready' | 'gemini' | 'fallback'>('ready')
  const [connectionMessage, setConnectionMessage] = useState('')

  const sendMessage = async () => {
    const message = input.trim()
    if (!message || sending) return

    setMessages((current) => [...current, { id: Date.now(), role: 'user', text: message }])
    setInput('')
    setSending(true)

    try {
      const response = await fetch(`${API_URL}/api/ai/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, context: { tasks, goals, habits } }),
      })
      const data = await response.json()
      setConnection(data.source === 'gemini' ? 'gemini' : 'fallback')
      setConnectionMessage(data.message || '')
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', text: data.reply || 'I could not generate a plan yet. Try again in a moment.' },
      ])
    } catch {
      setConnection('fallback')
      setConnectionMessage('The backend could not be reached. Confirm that it is running on port 5000.')
      setMessages((current) => [
        ...current,
        { id: Date.now() + 1, role: 'assistant', text: 'The planner is offline right now. Protect the nearest deadline, then use one 25-minute focus block for the next action.' },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="flex min-h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-lg border border-violet-100 bg-white/85 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between border-b border-violet-100 px-4 py-4 dark:border-slate-800 sm:px-5">
        <div>
          <p className="text-sm font-black uppercase text-violet-600 dark:text-violet-300">AI coach and planner</p>
          <p className={`mt-1 text-xs font-bold ${connection === 'fallback' ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {connection === 'gemini' ? 'Gemini connected' : connection === 'fallback' ? 'Using offline fallback' : 'Gemini ready'}
          </p>
        </div>
        <button type="button" onClick={() => setMessages(messages.slice(0, 1))} className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-500 dark:border-slate-700" title="Clear conversation" aria-label="Clear conversation">x</button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto bg-[#fffdfb] p-4 dark:bg-slate-950/40 sm:p-5">
        {connectionMessage && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
            {connectionMessage}
          </p>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <article className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-7 sm:max-w-3xl sm:px-5 sm:py-4 ${message.role === 'user' ? 'bg-violet-600 text-white' : 'border border-violet-100 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'}`}>
              {message.text}
            </article>
          </div>
        ))}
        {sending && <p className="text-sm font-bold text-violet-500">Rebalancing your plan...</p>}
      </div>

      <div className="border-t border-violet-100 p-4 dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                sendMessage()
              }
            }}
            className="min-h-14 flex-1 resize-none rounded-lg border border-slate-200 bg-transparent px-4 py-3 text-sm outline-none focus:border-violet-500 dark:border-slate-700"
            placeholder="A client call moved to 2 PM. Rebalance my afternoon."
          />
          <button type="button" onClick={sendMessage} disabled={sending} className="h-12 rounded-lg bg-violet-600 px-5 font-black text-white disabled:opacity-60 sm:h-14">Send</button>
        </div>
      </div>
    </section>
  )
}

export default AiPlanner
