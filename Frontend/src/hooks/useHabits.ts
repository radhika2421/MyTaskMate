import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api'
import type { Habit } from '../types'

type StoredHabit = Omit<Habit, 'id'> & { _id: string }
const normalize = ({ _id, ...habit }: StoredHabit): Habit => ({ ...habit, id: _id })

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<{ habits: StoredHabit[] }>('/api/habits')
      setHabits(data.habits.map(normalize))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load habits.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('habits:changed', refresh)
    return () => window.removeEventListener('habits:changed', refresh)
  }, [refresh])

  const updateHabit = async (id: Habit['id'], updates: Partial<Habit>) => {
    const data = await apiRequest<{ habit: StoredHabit }>(`/api/habits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    const updated = normalize(data.habit)
    setHabits((current) => current.map((habit) => (habit.id === id ? updated : habit)))
    window.dispatchEvent(new Event('habits:changed'))
    return updated
  }

  return { habits, loading, error, refresh, updateHabit }
}
