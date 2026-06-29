import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api'
import type { Goal } from '../types'

type StoredGoal = Omit<Goal, 'id' | 'notes'> & {
  _id: string
  notes: Array<{ _id: string; text: string; date: string }>
}

const normalize = ({ _id, notes, ...goal }: StoredGoal): Goal => ({
  ...goal,
  id: _id,
  notes: notes.map(({ _id: noteId, ...note }) => ({ ...note, id: noteId })),
})

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<{ goals: StoredGoal[] }>('/api/goals')
      setGoals(data.goals.map(normalize))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load goals.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  const updateGoal = async (id: Goal['id'], updates: Partial<Goal>) => {
    const data = await apiRequest<{ goal: StoredGoal }>(`/api/goals/${id}`, { method: 'PATCH', body: JSON.stringify(updates) })
    const updated = normalize(data.goal)
    setGoals((current) => current.map((goal) => (goal.id === id ? updated : goal)))
    return updated
  }

  const addNote = async (id: Goal['id'], text: string) => {
    const data = await apiRequest<{ goal: StoredGoal }>(`/api/goals/${id}/notes`, { method: 'POST', body: JSON.stringify({ text }) })
    const updated = normalize(data.goal)
    setGoals((current) => current.map((goal) => (goal.id === id ? updated : goal)))
    return updated
  }

  return { goals, loading, error, refresh, updateGoal, addNote }
}
