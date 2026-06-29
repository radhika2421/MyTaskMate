import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api'
import type { Task } from '../types'

type StoredTask = Omit<Task, 'id'> & { _id: string }

const normalize = ({ _id, ...task }: StoredTask): Task => ({ ...task, id: _id })

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    try {
      const data = await apiRequest<{ tasks: StoredTask[] }>('/api/tasks')
      setTasks(data.tasks.map(normalize))
      setError('')
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load tasks.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener('tasks:changed', refresh)
    return () => window.removeEventListener('tasks:changed', refresh)
  }, [refresh])

  const updateTask = async (id: Task['id'], updates: Partial<Task>) => {
    const data = await apiRequest<{ task: StoredTask }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    })
    const updated = normalize(data.task)
    setTasks((current) => current.map((task) => (task.id === id ? updated : task)))
    window.dispatchEvent(new Event('tasks:changed'))
    return updated
  }

  return { tasks, loading, error, refresh, updateTask }
}
