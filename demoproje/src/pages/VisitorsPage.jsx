import { useState, useMemo } from 'react'
import {
  Search, X, Camera, Clock, Users, UserCheck, UserPlus, Crown,
  RefreshCw, ChevronRight, Eye, Filter, Hash, CalendarDays
} from 'lucide-react'
import DataTable from '../components/ui/DataTable'
import KPICard from '../components/ui/KPICard'
import StatusBadge from '../components/ui/StatusBadge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import VisitorLineChart from '../components/charts/VisitorLineChart'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import Modal from '../components/ui/Modal'
import { formatDateTime, formatRelativeTime, cn } from '../lib/utils'

function classifyVisitor(visitCount) {
  if (visitCount >= 10) return { label: 'Düzenli', color: 'success', bg: 'bg-success/10', text: 'text-success', border: 'border-success/20' }
  if (visitCount >= 5) return { label: 'Sık', color: 'info', bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' }
  if (visitCount >= 2) return { label: 'Ara Sıra', color: 'warning', bg: 'bg-warning/10', text: 'text-warning', border: 'border-warning/20' }
  return { label: 'Tek Seferlik', color: 'default', bg: 'bg-bg-card-alt', text: 'text-text-secondary', border: 'border-border-subtle' }
}

export default function VisitorsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const [selectedVisitor, setSelectedVisitor] = useState(null)

  // Fetch from ziyaretler table (each row = one visit entry)
  const { data: rawVisits, loading } = useRealtimeTable('ziyaretler', {
    order: 'created_at',
    ascending: false,
  })

  // Group raw visits by kisi_id to build visitor profiles
  const visitors = useMemo(() => {
    if (!rawVisits || rawVisits.length === 0) return []
    const map = {}
    rawVisits.forEach((v) => {
      const kid = v.kisi_id
      if (!map[kid]) {
        map[kid] = {
          kisi_id: kid,
          visit_count: 0,
          first_seen_at: v.created_at || v.tarih,
          last_seen_at: v.created_at || v.tarih,
          photo_url: v.foto_url,
          visits: [],
        }
      }
      const ts = v.created_at || v.tarih
      const vDate = new Date(ts)
      
      const lastVisit = map[kid].visits.length > 0 ? map[kid].visits[map[kid].visits.length - 1] : null
      const lastVisitDate = lastVisit ? new Date(lastVisit.created_at || lastVisit.tarih) : null
      
      // En az 5 saat (5 * 60 * 60 * 1000 ms) fark varsa veya ilk ziyaretse ekle
      if (!lastVisitDate || (lastVisitDate - vDate) >= 18000000) {
        map[kid].visit_count++
        map[kid].visits.push(v)
      }

      if (ts < map[kid].first_seen_at) map[kid].first_seen_at = ts
      if (ts > map[kid].last_seen_at) map[kid].last_seen_at = ts
      if (v.foto_url) map[kid].photo_url = v.foto_url
    })
    return Object.values(map).sort((a, b) => new Date(b.last_seen_at) - new Date(a.last_seen_at))
  }, [rawVisits])

  // KPIs
  const kpis = useMemo(() => {
    if (!visitors.length) return {}
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const todayVisitors = visitors.filter((v) => new Date(v.last_seen_at) >= today)
    const returningCount = visitors.filter(v => v.visit_count >= 2).length
    const sorted = [...visitors].sort((a, b) => b.visit_count - a.visit_count)
    return {
      todayCount: todayVisitors.length,
      totalUnique: visitors.length,
      returnRate: visitors.length > 0 ? `%${Math.round((returningCount / visitors.length) * 100)}` : '%0',
      returningCount,
      topVisitor: sorted[0],
    }
  }, [visitors])

  // Classification stats
  const classStats = useMemo(() => {
    let regular = 0, frequent = 0, occasional = 0, once = 0
    visitors.forEach((v) => {
      if (v.visit_count >= 10) regular++
      else if (v.visit_count >= 5) frequent++
      else if (v.visit_count >= 2) occasional++
      else once++
    })
    return { regular, frequent, occasional, once }
  }, [visitors])

  // Top 5
  const top5 = useMemo(() =>
    [...visitors].sort((a, b) => b.visit_count - a.visit_count).slice(0, 5),
    [visitors]
  )

  // Hourly traffic (today, from raw visits)
  const hourlyData = useMemo(() => {
    if (!rawVisits) return []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: String(i).padStart(2, '0') + ':00', count: 0 }))
    rawVisits.forEach((v) => {
      const d = new Date(v.created_at || v.tarih)
      if (d >= today) hours[d.getHours()].count++
    })
    return hours
  }, [rawVisits])

  // Filtered visitors
  const filteredVisitors = useMemo(() => {
    let result = visitors
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((v) => String(v.kisi_id).includes(q))
    }
    if (dateFilter) {
      const fd = new Date(dateFilter); fd.setHours(0, 0, 0, 0)
      const nd = new Date(fd); nd.setDate(nd.getDate() + 1)
      result = result.filter((v) => { const d = new Date(v.last_seen_at); return d >= fd && d < nd })
    }
    if (classFilter !== 'all') {
      result = result.filter((v) => {
        const c = v.visit_count
        if (classFilter === 'regular') return c >= 10
        if (classFilter === 'frequent') return c >= 5 && c < 10
        if (classFilter === 'occasional') return c >= 2 && c < 5
        if (classFilter === 'once') return c === 1
        return true
      })
    }
    return result
  }, [visitors, searchQuery, dateFilter, classFilter])

  // Recent activity today
  const recentActivity = useMemo(() => {
    if (!rawVisits) return []
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return rawVisits.filter((v) => new Date(v.created_at || v.tarih) >= today).slice(0, 8)
  }, [rawVisits])

  const columns = [
    {
      key: 'kisi_id', label: 'Kişi ID', width: '100px',
      render: (val) => (
        <div className="flex items-center gap-2">
          <Hash size={10} className="text-text-secondary" />
          <span className="text-sm font-bold text-accent">{val}</span>
        </div>
      ),
    },
    {
      key: 'visit_count', label: 'Ziyaret', width: '130px',
      render: (val) => {
        const cls = classifyVisitor(val)
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-text-primary">{val}</span>
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded-full font-semibold', cls.bg, cls.text)}>{cls.label}</span>
          </div>
        )
      },
    },
    {
      key: 'first_seen_at', label: 'İlk Görülme', width: '150px',
      render: (val) => <span className="text-xs text-text-secondary">{formatDateTime(val)}</span>,
    },
    {
      key: 'last_seen_at', label: 'Son Görülme', width: '150px',
      render: (val) => (
        <div>
          <span className="text-xs text-text-primary block">{formatDateTime(val)}</span>
          <span className="text-[10px] text-text-secondary">{formatRelativeTime(val)}</span>
        </div>
      ),
    },
    {
      key: 'photo_url', label: '', width: '48px',
      render: (val) => val ? (
        <img src={val} alt="" className="w-8 h-8 rounded-full object-cover bg-bg-card-alt ring-1 ring-border-subtle" onError={(e) => { e.target.style.display = 'none' }} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-bg-card-alt flex items-center justify-center ring-1 ring-border-subtle">
          <Camera size={12} className="text-text-secondary" />
        </div>
      ),
    },
  ]

  const classFilterOptions = [
    { value: 'all', label: 'Tümü' },
    { value: 'regular', label: `Düzenli (${classStats.regular})` },
    { value: 'frequent', label: `Sık (${classStats.frequent})` },
    { value: 'occasional', label: `Ara Sıra (${classStats.occasional})` },
    { value: 'once', label: `Tek Seferlik (${classStats.once})` },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard label="Bugünkü Ziyaretçi" value={kpis.todayCount} icon={UserPlus} loading={loading} />
        <KPICard label="Toplam Benzersiz Kişi" value={kpis.totalUnique} icon={Users} loading={loading} />
        <KPICard label="Tekrar Eden Oran" value={kpis.returnRate} description={`${kpis.returningCount || 0} / ${kpis.totalUnique || 0} kişi`} icon={RefreshCw} loading={loading} />
        <KPICard label="En Sık Gelen" value={kpis.topVisitor ? `Kişi #${kpis.topVisitor.kisi_id} (${kpis.topVisitor.visit_count}x)` : '—'} icon={Crown} color="text-warning" loading={loading} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-bg-card border border-border-subtle p-3 rounded-card">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input type="text" placeholder="Kişi ID ile ara…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 h-9 bg-bg-card-alt border border-border-subtle rounded-btn text-sm focus:border-accent focus:outline-none text-text-primary" />
        </div>
        <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-44 h-9 px-3 bg-bg-card-alt border border-border-subtle rounded-btn text-sm focus:border-accent focus:outline-none text-text-primary" />
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="pl-8 pr-3 py-2 h-9 appearance-none bg-bg-card-alt border border-border-subtle rounded-btn text-sm focus:border-accent focus:outline-none text-text-primary">
            {classFilterOptions.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        {(searchQuery || dateFilter || classFilter !== 'all') && (
          <button onClick={() => { setSearchQuery(''); setDateFilter(''); setClassFilter('all') }} className="text-xs text-text-secondary hover:text-text-primary transition-colors flex items-center gap-1 h-9 px-3 rounded-btn hover:bg-bg-card-alt"><X size={12} /> Temizle</button>
        )}
        <span className="text-xs font-medium text-text-secondary ml-auto bg-bg-card-alt px-3 py-1.5 rounded-full">{filteredVisitors.length} sonuç</span>
      </div>

      {/* Classification Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { key: 'regular', label: 'Düzenli Ziyaretçi', desc: '10+ ziyaret', count: classStats.regular, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: UserCheck },
          { key: 'frequent', label: 'Sık Ziyaretçi', desc: '5-9 ziyaret', count: classStats.frequent, color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', icon: Users },
          { key: 'occasional', label: 'Ara Sıra', desc: '2-4 ziyaret', count: classStats.occasional, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: Eye },
          { key: 'once', label: 'Tek Seferlik', desc: '1 ziyaret', count: classStats.once, color: 'text-text-secondary', bg: 'bg-bg-card-alt', border: 'border-border-subtle', icon: UserPlus },
        ].map((cat) => (
          <button key={cat.key} onClick={() => setClassFilter(classFilter === cat.key ? 'all' : cat.key)}
            className={cn('bg-bg-card border rounded-card p-4 text-left transition-all duration-200', classFilter === cat.key ? `${cat.border} ${cat.bg}` : 'border-border-subtle hover:border-accent/20')}>
            <div className="flex items-center justify-between mb-2">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', cat.bg)}>
                <cat.icon size={16} className={cat.color} />
              </div>
              <span className={cn('text-2xl font-bold', cat.color)}>{cat.count}</span>
            </div>
            <div className="text-xs font-semibold text-text-primary">{cat.label}</div>
            <div className="text-[10px] text-text-secondary">{cat.desc}</div>
          </button>
        ))}
      </div>

      {/* Top 5 + Hourly Traffic */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-2 bg-bg-card border border-border-subtle rounded-card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <Crown size={14} className="text-warning" /> En Sık Gelen 5 Kişi
          </h2>
          {loading ? <Skeleton variant="chart" /> : top5.length > 0 ? (
            <div className="space-y-3">
              {top5.map((visitor, i) => {
                const maxV = top5[0]?.visit_count || 1
                const pct = (visitor.visit_count / maxV) * 100
                const colors = ['#4F8EF7', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']
                return (
                  <button key={visitor.kisi_id} onClick={() => setSelectedVisitor(visitor)}
                    className="w-full flex items-center gap-3 group hover:bg-bg-card-alt/50 rounded-btn p-1.5 -m-1.5 transition-colors">
                    <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      i === 0 ? 'bg-warning/15 text-warning' : i === 1 ? 'bg-accent/15 text-accent' : 'bg-bg-card-alt text-text-secondary')}>{i + 1}</span>
                    {visitor.photo_url ? (
                      <img src={visitor.photo_url} alt="" className="w-8 h-8 rounded-full object-cover bg-bg-card-alt shrink-0 ring-1 ring-border-subtle" onError={(e) => { e.target.style.display = 'none' }} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-bg-card-alt flex items-center justify-center shrink-0 ring-1 ring-border-subtle"><Camera size={12} className="text-text-secondary" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-text-primary">Kişi #{visitor.kisi_id}</span>
                        <span className="text-xs font-bold text-text-primary ml-2">{visitor.visit_count}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-bg-card-alt overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                      </div>
                    </div>
                    <ChevronRight size={12} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </button>
                )
              })}
            </div>
          ) : <EmptyState title="Ziyaretçi verisi yok" />}
        </div>
        <div className="col-span-3 bg-bg-card border border-border-subtle rounded-card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <CalendarDays size={14} className="text-accent" /> Bugünkü Saatlik Trafik
          </h2>
          {loading ? <Skeleton variant="chart" /> : <VisitorLineChart data={hourlyData} />}
        </div>
      </div>

      {/* Recent Activity Strip */}
      {recentActivity.length > 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-card p-4">
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-2"><Clock size={12} /> Bugünkü Son Girişler</h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {recentActivity.map((v) => (
              <div key={v.id} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-btn bg-bg-card-alt border border-border-subtle">
                {v.foto_url ? (
                  <img src={v.foto_url} alt="" className="w-6 h-6 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-bg-card flex items-center justify-center"><Camera size={10} className="text-text-secondary" /></div>
                )}
                <span className="text-[10px] font-semibold text-accent">#{v.kisi_id}</span>
                <span className="text-[9px] text-text-secondary">{formatRelativeTime(v.created_at || v.tarih)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex gap-4">
        <div className="flex-1">
          <DataTable columns={columns} data={filteredVisitors} loading={loading} onRowClick={setSelectedVisitor} emptyMessage="Ziyaretçi kaydı bulunamadı."
            rowClassName={(row) => cn(selectedVisitor?.kisi_id === row.kisi_id ? 'bg-accent/5' : '')} />
        </div>

        {/* Modal for Visitor Detail */}
        <Modal isOpen={!!selectedVisitor} onClose={() => setSelectedVisitor(null)} title="Ziyaretçi Detayı" className="max-w-md">
          {selectedVisitor && (
            <div className="space-y-5">
              <div className="flex justify-center">
                {selectedVisitor.photo_url ? (
                  <img src={selectedVisitor.photo_url} alt="" className="w-32 h-32 rounded-full object-cover bg-bg-card-alt ring-4 ring-accent/20" onError={(e) => { e.target.style.display = 'none' }} />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-bg-card-alt flex items-center justify-center"><Camera size={40} className="text-text-secondary" /></div>
                )}
              </div>
              <div className="text-center">
                <span className="text-2xl font-bold text-accent">Kişi #{selectedVisitor.kisi_id}</span>
              </div>
              {(() => {
                const cls = classifyVisitor(selectedVisitor.visit_count)
                return <div className={cn('text-center py-2 px-3 rounded-btn border', cls.bg, cls.border)}><span className={cn('text-xs font-bold', cls.text)}>{cls.label} Ziyaretçi</span></div>
              })()}
              <div className="space-y-3 bg-bg-card-alt p-4 rounded-card border border-border-subtle">
                <InfoRow label="Toplam Ziyaret" value={<span className="text-lg font-bold text-accent">{selectedVisitor.visit_count}</span>} />
                <InfoRow label="İlk Görülme" value={formatDateTime(selectedVisitor.first_seen_at)} />
                <InfoRow label="Son Görülme" value={formatDateTime(selectedVisitor.last_seen_at)} />
                <InfoRow label="Son Aktivite" value={<span className="text-xs text-accent">{formatRelativeTime(selectedVisitor.last_seen_at)}</span>} />
              </div>
              
              <div className="pt-2 border-t border-border-subtle">
                <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold block mb-3">Ziyaret Yoğunluğu</span>
                <div className="flex gap-1">
                  {Array.from({ length: 20 }, (_, i) => (
                    <div key={i} className={cn('h-4 flex-1 rounded-sm transition-colors', i < Math.min(selectedVisitor.visit_count, 20) ? 'bg-accent' : 'bg-bg-card-alt border border-border-subtle')} />
                  ))}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-medium text-text-secondary">0</span>
                  <span className="text-[10px] font-medium text-text-secondary">20+</span>
                </div>
              </div>

              {selectedVisitor.visits && selectedVisitor.visits.length > 0 && (
                <div className="pt-2 border-t border-border-subtle">
                  <span className="text-xs text-text-secondary uppercase tracking-wider font-semibold block mb-3">Ziyaret Geçmişi</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {selectedVisitor.visits.slice(0, 15).map((v) => (
                      <div key={v.id} className="flex items-center gap-3 text-sm text-text-primary px-3 py-2 rounded-btn bg-bg-card border border-border-subtle">
                        <Clock size={14} className="text-accent" />
                        <span>{formatDateTime(v.created_at || v.tarih)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-text-secondary">{label}</span>
      {typeof value === 'string' || typeof value === 'number' ? <span className="text-xs text-text-primary">{value ?? '—'}</span> : value}
    </div>
  )
}
