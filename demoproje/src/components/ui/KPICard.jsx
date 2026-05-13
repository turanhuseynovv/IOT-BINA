import { ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '../../lib/utils'
import Skeleton from './Skeleton'

export default function KPICard({
  label,
  value,
  description,
  trend,
  trendDirection,
  icon: Icon,
  color,
  loading = false,
  className = '',
}) {
  if (loading) {
    return (
      <div className={cn('bg-bg-card border border-border-subtle rounded-card p-6', className)}>
        <Skeleton variant="text" className="w-24 mb-3" />
        <Skeleton variant="metric" className="mb-2" />
        <Skeleton variant="badge" />
      </div>
    )
  }

  const trendColor = trendDirection === 'up' ? 'text-success' : trendDirection === 'down' ? 'text-danger' : 'text-text-secondary'
  const TrendIcon = trendDirection === 'up' ? ArrowUp : trendDirection === 'down' ? ArrowDown : null

  return (
    <div className={cn('bg-bg-card border border-border-subtle rounded-card p-6', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-btn bg-bg-card-alt flex items-center justify-center">
            <Icon size={16} className="text-text-secondary" />
          </div>
        )}
      </div>
      <div className={cn('text-metric mb-2', color || 'text-text-primary')}>
        {value ?? '—'}
      </div>
      {description && (
        <div className="text-[11px] text-text-secondary -mt-1 mb-1">{description}</div>
      )}
      {trend != null && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
          {TrendIcon && <TrendIcon size={12} />}
          <span>{trend}%</span>
          <span className="text-text-secondary ml-1">bugün</span>
        </div>
      )}
    </div>
  )
}
