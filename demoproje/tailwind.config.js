/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-card': 'var(--bg-card)',
        'bg-card-alt': 'var(--bg-card-alt)',
        'border-subtle': 'var(--border-subtle)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'accent': 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'danger': 'var(--danger)',
        'grid-line': 'var(--grid-line)',
      },
      fontFamily: {
        'inter': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '68': '17rem',
        '76': '19rem',
        '84': '21rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem',
      },
      fontSize: {
        'metric': ['2rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.025em' }],
        'metric-lg': ['2.5rem', { lineHeight: '1', fontWeight: '700', letterSpacing: '-0.025em' }],
      },
      borderRadius: {
        'card': '8px',
        'btn': '6px',
        'badge': '4px',
      },
      width: {
        'sidebar': '240px',
        'panel': '400px',
        'assistant-sidebar': '300px',
        'prediction-sidebar': '280px',
      },
      height: {
        'header': '64px',
      },
      transitionDuration: {
        '150': '150ms',
      },
    },
  },
  plugins: [],
}
