import { cn } from '../../lib/utils'
import { Inbox } from 'lucide-react'

export default function EmptyState({ icon: Icon = Inbox, title, description, className = '' }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-8', className)}>
      <div className="w-12 h-12 rounded-card bg-bg-card-alt flex items-center justify-center mb-4">
        <Icon size={24} className="text-text-secondary" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">
        {title || 'Veri bulunamadı'}
      </h3>
      <p className="text-xs text-text-secondary text-center max-w-xs">
        {description || 'Henüz bu bölümde görüntülenecek veri bulunmuyor.'}
      </p>
    </div>
  )
}
