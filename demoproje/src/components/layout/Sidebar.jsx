import { NavLink } from 'react-router-dom'
import { NAV_ITEMS, SETTINGS_NAV } from '../../lib/constants'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

export default function Sidebar({ isOpen, setIsOpen }) {
  const closeSidebar = () => setIsOpen(false)

  return (
    <aside className={cn(
      "fixed top-0 left-0 w-sidebar h-screen bg-bg-primary border-r border-border-subtle flex flex-col z-40 transition-transform duration-300 ease-in-out md:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      {/* Logo & Close Button */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <img src="/building-logo.svg" alt="Akıllı Bina" className="w-8 h-8" />
          <div>
            <span className="text-sm font-semibold text-text-primary block leading-tight">Ana Bina</span>
            <span className="text-[10px] text-text-secondary leading-tight">IoT Takip Sistemi</span>
          </div>
        </div>
        <button onClick={closeSidebar} className="md:hidden p-1 text-text-secondary hover:text-text-primary hover:bg-bg-card-alt rounded-btn transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={closeSidebar}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-btn text-sm font-medium transition-colors duration-150',
                isActive
                  ? 'text-text-primary bg-accent/[0.08] border-l-[3px] border-accent -ml-px'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-alt border-l-[3px] border-transparent -ml-px'
              )
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings (pinned to bottom) */}
      <div className="px-3 py-3 border-t border-border-subtle">
        <NavLink
          to={SETTINGS_NAV.path}
          onClick={closeSidebar}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-btn text-sm font-medium transition-colors duration-150',
              isActive
                ? 'text-text-primary bg-accent/[0.08] border-l-[3px] border-accent -ml-px'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-alt border-l-[3px] border-transparent -ml-px'
            )
          }
        >
          <SETTINGS_NAV.icon size={18} />
          <span>{SETTINGS_NAV.label}</span>
        </NavLink>
      </div>
    </aside>
  )
}
