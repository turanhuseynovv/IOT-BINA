import { useState } from 'react'
import { FileText, Download, Mail, Activity, Users, AlertTriangle, CheckCircle, Database } from 'lucide-react'
import Tabs from '../components/ui/Tabs'
import Accordion from '../components/ui/Accordion'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import { supabase } from '../lib/supabase'
import { formatDate, cn } from '../lib/utils'

const REPORT_TYPES = [
  { value: 'daily', label: 'Günlük' },
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
]

export default function ReportsPage() {
  const [reportType, setReportType] = useState('weekly')
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)

  async function generateReport() {
    setLoading(true)
    try {
      const now = new Date()
      let start = new Date(now)
      if (reportType === 'daily') start.setDate(start.getDate() - 1)
      else if (reportType === 'weekly') start.setDate(start.getDate() - 7)
      else if (reportType === 'monthly') start.setMonth(start.getMonth() - 1)

      const [{ data: visits }, { data: sensors }, { data: cameras }] = await Promise.all([
        supabase.from('ziyaretler').select('*').gte('created_at', start.toISOString()),
        supabase.from('sensor_data').select('*').gte('created_at', start.toISOString()),
        supabase.from('camera_events').select('*').gte('captured_at', start.toISOString()),
      ])

      const v = visits || [], s = sensors || [], c = cameras || []
      const days = Math.max(1, Math.ceil((now - start) / 86400000))
      
      const uniqueVisitors = new Set(v.map((x) => x.kisi_id)).size
      const temps = s.map((x) => Number(x.sicaklik)).filter((x) => !isNaN(x))
      const hums = s.map((x) => Number(x.nem)).filter((x) => !isNaN(x))
      const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1) : 0
      const avgHum = hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length).toFixed(1) : 0
      const gasAlerts = s.filter((x) => x.gaz === true).length
      
      const suspicious = c.filter(x => x.is_flagged === true).length
      const totalCameras = c.length

      setReport({
        period: `${formatDate(start)} — ${formatDate(now)}`,
        generatedAt: formatDateTime(now),
        visitor: { total: v.length, unique: uniqueVisitors, avg: (v.length / days).toFixed(1) },
        sensor: { total: s.length, avgTemp, avgHum, gasAlerts },
        camera: { total: totalCameras, suspicious },
      })
    } catch (e) { 
      console.error(e) 
    } finally { 
      setLoading(false) 
    }
  }

  function formatDateTime(date) {
    return new Date(date).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const accordionItems = report ? [
    {
      title: 'Ziyaretçi ve Geçiş Özeti',
      icon: <Users size={16} className="text-accent" />,
      content: (
        <div className="space-y-3 text-sm">
          <Row l="Toplam Giriş İşlemi" v={report.visitor.total} />
          <Row l="Benzersiz Kişi Sayısı" v={report.visitor.unique} />
          <Row l="Günlük Ortalama Giriş" v={report.visitor.avg} />
        </div>
      ),
    },
    {
      title: 'Çevresel Sensör Analizi',
      icon: <Activity size={16} className="text-warning" />,
      content: (
        <div className="space-y-3 text-sm">
          <Row l="Toplam Sensör Verisi" v={report.sensor.total} />
          <Row l="Ortalama Sıcaklık" v={`${report.sensor.avgTemp} °C`} />
          <Row l="Ortalama Nem" v={`%${report.sensor.avgHum}`} />
          <Row l="Gaz / Duman Uyarıları" v={report.sensor.gasAlerts} isAlert={report.sensor.gasAlerts > 0} />
        </div>
      ),
    },
    {
      title: 'Güvenlik ve Kamera Kayıtları',
      icon: <AlertTriangle size={16} className="text-danger" />,
      content: (
        <div className="space-y-3 text-sm">
          <Row l="Toplam Kamera Tespiti" v={report.camera.total} />
          <Row l="Şüpheli Şahıs İşaretlemesi" v={report.camera.suspicious} isAlert={report.camera.suspicious > 0} />
        </div>
      ),
    },
  ] : []

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <Tabs tabs={REPORT_TYPES} activeTab={reportType} onChange={setReportType} />
        
        <button onClick={generateReport} disabled={loading} className="h-9 px-5 bg-accent text-white text-sm font-medium rounded-btn hover:bg-accent/90 transition-colors duration-150 disabled:opacity-50 flex items-center gap-2">
          {loading ? <span className="animate-pulse">Oluşturuluyor…</span> : <><FileText size={16} /> Rapor Oluştur</>}
        </button>
      </div>

      {loading && <div className="space-y-4"><Skeleton variant="card" count={1} /><Skeleton variant="row" count={3} /></div>}

      {report && !loading && (
        <div className="bg-bg-card border border-border-subtle rounded-card overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-5 py-4 border-b border-border-subtle bg-bg-card-alt flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-0 justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Database size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-text-primary">Sistem Analiz Raporu</h2>
                <p className="text-xs text-text-secondary mt-0.5">Dönem: {report.period}</p>
              </div>
            </div>
            <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
              <span className="text-[10px] text-text-secondary flex items-center gap-1">
                <CheckCircle size={10} className="text-success" /> {report.generatedAt}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => window.print()} className="h-8 px-3 bg-bg-primary border border-border-subtle text-text-secondary text-xs font-medium rounded-btn flex items-center gap-1.5 hover:text-text-primary hover:border-text-secondary transition-all duration-150">
                  <Download size={14} />Çıktı Al
                </button>
                <button className="h-8 px-3 bg-bg-primary border border-border-subtle text-text-secondary text-xs font-medium rounded-btn flex items-center gap-1.5 hover:text-text-primary hover:border-text-secondary transition-all duration-150">
                  <Mail size={14} />E-posta
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-border-subtle bg-bg-card">
            <div className="p-4 rounded-card border border-border-subtle bg-bg-card-alt">
              <p className="text-xs text-text-secondary mb-1">Toplam Olay (Sensör+Giriş+Kamera)</p>
              <p className="text-2xl font-bold text-text-primary">{report.visitor.total + report.sensor.total + report.camera.total}</p>
            </div>
            <div className="p-4 rounded-card border border-border-subtle bg-bg-card-alt">
              <p className="text-xs text-text-secondary mb-1">Sistem Durumu</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn("w-2 h-2 rounded-full", report.sensor.gasAlerts > 0 ? "bg-danger" : "bg-success")}></div>
                <p className={cn("text-lg font-bold", report.sensor.gasAlerts > 0 ? "text-danger" : "text-success")}>
                  {report.sensor.gasAlerts > 0 ? 'Uyarı Var' : 'Normal'}
                </p>
              </div>
            </div>
             <div className="p-4 rounded-card border border-border-subtle bg-bg-card-alt">
              <p className="text-xs text-text-secondary mb-1">Güvenlik İhlali Riski</p>
              <p className={cn("text-2xl font-bold", report.camera.suspicious > 0 ? "text-danger" : "text-success")}>
                {report.camera.suspicious > 0 ? 'Yüksek' : 'Düşük'}
              </p>
            </div>
          </div>

          <Accordion items={accordionItems} />
        </div>
      )}

      {!report && !loading && (
        <div className="pt-8">
          <EmptyState icon={FileText} title="Sistem Verileri Raporlaması" description="İstediğiniz zaman aralığını seçerek sensör, ziyaretçi ve güvenlik verilerini derleyin." />
        </div>
      )}
    </div>
  )
}

function Row({ l, v, isAlert }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-text-secondary">{l}</span>
      <span className={cn("font-semibold", isAlert ? "text-danger flex items-center gap-1.5" : "text-text-primary")}>
        {isAlert && <AlertTriangle size={12} />}
        {v ?? '—'}
      </span>
    </div>
  )
}
