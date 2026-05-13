import { cn } from '../../lib/utils'

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={cn('flex items-center gap-0 border-b border-border-subtle overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium transition-colors duration-150 border-b-2 -mb-px',
            activeTab === tab.value
              ? 'text-accent border-accent'
              : 'text-text-secondary border-transparent hover:text-text-primary hover:border-border-subtle'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
