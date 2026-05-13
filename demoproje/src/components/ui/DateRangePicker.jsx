import { cn } from '../../lib/utils'

export default function DateRangePicker({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  startLabel = 'Başlangıç',
  endLabel = 'Bitiş',
  className = '',
}) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-secondary">{startLabel}</label>
        <input
          type="date"
          value={startDate || ''}
          onChange={(e) => onStartChange(e.target.value)}
          className="w-40"
        />
      </div>
      <span className="text-text-secondary mt-5">—</span>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-text-secondary">{endLabel}</label>
        <input
          type="date"
          value={endDate || ''}
          onChange={(e) => onEndChange(e.target.value)}
          className="w-40"
        />
      </div>
    </div>
  )
}
