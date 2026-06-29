import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../api'
import type { ProductivityReport } from '../types'

export const fallbackInsights = [
  'No insights',
]

export const useProductivityReport = () => {
  const [report, setReport] = useState<ProductivityReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const recalculate = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest<ProductivityReport>('/api/ai/insights', { method: 'POST', body: '{}' })
      setReport(data)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to calculate productivity insights.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    recalculate()
    const events = ['tasks:changed', 'habits:changed', 'focus-sessions:changed', 'profile:changed']
    events.forEach((event) => window.addEventListener(event, recalculate))
    return () => events.forEach((event) => window.removeEventListener(event, recalculate))
  }, [recalculate])

  return { report, loading, error, recalculate }
}
