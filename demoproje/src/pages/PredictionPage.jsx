import { useState, useMemo } from 'react'
import { TrendingUp, Calendar, Hash, Thermometer, Droplets } from 'lucide-react'
import PredictionBarChart from '../components/charts/PredictionBarChart'
import EmptyState from '../components/ui/EmptyState'
import Skeleton from '../components/ui/Skeleton'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

const DAY_NAMES = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']

export default function PredictionPage() {
  const [predDate, setPredDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [prediction, setPrediction] = useState(null)

  async function handlePredict() {
    setLoading(true)
    try {
      const targetDate = new Date(predDate)
      const dayOfWeek = targetDate.getDay()

      // Fetch historical visits from ziyaretler
      const { data: allVisits } = await supabase.from('ziyaretler').select('created_at, tarih, kisi_id')
      const visits = allVisits || []

      // Group visits by day
      const dayCounts = {}
      visits.forEach((v) => {
        const d = new Date(v.created_at || v.tarih)
        const key = d.toISOString().split('T')[0]
        dayCounts[key] = (dayCounts[key] || 0) + 1
      })

      // All day values
      const allDayValues = Object.values(dayCounts)
      const overallAvg = allDayValues.length > 0
        ? Math.round(allDayValues.reduce((a, b) => a + b, 0) / allDayValues.length)
        : 0

      // Same day-of-week average
      const sameDayValues = Object.entries(dayCounts)
        .filter(([date]) => new Date(date).getDay() === dayOfWeek)
        .map(([, count]) => count)

      const dayAvg = sameDayValues.length > 0
        ? Math.round(sameDayValues.reduce((a, b) => a + b, 0) / sameDayValues.length)
        : overallAvg

      // Use weighted average: 70% same-day, 30% overall
      const predicted = sameDayValues.length > 0
        ? Math.round(dayAvg * 0.7 + overallAvg * 0.3)
        : overallAvg

      const min = Math.round(predicted * 0.75)
      const max = Math.round(predicted * 1.25)

      // Confidence based on data points
      const dataPoints = sameDayValues.length
      const confidence = dataPoints >= 4 ? 88 : dataPoints >= 2 ? 73 : dataPoints >= 1 ? 60 : 40

      // Fetch latest sensor averages for context
      const { data: recentSensors } = await supabase.from('sensor_data').select('sicaklik, nem, gaz')
        .order('created_at', { ascending: false }).limit(50)
      const sensors = recentSensors || []
      const temps = sensors.map((s) => Number(s.sicaklik)).filter((v) => !isNaN(v))
      const hums = sensors.map((s) => Number(s.nem)).filter((v) => !isNaN(v))
      const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : null
      const avgHum = hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : null

      // Build 7-day forecast
      const weekData = []
      for (let i = -3; i <= 3; i++) {
        const d = new Date(targetDate)
        d.setDate(d.getDate() + i)
        const dow = d.getDay()
        const dayVals = Object.entries(dayCounts)
          .filter(([date]) => new Date(date).getDay() === dow)
          .map(([, c]) => c)
        const dAvg = dayVals.length > 0
          ? Math.round(dayVals.reduce((a, b) => a + b, 0) / dayVals.length)
          : overallAvg

        weekData.push({
          label: `${DAY_NAMES[dow]} ${d.getDate()}`,
          predicted: dAvg,
          min: Math.round(dAvg * 0.75),
          max: Math.round(dAvg * 1.25),
        })
      }

      // Historical stats
      const totalDays = Object.keys(dayCounts).length
      const totalVisits = visits.length

      setPrediction({
        predicted, min, max, confidence, weekData,
        dayOfWeek: DAY_NAMES[dayOfWeek],
        dataPoints, overallAvg, dayAvg,
        avgTemp, avgHum,
        totalDays, totalVisits,
      })
    } catch (e) {
      console.error('Prediction error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="w-prediction-sidebar shrink-0">
        <div className="bg-bg-card border border-border-subtle rounded-card p-5 space-y-5 sticky top-24">
          <h2 className="text-sm font-semibold text-text-primary">Tahmin Parametreleri</h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <Calendar size={12} /> Tahmin Tarihi
            </label>
            <input type="date" value={predDate} onChange={(e) => setPredDate(e.target.value)} className="w-full" />
          </div>

          <div className="bg-bg-card-alt/30 rounded-btn p-3 space-y-1">
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-semibold">Seçili Gün</span>
            <span className="text-sm font-bold text-accent block">
              {DAY_NAMES[new Date(predDate).getDay()]} — {new Date(predDate).toLocaleDateString('tr-TR')}
            </span>
          </div>

          <button onClick={handlePredict} disabled={loading}
            className="w-full h-10 bg-accent text-white text-sm font-medium rounded-btn hover:bg-accent/90 transition-colors disabled:opacity-50">
            {loading ? 'Hesaplanıyor…' : 'Tahmin Üret'}
          </button>

          <p className="text-[10px] text-text-secondary text-center">
            Geçmiş ziyaretçi verileri bazlı istatistiksel tahmin
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {loading && <><Skeleton variant="chart" /><Skeleton variant="card" /></>}

        {prediction && !loading && <>
          {/* Today's Prediction Hero */}
          <div className="bg-bg-card rounded-card p-6" style={{ boxShadow: '0 0 20px rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)' }}>
            <h3 className="text-xs font-semibold text-text-secondary mb-2">
              {prediction.dayOfWeek} Günü Tahmini
            </h3>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-5xl font-bold text-text-primary">{prediction.predicted}</span>
              <span className="text-lg text-text-secondary mb-1">kişi</span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-text-secondary">Aralık:</span>
              <span className="text-sm font-bold text-accent">{prediction.min} – {prediction.max}</span>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-badge ml-2',
                prediction.confidence >= 80 ? 'bg-success/10 text-success' :
                prediction.confidence >= 60 ? 'bg-warning/10 text-warning' : 'bg-danger/10 text-danger'
              )}>
                Güven: %{prediction.confidence}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-3 border-t border-border-subtle">
              <MiniStat label="Geçmiş Veri" value={`${prediction.totalDays} gün`} icon={Calendar} />
              <MiniStat label={`${prediction.dayOfWeek} Ortalaması`} value={`${prediction.dayAvg} kişi`} icon={Hash} />
              {prediction.avgTemp && <MiniStat label="Güncel Sıcaklık" value={`${prediction.avgTemp}°C`} icon={Thermometer} />}
              {prediction.avgHum && <MiniStat label="Güncel Nem" value={`${prediction.avgHum}%`} icon={Droplets} />}
            </div>
          </div>

          {/* 7-day Chart */}
          <div className="bg-bg-card border border-border-subtle rounded-card p-6">
            <h2 className="text-sm font-semibold text-text-primary mb-4">7 Günlük Tahmin</h2>
            <PredictionBarChart data={prediction.weekData} todayIndex={3} />
          </div>

          {/* How it works */}
          <div className="bg-bg-card border border-border-subtle rounded-card p-5">
            <h3 className="text-xs font-semibold text-text-secondary mb-3">Tahmin Nasıl Hesaplanıyor?</h3>
            <div className="space-y-2 text-xs text-text-secondary">
              <p>• <strong className="text-text-primary">Veri kaynağı:</strong> `ziyaretler` tablosundaki {prediction.totalVisits} toplam giriş kaydı</p>
              <p>• <strong className="text-text-primary">Yöntem:</strong> Seçilen güne ait geçmiş {prediction.dataPoints} kayıt ile ağırlıklı ortalama (%70 aynı gün, %30 genel)</p>
              <p>• <strong className="text-text-primary">Güven skoru:</strong> Veri noktası sayısına göre (4+ veri = yüksek, 2-3 = orta, 1 = düşük)</p>
              <p>• <strong className="text-text-primary">Aralık:</strong> Tahminin ±25% toleransı</p>
            </div>
          </div>
        </>}

        {!prediction && !loading && (
          <EmptyState icon={TrendingUp} title="Tahmin oluşturmak için tarih seçin"
            description="Sol panelden tarih seçip 'Tahmin Üret' butonuna tıklayın. Geçmiş ziyaretçi verileri kullanılarak tahmin üretilecektir." />
        )}
      </div>
    </div>
  )
}

function MiniStat({ label, value, icon: Icon }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-1 mb-1">
        <Icon size={10} className="text-text-secondary" />
        <span className="text-[9px] text-text-secondary uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className="text-xs font-bold text-text-primary">{value}</span>
    </div>
  )
}
