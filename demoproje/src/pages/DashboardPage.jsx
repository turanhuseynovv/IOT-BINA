import { useMemo } from 'react'
import { Users, Activity, Shield, Thermometer, Droplets, Flame } from 'lucide-react'
import KPICard from '../components/ui/KPICard'
import DataTable from '../components/ui/DataTable'
import StatusBadge from '../components/ui/StatusBadge'
import Skeleton from '../components/ui/Skeleton'
import VisitorLineChart from '../components/charts/VisitorLineChart'
import ComfortGauge from '../components/charts/ComfortGauge'
import { useRealtimeTable } from '../hooks/useRealtimeTable'
import { useSensorData, calcSensorAverages } from '../hooks/useSensorData'
import { formatDateTime, formatTime, calculateComfortScore, getTodayRange, cn } from '../lib/utils'

export default function DashboardPage() {
  const todayRange = useMemo(() => getTodayRange(), [])

  // Fetch visits from ziyaretler table (realtime)
  const { data: rawVisits, loading: visitorsLoading } = useRealtimeTable('ziyaretler', {
    order: 'created_at',
    ascending: false,
  })

  // Fetch sensor data from real sensor_data table (ESP32)
  const { data: sensorReadings, loading: sensorsLoading } = useSensorData({
    limit: 100,
  })

  // Fetch security alerts
  const { data: alerts, loading: alertsLoading } = useRealtimeTable('security_alerts', {
    order: 'created_at',
    ascending: false,
    limit: 10,
  })

  // Fetch camera events for recent events
  const { data: cameraEvents, loading: eventsLoading } = useRealtimeTable('camera_events', {
    order: 'captured_at',
    ascending: false,
    limit: 200,
  })

  // Calculate KPIs — count unique kisi_id seen today
  const todayVisitorCount = useMemo(() => {
    if (!rawVisits) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayIds = new Set()
    rawVisits.forEach((v) => {
      if (new Date(v.created_at || v.tarih) >= today) todayIds.add(v.kisi_id)
    })
    return todayIds.size
  }, [rawVisits])

  const suspiciousVisitorCount = useMemo(() => {
    if (!cameraEvents) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return cameraEvents.filter(e => e.is_flagged === true && new Date(e.captured_at) >= today).length
  }, [cameraEvents])

  // Active sensor count based on real sensor_data
  const activeSensorCount = useMemo(() => {
    if (!sensorReadings || sensorReadings.length === 0) return null
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000)
    // Group by kat/oda combo
    const activeLocations = new Set()
    const totalLocations = new Set()
    sensorReadings.forEach((r) => {
      const locKey = `${r.kat}/${r.oda}`
      totalLocations.add(locKey)
      if (new Date(r.created_at) >= tenMinAgo) {
        activeLocations.add(locKey)
      }
    })
    return `${activeLocations.size}/${totalLocations.size || 0}`
  }, [sensorReadings])

  // Sensor averages from real data for comfort score
  const sensorAverages = useMemo(() => calcSensorAverages(sensorReadings), [sensorReadings])

  const comfortScore = useMemo(() => calculateComfortScore(sensorAverages), [sensorAverages])

  const todayAlertCount = useMemo(() => {
    if (!alerts) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return alerts.filter((a) => new Date(a.created_at) >= today).length
  }, [alerts])

  // Gas alert count from real sensor data
  const gasAlertCount = useMemo(() => {
    if (!sensorReadings) return 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return sensorReadings.filter((r) => r.gaz === true && new Date(r.created_at) >= today).length
  }, [sensorReadings])

  // Visitor traffic chart data (hourly) from ziyaretler
  const hourlyData = useMemo(() => {
    if (!rawVisits) return []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: String(i).padStart(2, '0') + ':00',
      count: 0,
    }))
    rawVisits.forEach((v) => {
      const d = new Date(v.created_at || v.tarih)
      if (d >= today) {
        const h = d.getHours()
        hours[h].count++
      }
    })
    return hours
  }, [rawVisits])

  // Latest sensor values for display
  const latestSensor = useMemo(() => {
    if (!sensorReadings || sensorReadings.length === 0) return null
    return sensorReadings[0]
  }, [sensorReadings])

  // Recent events (combine alerts, camera events, and gas alerts)
  const recentEvents = useMemo(() => {
    const events = []
    if (alerts) {
      alerts.forEach((a) => {
        events.push({
          id: a.id,
          time: a.created_at,
          type: 'Güvenlik',
          description: a.description || a.alert_type,
          status: a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'success',
          statusLabel: a.severity === 'high' ? 'Kritik' : a.severity === 'medium' ? 'Uyarı' : 'Güvenli',
        })
      })
    }
    if (cameraEvents) {
      cameraEvents.slice(0, 5).forEach((e) => {
        events.push({
          id: e.id,
          time: e.captured_at,
          type: 'Kamera',
          description: e.is_flagged ? 'Şüpheli kişi tespit edildi' : 'Görüntü yakalandı',
          status: e.is_flagged ? 'danger' : 'success',
          statusLabel: e.is_flagged ? 'Uyarı' : 'Güvenli',
        })
      })
    }
    // Add gas detection events from sensor data
    if (sensorReadings) {
      sensorReadings
        .filter((r) => r.gaz === true)
        .slice(0, 5)
        .forEach((r) => {
          events.push({
            id: `gas-${r.id}`,
            time: r.created_at,
            type: 'Sensör',
            description: `Gaz algılandı! (${r.kat}/${r.oda}) — Sıcaklık: ${r.sicaklik}°C, Nem: ${r.nem}%`,
            status: 'danger',
            statusLabel: 'Tehlike',
          })
        })
    }
    return events.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 10)
  }, [alerts, cameraEvents, sensorReadings])

  const eventColumns = [
    {
      key: 'time',
      label: 'Zaman',
      width: '160px',
      render: (val) => (
        <span className="text-xs text-text-secondary">{formatDateTime(val)}</span>
      ),
    },
    { key: 'type', label: 'Olay Türü', width: '120px' },
    { key: 'description', label: 'Açıklama' },
    {
      key: 'status',
      label: 'Durum',
      width: '120px',
      render: (val, row) => <StatusBadge status={val} label={row.statusLabel} />,
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Ziyaretçi (Bugün)"
          value={todayVisitorCount}
          icon={Users}
          loading={visitorsLoading}
        />
        <KPICard
          label="Şüpheli Girişim (Bugün)"
          value={suspiciousVisitorCount}
          icon={Shield}
          color={suspiciousVisitorCount > 0 ? 'text-danger' : 'text-success'}
          loading={visitorsLoading}
        />
        <KPICard
          label="Ort. Konfor Skoru"
          value={comfortScore}
          icon={Thermometer}
          color={
            comfortScore == null
              ? undefined
              : comfortScore >= 70
              ? 'text-success'
              : comfortScore >= 40
              ? 'text-warning'
              : 'text-danger'
          }
          loading={sensorsLoading}
        />
        <KPICard
          label="Bugünkü Gaz Uyarıları"
          value={gasAlertCount}
          icon={Flame}
          color={gasAlertCount > 0 ? 'text-danger' : undefined}
          loading={sensorsLoading}
        />
      </div>

      {/* Live Sensor Strip */}
      {latestSensor && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-bg-card border border-border-subtle rounded-card px-4 py-3 flex items-center gap-3">
            <Thermometer size={18} className="text-red-400" />
            <div>
              <div className="text-xs text-text-secondary">Sıcaklık</div>
              <div className="text-lg font-bold text-text-primary">{latestSensor.sicaklik}°C</div>
            </div>
          </div>
          <div className="bg-bg-card border border-border-subtle rounded-card px-4 py-3 flex items-center gap-3">
            <Droplets size={18} className="text-blue-400" />
            <div>
              <div className="text-xs text-text-secondary">Nem</div>
              <div className="text-lg font-bold text-text-primary">{latestSensor.nem}%</div>
            </div>
          </div>
          <div className={cn(
            "bg-bg-card border rounded-card px-4 py-3 flex items-center gap-3",
            latestSensor.gaz ? "border-danger/50 bg-danger/5" : "border-border-subtle"
          )}>
            <Flame size={18} className={latestSensor.gaz ? "text-danger" : "text-green-400"} />
            <div>
              <div className="text-xs text-text-secondary">Anlık Gaz Durumu</div>
              <div className={cn("text-lg font-bold", latestSensor.gaz ? "text-danger" : "text-success")}>
                {latestSensor.gaz ? '⚠ GAZ VAR' : '✓ Temiz'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts & Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Visitor Traffic Chart */}
        <div className="lg:col-span-3 bg-bg-card border border-border-subtle rounded-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Bugünkü Ziyaretçi Trafiği</h2>
          {visitorsLoading ? (
            <Skeleton variant="chart" />
          ) : (
            <VisitorLineChart data={hourlyData} />
          )}
        </div>

        {/* Comfort Gauge */}
        <div className="lg:col-span-2 bg-bg-card border border-border-subtle rounded-card p-6">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Çevresel Konfor Skoru</h2>
          {sensorsLoading ? (
            <Skeleton variant="chart" />
          ) : (
            <ComfortGauge score={comfortScore} sensorAverages={sensorAverages} />
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Son Olaylar</h2>
        <DataTable
          columns={eventColumns}
          data={recentEvents}
          loading={eventsLoading && alertsLoading}
          emptyMessage="Henüz olay kaydı bulunmuyor."
        />
      </div>
    </div>
  )
}
