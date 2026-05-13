import { useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { Bell, LogOut, Moon, Sun, Leaf, Menu } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme, THEMES } from '../../hooks/useTheme'
import { PAGE_TITLES } from '../../lib/constants'

const THEME_ICONS = {
  dark: Moon,
  light: Sun,
  nature: Leaf,
}

const THEME_COLORS = {
  dark: 'bg-[#1A1A24] text-[#94A3B8]',
  light: 'bg-[#F1F5F9] text-[#3B82F6]',
  nature: 'bg-[#F0F7EC] text-[#2E8B57]',
}

export default function Header({ onMenuClick }) {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { theme, cycleTheme } = useTheme()
  const [showNotifications, setShowNotifications] = useState(false)
  const notifRef = useRef(null)

  const pageTitle = PAGE_TITLES[location.pathname] || 'Ana Panel'
  const userEmail = user?.email || ''
  const userName = userEmail.split('@')[0] || 'Kullanıcı'

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const ThemeIcon = THEME_ICONS[theme] || Moon
  const themeInfo = THEMES[theme]

  // Get next theme info for tooltip
  const themeOrder = ['dark', 'light', 'nature']
  const nextIdx = (themeOrder.indexOf(theme) + 1) % themeOrder.length
  const nextTheme = THEMES[themeOrder[nextIdx]]

  return (
    <header className="h-header border-b border-border-subtle bg-bg-primary flex items-center justify-between px-4 md:px-6">
      {/* Left Side: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenuClick}
          className="md:hidden p-1.5 -ml-1.5 text-text-secondary hover:text-text-primary hover:bg-bg-card-alt rounded-btn transition-colors"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-text-primary">{pageTitle}</h1>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={cycleTheme}
          className="relative flex items-center gap-2 h-8 px-3 rounded-btn border border-border-subtle hover:bg-bg-card-alt transition-all duration-200"
          title={`Tema: ${themeInfo.label} → ${nextTheme.label}`}
          id="theme-toggle"
        >
          <ThemeIcon size={15} className="text-text-secondary" />
          <span className="text-xs font-medium text-text-secondary hidden sm:inline">
            {themeInfo.label}
          </span>
          {/* Active dot indicator */}
          <div className="flex gap-1">
            {themeOrder.map((t) => (
              <span
                key={t}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                  t === theme
                    ? t === 'dark'
                      ? 'bg-[#4F8EF7] scale-125'
                      : t === 'light'
                      ? 'bg-[#3B82F6] scale-125'
                      : 'bg-[#2E8B57] scale-125'
                    : 'bg-text-secondary opacity-30'
                }`}
              />
            ))}
          </div>
        </button>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`relative w-8 h-8 rounded-btn flex items-center justify-center transition-colors duration-150 ${showNotifications ? 'bg-bg-card-alt' : 'hover:bg-bg-card-alt'}`}
          >
            <Bell size={18} className="text-text-secondary" />
          </button>
          
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-64 bg-bg-card border border-border-subtle rounded-card shadow-lg z-50 animate-fade-in">
              <div className="p-3 border-b border-border-subtle">
                <h3 className="text-sm font-semibold text-text-primary">Bildirimler</h3>
              </div>
              <div className="p-4 text-center">
                <p className="text-xs text-text-secondary">Okunmamış bildiriminiz yok.</p>
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <span className="text-xs font-semibold text-accent uppercase">
              {userName.charAt(0)}
            </span>
          </div>
          <span className="text-sm text-text-secondary">{userName}</span>
        </div>

        {/* Logout */}
        <button
          onClick={signOut}
          className="w-8 h-8 rounded-btn flex items-center justify-center hover:bg-bg-card-alt transition-colors duration-150"
          title="Çıkış Yap"
        >
          <LogOut size={16} className="text-text-secondary" />
        </button>
      </div>
    </header>
  )
}
