import { X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import taskmateIcon from '../assets/taskmateicon.png'
import { LayoutDashboard, CheckSquare, Calendar, Target, Bot, Flame, TrendingUp } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Tasks', path: '/tasks', icon: CheckSquare },
  { name: 'My Calendar', path: '/calendar', icon: Calendar },
  { name: 'Goals', path: '/goals', icon: Target },
  { name: 'AI Planner', path: '/ai-planner', icon: Bot },
  { name: 'Habits', path: '/habits', icon: Flame },
  { name: 'Insights', path: '/insights', icon: TrendingUp },
]

const Sidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const location = useLocation()

  return (
    <>
      {isOpen && <button type="button" onClick={onClose} className="fixed inset-0 z-20 bg-slate-950/45 lg:hidden" aria-label="Close navigation" />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[min(18rem,88vw)] shrink-0 flex-col overflow-y-auto border-r border-violet-100 bg-white/95 px-5 py-5 shadow-2xl shadow-violet-100/60 backdrop-blur transition-transform dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-none lg:sticky lg:inset-y-auto lg:left-auto lg:top-0 lg:h-screen lg:w-72 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-start justify-between gap-3">
      <Link to="/dashboard" onClick={onClose} className="flex items-center gap-3">
        <img src={taskmateIcon} alt="" className="h-12 w-12 object-contain" />
        <div>
          <p className="text-lg font-black text-slate-950 dark:text-white">MyTaskMate</p>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">AI productivity companion</p>
        </div>
      </Link>
      <button type="button" onClick={onClose} className="grid h-10 w-10 shrink-0 place-items-center text-slate-500 hover:text-violet-700 dark:text-slate-400 dark:hover:text-violet-300 lg:hidden" aria-label="Close sidebar" title="Close sidebar"><X size={20} aria-hidden="true" /></button>
      </div>

      <nav className="mt-10 grid gap-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path
          const Icon=item.icon;
          return (
            <Link key={item.name} to={item.path} onClick={onClose} className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-bold transition ${isActive ? 'bg-violet-100 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-500/30' : 'text-slate-600 hover:bg-rose-50 dark:text-slate-300 dark:hover:bg-slate-900'}`}>
              <Icon className="grid h-5 w-5 place-items-center rounded-lg bg-white text-xs shadow-sm dark:bg-slate-900" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-violet-100 bg-violet-50 p-4 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-black text-slate-950 dark:text-white">Focused Zone</p>
        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">Turn priorities into scheduled focus blocks with your AI companion.</p>
      </div>
      </aside>
    </>
  )
}

export default Sidebar
