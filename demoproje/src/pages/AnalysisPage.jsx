import { useState } from 'react'
import { BarChart2, Users, Thermometer, Droplets, Flame, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import ComparisonChart from '../components/charts/ComparisonChart'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

export default function AnalysisPage() {
  const [periodA, setPeriodA] = useState({ start: '', end: '' })
  const [periodB, setPeriodB] = useState({ start: '', end: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleCompare() {
    if (!periodA.start || !periodA.end || !periodB.start || !periodB.end) return
    setLoading(true)
    try {
      // Fetch visits from ziyaretler
      const { data: zA } = await supabase.from('ziyaretler').select('*')
        .gte('created_at', `${periodA.start}T00:00:00`).lte('created_at', `${periodA.end}T23:59:59`)
      const { data: zB } = await supabase.from('ziyaretler').select('*')
        .gte('created_at', `${periodB.start}T00:00:00`).lte('created_at', `${periodB.end}T23:59:59`)

      // Fetch sensor data from sensor_data
      const { data: sA } = await supabase.from('sensor_data').select('*')
        .gte('created_at', `${periodA.start}T00:00:00`).lte('created_at', `${periodA.end}T23:59:59`)
      const { data: sB } = await supabase.from('sensor_data').select('*')
        .gte('created_at', `${periodB.start}T00:00:00`).lte('created_at', `${periodB.end}T23:59:59`)

      const mA = calcMetrics(zA || [], sA || [])
      const mB = calcMetrics(zB || [], sB || [])
      const chart = buildChart(zA || [], zB || [], periodA, periodB)
      const insights = genInsights(mA, mB)

      setResult({ mA, mB, chart, insights })
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  function calcMetrics(visits, sensors) {
    // Visitor metrics
    const totalVisits = visits.length
    const uniqueIds = new Set(visits.map((v) => v.kisi_id))
    const uniqueCount = uniqueIds.size

    // Most frequent visitor
    const freq = {}
    visits.forEach((v) => { freq[v.kisi_id] = (freq[v.kisi_id] || 0) + 1 })
    const topEntry = Object.entries(freq).sort((a, b) => b[1] - a[1])[0]
    const topVisitor = topEntry ? `Kişi #${topEntry[0]} (${topEntry[1]}x)` : '—'

    // Peak hour
    const hg = {}
    visits.forEach((v) => { const h = new Date(v.created_at || v.tarih).getHours(); hg[h] = (hg[h] || 0) + 1 })
    const ph = Object.entries(hg).sort((a, b) => b[1] - a[1])[0]
    const peakHour = ph ? `${ph[0]}:00 (${ph[1]} giriş)` : '—'

    // Sensor metrics
    const temps = sensors.map((s) => Number(s.sicaklik)).filter((v) => !isNaN(v))
    const hums = sensors.map((s) => Number(s.nem)).filter((v) => !isNaN(v))
    const gasAlerts = sensors.filter((s) => s.gaz === true).length

    const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : '—'
    const avgHum = hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : '—'

    return { totalVisits, uniqueCount, topVisitor, peakHour, avgTemp, avgHum, gasAlerts, sensorCount: sensors.length }
  }

  function buildChart(a, b, pA, pB) {
    const dc = (visits, s, e) => {
      const m = {}
      visits.forEach((v) => { const d = new Date(v.created_at || v.tarih).toISOString().split('T')[0]; m[d] = (m[d] || 0) + 1 })
      const r = [], c = new Date(s), ed = new Date(e)
      while (c <= ed) { const k = c.toISOString().split('T')[0]; r.push({ date: k, count: m[k] || 0 }); c.setDate(c.getDate() + 1) }
      return r
    }
    const dA = dc(a, pA.start, pA.end), dB = dc(b, pB.start, pB.end)
    const max = Math.max(dA.length, dB.length), data = []
    for (let i = 0; i < max; i++) data.push({ label: `Gün ${i + 1}`, periodA: dA[i]?.count || 0, periodB: dB[i]?.count || 0 })
    return data
  }

  function genInsights(a, b) {
    const ins = []
    // Visit comparison
    if (a.totalVisits !== b.totalVisits) {
      const more = a.totalVisits > b.totalVisits ? 'A' : 'B'
      const pct = Math.abs(((a.totalVisits - b.totalVisits) / Math.max(b.totalVisits, 1)) * 100).toFixed(0)
      ins.push({ text: `Dönem ${more}'de toplam giriş sayısı %${pct} daha fazla.`, type: more === 'A' ? 'up' : 'down' })
    } else {
      ins.push({ text: 'Her iki dönemde giriş sayısı eşit.', type: 'neutral' })
    }
    // Unique visitors
    if (a.uniqueCount !== b.uniqueCount) {
      const more = a.uniqueCount > b.uniqueCount ? 'A' : 'B'
      ins.push({ text: `Dönem ${more}'de daha fazla benzersiz kişi tespit edildi (A: ${a.uniqueCount}, B: ${b.uniqueCount}).`, type: 'neutral' })
    }
    // Temperature
    if (a.avgTemp !== '—' && b.avgTemp !== '—') {
      const diff = (Number(a.avgTemp) - Number(b.avgTemp)).toFixed(1)
      ins.push({ text: `Ortalama sıcaklık farkı: ${diff > 0 ? '+' : ''}${diff}°C (A: ${a.avgTemp}°C, B: ${b.avgTemp}°C).`, type: 'neutral' })
    }
    // Gas alerts
    if (a.gasAlerts > 0 || b.gasAlerts > 0) {
      ins.push({ text: `Gaz uyarısı — A: ${a.gasAlerts}, B: ${b.gasAlerts} kez.`, type: a.gasAlerts > b.gasAlerts ? 'up' : 'down' })
    }
    ins.push({ text: `En yoğun saat — A: ${a.peakHour}, B: ${b.peakHour}.`, type: 'neutral' })
    return ins
  }

  const trendIcon = (type) => {
    if (type === 'up') return <TrendingUp size={12} className="text-success" />
    if (type === 'down') return <TrendingDown size={12} className="text-danger" />
    return <Minus size={12} className="text-text-secondary" />
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-5">
        <div className="flex items-end gap-6">
          <div className="flex-1">
            <label className="text-xs font-semibold text-accent mb-2 block">Dönem A</label>
            <div className="flex items-center gap-2">
              <input type="date" value={periodA.start} onChange={(e) => setPeriodA((p) => ({ ...p, start: e.target.value }))} className="flex-1" />
              <span className="text-text-secondary text-sm">—</span>
              <input type="date" value={periodA.end} onChange={(e) => setPeriodA((p) => ({ ...p, end: e.target.value }))} className="flex-1" />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-success mb-2 block">Dönem B</label>
            <div className="flex items-center gap-2">
              <input type="date" value={periodB.start} onChange={(e) => setPeriodB((p) => ({ ...p, start: e.target.value }))} className="flex-1" />
              <span className="text-text-secondary text-sm">—</span>
              <input type="date" value={periodB.end} onChange={(e) => setPeriodB((p) => ({ ...p, end: e.target.value }))} className="flex-1" />
            </div>
          </div>
          <button onClick={handleCompare} disabled={loading || !periodA.start || !periodA.end || !periodB.start || !periodB.end}
            className="h-9 px-6 bg-accent text-white text-sm font-medium rounded-btn hover:bg-accent/90 transition-colors disabled:opacity-50 shrink-0">
            {loading ? 'Yükleniyor…' : 'Karşılaştır'}
          </button>
        </div>
      </div>

      {loading && <><div className="grid grid-cols-2 gap-4"><Skeleton variant="card" /><Skeleton variant="card" /></div><Skeleton variant="chart" /></>}

      {result && !loading && <>
        {/* Metrics Side by Side */}
        <div className="grid grid-cols-2 gap-4">
          {/* Period A */}
          <div className="border-l-[3px] border-accent rounded-card bg-bg-card border border-border-subtle p-5 space-y-4">
            <h3 className="text-xs font-bold text-accent uppercase tracking-wider">Dönem A</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricBox icon={Users} label="Toplam Giriş" value={result.mA.totalVisits} color="text-accent" />
              <MetricBox icon={Users} label="Benzersiz Kişi" value={result.mA.uniqueCount} color="text-accent" />
              <MetricBox icon={Thermometer} label="Ort. Sıcaklık" value={`${result.mA.avgTemp}°C`} color="text-red-400" />
              <MetricBox icon={Droplets} label="Ort. Nem" value={`${result.mA.avgHum}%`} color="text-blue-400" />
              <MetricBox icon={Flame} label="Gaz Uyarısı" value={result.mA.gasAlerts} color={result.mA.gasAlerts > 0 ? 'text-danger' : 'text-success'} />
              <MetricBox icon={Users} label="En Sık Gelen" value={result.mA.topVisitor} color="text-warning" small />
            </div>
          </div>
          {/* Period B */}
          <div className="border-l-[3px] border-success rounded-card bg-bg-card border border-border-subtle p-5 space-y-4">
            <h3 className="text-xs font-bold text-success uppercase tracking-wider">Dönem B</h3>
            <div className="grid grid-cols-2 gap-3">
              <MetricBox icon={Users} label="Toplam Giriş" value={result.mB.totalVisits} color="text-success" />
              <MetricBox icon={Users} label="Benzersiz Kişi" value={result.mB.uniqueCount} color="text-success" />
              <MetricBox icon={Thermometer} label="Ort. Sıcaklık" value={`${result.mB.avgTemp}°C`} color="text-red-400" />
              <MetricBox icon={Droplets} label="Ort. Nem" value={`${result.mB.avgHum}%`} color="text-blue-400" />
              <MetricBox icon={Flame} label="Gaz Uyarısı" value={result.mB.gasAlerts} color={result.mB.gasAlerts > 0 ? 'text-danger' : 'text-success'} />
              <MetricBox icon={Users} label="En Sık Gelen" value={result.mB.topVisitor} color="text-warning" small />
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-bg-card border border-border-subtle rounded-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Günlük Ziyaretçi Karşılaştırması</h2>
          <ComparisonChart data={result.chart} />
        </div>

        {/* Insights */}
        <div className="bg-bg-card rounded-card p-5" style={{ border: '1px solid rgba(79,142,247,0.2)' }}>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={16} className="text-accent" />
            <h3 className="text-xs font-semibold text-text-primary">Otomatik Analiz Sonuçları</h3>
          </div>
          <ul className="space-y-2">
            {result.insights.map((item, i) => (
              <li key={i} className="text-sm text-text-secondary flex items-start gap-2">
                {trendIcon(item.type)}
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </>}

      {!result && !loading && (
        <EmptyState icon={BarChart2} title="Karşılaştırma yapmak için dönem seçin"
          description="İki farklı tarih aralığı seçip 'Karşılaştır' butonuna tıklayın. Ziyaretçi ve sensör verileri karşılaştırılacaktır." />
      )}
    </div>
  )
}

function MetricBox({ icon: Icon, label, value, color, small = false }) {
  return (
    <div className="bg-bg-card-alt/30 rounded-btn p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className={color} />
        <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className={cn('font-bold', color, small ? 'text-xs' : 'text-lg')}>{value ?? '—'}</span>
    </div>
  )
}
