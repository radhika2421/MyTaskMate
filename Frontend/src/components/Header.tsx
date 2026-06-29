import { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { AuthUser } from '../types'
import Avatar from './Avatar'

type HeaderProps = {
  onAddTask: () => void
  onToggleTheme: () => void
  theme: 'light' | 'dark'
  onToggleSidebar: () => void
  user: AuthUser | null
  onLogout: () => void
}

const pageNames: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks',
  '/calendar': 'Calendar',
  '/goals': 'Goals',
  '/ai-planner': 'My AI Companion',
  '/habits': 'Habit Streak',
  '/insights': 'Insights',
  '/profile': 'Profile',
}

const Header = ({ onAddTask, onToggleTheme, theme, onToggleSidebar, user, onLogout }: HeaderProps) => {
  const location = useLocation()
  const navigate = useNavigate()

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      }).format(new Date()),
    [],
  )

  return (
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-violet-100 bg-white/85 px-2 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/90 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="grid h-9 w-9 place-items-center rounded-lg border border-violet-100 text-slate-700 dark:border-slate-800 dark:text-slate-200 sm:h-10 sm:w-10 lg:hidden"
          aria-label="Open menu"
        >
          <span aria-hidden="true">=</span>
        </button>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-lg font-black text-slate-950 dark:text-white sm:text-xl">MyTaskMate</p>
            <span className="hidden h-5 w-px bg-violet-100 dark:bg-slate-800 sm:block" />
            <p className="text-sm font-black text-violet-600 dark:text-violet-300">
              {pageNames[location.pathname] || 'MyTaskMate'}
            </p>
          </div>
          <p className="mt-1 text-xs font-bold text-slate-500 dark:text-slate-400">{today}</p>
          <h1 className="sr-only">
            {pageNames[location.pathname] || 'MyTaskMate'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          className="grid h-10 w-10 place-items-center rounded-lg border border-violet-100 bg-violet-50 text-sm font-black text-violet-700 dark:border-slate-800 dark:bg-slate-900 dark:text-violet-200 sm:h-auto sm:w-auto sm:px-3 sm:py-2 sm:font-bold"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          <span className="sm:hidden">{theme === 'dark' ? 'L' : 'D'}</span>
          <span className="hidden sm:inline">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
        <button
          type="button"
          onClick={() => navigate('/ai-planner')}
          className="rounded-lg border border-violet-100 px-3 py-2 text-sm font-bold text-violet-700 dark:border-slate-800 dark:text-violet-200"
        >
          <span className="sm:hidden">AI</span><span className="hidden sm:inline">Ask AI</span>
        </button>
        <button
          type="button"
          onClick={onAddTask}
          className="grid h-10 min-w-10 place-items-center rounded-lg bg-violet-500 px-3 text-sm font-black text-white shadow-lg shadow-violet-200 dark:shadow-none sm:px-4"
          aria-label="Add new task"
        >
          <span className="sm:hidden">+</span><span className="hidden sm:inline">Add Task</span>
        </button>
        <Link
          to="/profile"
          className="rounded-full ring-2 ring-white dark:ring-slate-900"
          title="Profile"
        >
          <Avatar avatar={user?.avatar} name={user?.displayName} />
        </Link>
        <button type="button" onClick={onLogout} className="hidden rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-500 dark:border-slate-800 dark:text-slate-400 md:inline-flex">
          Logout
        </button>
      </div>
    </header>
  )
}

export default Header
