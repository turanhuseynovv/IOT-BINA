import { cn } from '../../lib/utils'

const STATUS_CONFIG = {
  success: {
    dot: 'bg-success',
    text: 'text-success',
    bg: 'bg-success/10',
    border: 'border-success/20',
  },
  warning: {
    dot: 'bg-warning',
    text: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/20',
  },
  danger: {
    dot: 'bg-danger',
    text: 'text-danger',
    bg: 'bg-danger/10',
    border: 'border-danger/20',
  },
  neutral: {
    dot: 'bg-text-secondary',
    text: 'text-text-secondary',
    bg: 'bg-bg-card-alt',
    border: 'border-border-subtle',
  },
}

export default function StatusBadge({ status = 'neutral', label, className = '' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.neutral

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-badge text-xs font-medium border',
        config.bg,
        config.text,
        config.border,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {label}
    </span>
  )
}
