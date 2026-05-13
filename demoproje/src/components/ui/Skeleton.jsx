import { cn } from '../../lib/utils'

const SKELETON_VARIANTS = {
  text: 'h-4 rounded',
  'text-lg': 'h-6 rounded',
  metric: 'h-10 w-24 rounded',
  card: 'h-32 rounded-card',
  chart: 'h-64 rounded-card',
  row: 'h-12 rounded',
  avatar: 'h-10 w-10 rounded-full',
  badge: 'h-5 w-16 rounded-badge',
}

export default function Skeleton({ variant = 'text', className = '', count = 1 }) {
  const baseClasses = 'animate-pulse-subtle bg-bg-card-alt'
  const variantClasses = SKELETON_VARIANTS[variant] || SKELETON_VARIANTS.text

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className={cn(baseClasses, variantClasses, className)} />
        ))}
      </div>
    )
  }

  return <div className={cn(baseClasses, variantClasses, className)} />
}
