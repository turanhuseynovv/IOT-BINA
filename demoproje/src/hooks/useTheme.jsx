import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext(null)

/**
 * Theme definitions:
 *  - dark   : Mevcut karanlık tema
 *  - light  : Beyaz/açık tema
 *  - nature : Yeşil-turuncu tonlu açık tema
 */
export const THEMES = {
  dark: {
    id: 'dark',
    label: 'Koyu',
    emoji: '🌙',
  },
  light: {
    id: 'light',
    label: 'Açık',
    emoji: '☀️',
  },
  nature: {
    id: 'nature',
    label: 'Doğa',
    emoji: '🌿',
  },
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app-theme') || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    // Remove all theme classes, then add the current one
    document.documentElement.classList.remove('theme-dark', 'theme-light', 'theme-nature')
    document.documentElement.classList.add(`theme-${theme}`)
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('app-theme', theme)
    } catch {
      // Ignore storage errors
    }
  }, [theme])

  function cycleTheme() {
    const order = ['dark', 'light', 'nature']
    const idx = order.indexOf(theme)
    const next = order[(idx + 1) % order.length]
    setTheme(next)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
