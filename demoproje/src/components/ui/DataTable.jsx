import { cn } from '../../lib/utils'
import Skeleton from './Skeleton'
import EmptyState from './EmptyState'

export default function DataTable({
  columns,
  data,
  onRowClick,
  loading = false,
  emptyMessage,
  emptyIcon,
  className = '',
  rowClassName,
}) {
  if (loading) {
    return (
      <div className={cn('bg-bg-card border border-border-subtle rounded-card overflow-hidden', className)}>
        <div className="px-4 py-3 border-b border-border-subtle">
          <Skeleton variant="text" className="w-48" />
        </div>
        <div className="p-4 space-y-2">
          <Skeleton variant="row" count={5} />
        </div>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className={cn('bg-bg-card border border-border-subtle rounded-card', className)}>
        <EmptyState
          icon={emptyIcon}
          title={emptyMessage || 'Veri bulunamadı'}
        />
      </div>
    )
  }

  return (
    <div className={cn('bg-bg-card border border-border-subtle rounded-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table>
          <thead>
            <tr className="border-b border-border-subtle">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wide"
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  'border-b border-border-subtle last:border-b-0 transition-colors duration-150',
                  onRowClick && 'cursor-pointer hover:bg-bg-card-alt',
                  typeof rowClassName === 'function' ? rowClassName(row) : rowClassName
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-sm text-text-primary">
                    {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
