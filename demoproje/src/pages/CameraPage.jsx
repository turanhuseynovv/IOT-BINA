import { useState, useMemo } from 'react'
import { AlertTriangle, Trash2, Clock, Camera } from 'lucide-react'
import Modal from '../components/ui/Modal'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import KPICard from '../components/ui/KPICard'
import { formatDateTime, formatRelativeTime, cn } from '../lib/utils'
import { supabase } from '../lib/supabase'
import { useRealtimeTable } from '../hooks/useRealtimeTable'

export default function CameraPage() {
  const [selectedPhoto, setSelectedPhoto] = useState(null)

  // Fetch all outer camera events with realtime updates
  const { data: rawData, loading, setData } = useRealtimeTable('camera_events', {
    filterColumn: 'camera_type',
    filterValue: 'dis_kamera',
    order: 'captured_at',
    ascending: false,
  })

  // Sadece şüpheli (is_flagged = true) olanları göster
  const suspicious = useMemo(() => {
    return rawData ? rawData.filter(item => item.is_flagged === true) : null
  }, [rawData])

  const kpis = useMemo(() => {
    if (!suspicious) return {}
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayCount = suspicious.filter((e) => new Date(e.captured_at) >= today).length
    return { total: suspicious.length, today: todayCount }
  }, [suspicious])

  // Mark as not suspicious (updates DB so it doesn't come back on refresh, but keeps the record)
  async function handleRemove(event) {
    try {
      await supabase.from('camera_events').update({ is_flagged: false }).eq('id', event.id)
      setData(prev => prev ? prev.map(item => item.id === event.id ? { ...item, is_flagged: false } : item) : prev)
      setSelectedPhoto(null)
    } catch (err) { console.error(err) }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KPICard label="Toplam Şüpheli Tespit" value={kpis.total} icon={AlertTriangle} color="text-danger" loading={loading} />
        <KPICard label="Bugünkü Tespit" value={kpis.today} icon={Clock} loading={loading} />
      </div>

      {/* Suspicious Persons Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : suspicious && suspicious.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {suspicious.map((person) => (
            <button
              key={person.id}
              onClick={() => setSelectedPhoto(person)}
              className="bg-bg-card border border-danger/20 rounded-card overflow-hidden text-left hover:border-danger/40 transition-all duration-200 group"
            >
              <div className="relative w-full h-40 bg-bg-card-alt flex items-center justify-center overflow-hidden">
                <Camera size={28} className="text-text-secondary absolute" />
                {person.photo_url && (
                  <img 
                    src={person.photo_url} 
                    alt="Şüpheli" 
                    className={cn(
                      "w-full h-full object-cover relative z-10",
                      person.photo_url.includes('pravatar') && "grayscale-[80%] sepia-[.3] hue-rotate-[90deg] contrast-125 brightness-90 mix-blend-screen"
                    )}
                    onError={(e) => { e.target.style.display = 'none' }} 
                  />
                )}
              </div>
              <div className="p-3 space-y-2">
                <p className="text-[10px] text-text-secondary">
                  Tespit: {formatDateTime(person.captured_at)}
                </p>
                <p className="text-[10px] text-text-secondary">
                  {formatRelativeTime(person.captured_at)}
                </p>
                <div className="flex items-center justify-between">
                  <StatusBadge status="danger" label={`${person.flag_count || 1} işaret`} />
                  <span className="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">Detay →</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon={AlertTriangle} title="Şüpheli kişi tespit edilmedi" description="Dış kamera tarafından tespit edilen şüpheli kişi bulunmuyor." />
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selectedPhoto} onClose={() => setSelectedPhoto(null)} title="Şüpheli Şahıs Detayı" className="max-w-xl">
        {selectedPhoto && (
          <div className="space-y-4">
            <div className="relative w-full h-64 bg-bg-card-alt flex items-center justify-center rounded-btn overflow-hidden">
              <Camera size={48} className="text-text-secondary absolute" />
              {selectedPhoto.photo_url && (
                <img 
                  src={selectedPhoto.photo_url} 
                  alt="Detay" 
                  className={cn(
                    "w-full h-full object-cover relative z-10",
                    selectedPhoto.photo_url.includes('pravatar') && "grayscale-[80%] sepia-[.3] hue-rotate-[90deg] contrast-125 brightness-90 mix-blend-screen"
                  )}
                  onError={(e) => { e.target.style.display = 'none' }} 
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Tespit: {formatDateTime(selectedPhoto.captured_at)}</span>
              <StatusBadge status="danger" label={`${selectedPhoto.flag_count || 1} kez işaretlendi`} />
            </div>
            <button onClick={() => handleRemove(selectedPhoto)}
              className="w-full h-9 bg-danger/10 border border-danger/20 text-danger text-xs font-medium rounded-btn flex items-center justify-center gap-2 hover:bg-danger/20 transition-colors">
              <Trash2 size={14} /> Şüpheli Listesinden Kaldır
            </button>
          </div>
        )}
      </Modal>
    </div>
  )
}
