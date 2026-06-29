import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import TaskFormModal from './components/TaskFormModal'
import AiPlanner from './pages/AiPlanner'
import CalendarView from './pages/CalendarView'
import Dashboard from './pages/Dashboard'
import GoalsView from './pages/GoalsView'
import GoogleAuth from './pages/GoogleAuth'
import HabitsView from './pages/HabitsView'
import InsightsView from './pages/InsightsView'
import Profile from './pages/Profile'
import Tasks from './pages/Tasks'
import type { AuthUser } from './types'
import { API_URL } from './api'
import './App.css'

const AppShell = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    localStorage.getItem('mytaskmate-theme') === 'dark' ? 'dark' : 'light',
  )
  const [user, setUser] = useState<AuthUser | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('mytaskmate-theme', theme)
  }, [theme])

  const loadUser = useCallback(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) return null
        const data = await response.json()
        return data.user as AuthUser
      })
      .then(setUser)
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    loadUser()
    window.addEventListener('profile:changed', loadUser)
    return () => window.removeEventListener('profile:changed', loadUser)
  }, [loadUser])

  const logout = async () => {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    })
    setUser(null)
    navigate('/signup')
  }

  return (
    <div className="min-h-screen bg-[#fbf7f2] text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-screen">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="min-w-0 flex-1">
          <Header
            onAddTask={() => setTaskModalOpen(true)}
            onToggleSidebar={() => setSidebarOpen((value) => !value)}
            onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
            theme={theme}
            user={user}
            onLogout={logout}
          />
          <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">{children}</main>
        </div>
      </div>
      <TaskFormModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onCreated={() => window.dispatchEvent(new Event('tasks:changed'))}
      />
    </div>
  )
}

const App = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/signup" replace />} />
    <Route path="/signup" element={<GoogleAuth mode="signup" />} />
    <Route path="/login" element={<GoogleAuth mode="login" />} />
    <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
    <Route path="/tasks" element={<AppShell><Tasks /></AppShell>} />
    <Route path="/calendar" element={<AppShell><CalendarView /></AppShell>} />
    <Route path="/goals" element={<AppShell><GoalsView /></AppShell>} />
    <Route path="/ai-planner" element={<AppShell><AiPlanner /></AppShell>} />
    <Route path="/habits" element={<AppShell><HabitsView /></AppShell>} />
    <Route path="/insights" element={<AppShell><InsightsView /></AppShell>} />
    <Route path="/profile" element={<AppShell><Profile /></AppShell>} />
  </Routes>
)

export default App
