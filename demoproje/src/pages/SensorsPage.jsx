import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import StatusBadge from '../components/ui/StatusBadge'
import DataTable from '../components/ui/DataTable'
import SensorSparkline from '../components/charts/SensorSparkline'
import { useSensorData, transformToTimeSeries } from '../hooks/useSensorData'
import { formatDateTime, cn } from '../lib/utils'
import { TIME_RANGES, BUILDING_FLOORS } from '../lib/constants'
import {
  Activity, Flame, Thermometer, Droplets, Building2, DoorOpen,
  ChevronRight, TrendingUp, TrendingDown, ArrowRight, Clock, Gauge
} from 'lucide-react'

export default function SensorsPage() {
  const [timeRange, setTimeRange] = useState('24h')
  const [selectedFloor, setSelectedFloor] = useState('all')
  const [selectedRoom, setSelectedRoom] = useState('all')

  // Find floor config for current selection
  const floorConfig = useMemo(
    () => BUILDING_FLOORS.find((f) => f.value === selectedFloor) || BUILDING_FLOORS[0],
    [selectedFloor]
  )

  // When selecting a floor, determine kat/oda parameters
  const queryKat = floorConfig.kat || undefined
  const queryOda = selectedRoom !== 'all'
    ? (floorConfig.rooms.find((r) => r.value === selectedRoom)?.oda || undefined)
    : undefined

  // Fetch sensor data from the real sensor_data table (ESP32)
  const { data: rawReadings, loading } = useSensorData({
    limit: 500,
    kat: queryKat,
    oda: queryOda,
  })

  // Time series chart data
  const timeSeriesData = useMemo(
    () => transformToTimeSeries(rawReadings, timeRange),
    [rawReadings, timeRange]
  )

  // ── Per-room detailed stats ──
  const roomStats = useMemo(() => {
    if (!rawReadings || rawReadings.length === 0) return []
    const locMap = {}
    rawReadings.forEach((r) => {
      const key = `${r.kat}/${r.oda}`
      if (!locMap[key]) {
        locMap[key] = {
          kat: r.kat,
          oda: r.oda,
          readings: [],
        }
      }
      locMap[key].readings.push(r)
    })

    return Object.values(locMap).map((loc) => {
      const readings = loc.readings
      const latest = readings[0]
      const temps = readings.map((r) => Number(r.sicaklik)).filter((v) => !isNaN(v))
      const hums = readings.map((r) => Number(r.nem)).filter((v) => !isNaN(v))
      const gazCount = readings.filter((r) => r.gaz === true).length

      return {
        kat: loc.kat,
        oda: loc.oda,
        count: readings.length,
        latest,
        temp: {
          current: Number(latest.sicaklik),
          min: temps.length ? Math.min(...temps) : null,
          max: temps.length ? Math.max(...temps) : null,
          avg: temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length) : null,
          sparkData: readings.slice(0, 30).reverse().map((r) => ({ value: Number(r.sicaklik) })),
        },
        hum: {
          current: Number(latest.nem),
          min: hums.length ? Math.min(...hums) : null,
          max: hums.length ? Math.max(...hums) : null,
          avg: hums.length ? (hums.reduce((a, b) => a + b, 0) / hums.length) : null,
          sparkData: readings.slice(0, 30).reverse().map((r) => ({ value: Number(r.nem) })),
        },
        gaz: {
          current: latest.gaz,
          alertCount: gazCount,
          sparkData: readings.slice(0, 30).reverse().map((r) => ({ value: r.gaz ? 1 : 0 })),
        },
      }
    })
  }, [rawReadings])

  // Anomaly detection: gas detected or extreme values
  const anomalies = useMemo(() => {
    if (!rawReadings || rawReadings.length === 0) return []
    return rawReadings.filter((r) => {
      if (r.gaz === true) return true
      if (Number(r.sicaklik) > 35 || Number(r.sicaklik) < 10) return true
      if (Number(r.nem) > 90) return true
      return false
    }).slice(0, 20)
  }, [rawReadings])

  const anomalyColumns = [
    {
      key: 'created_at',
      label: 'Zaman',
      width: '160px',
      render: (val) => <span className="text-xs">{formatDateTime(val)}</span>,
    },
    {
      key: 'kat',
      label: 'Konum',
      width: '120px',
      render: (val, row) => `${val} / ${row.oda}`,
    },
    {
      key: 'sicaklik',
      label: 'Sıcaklık',
      width: '100px',
      render: (val) => `${val} °C`,
    },
    {
      key: 'nem',
      label: 'Nem',
      width: '100px',
      render: (val) => `${val} %`,
    },
    {
      key: 'gaz',
      label: 'Gaz',
      width: '100px',
      render: (val) => (
        <StatusBadge
          status={val ? 'danger' : 'success'}
          label={val ? 'Algılandı!' : 'Temiz'}
        />
      ),
    },
  ]

  const chartLineColors = {
    sicaklik: '#EF4444',
    nem: '#4F8EF7',
    gaz: '#F59E0B',
  }

  // Latest reading info
  const latestReading = rawReadings && rawReadings.length > 0 ? rawReadings[0] : null

  // Handle floor change — reset room when floor changes
  const handleFloorChange = (floorValue) => {
    setSelectedFloor(floorValue)
    setSelectedRoom('all')
  }

  // Helper: get temp status
  const getTempStatus = (val) => {
    if (val > 35) return { label: 'Kritik Yüksek', color: 'danger' }
    if (val > 28) return { label: 'Yüksek', color: 'warning' }
    if (val < 10) return { label: 'Kritik Düşük', color: 'danger' }
    if (val < 16) return { label: 'Düşük', color: 'warning' }
    return { label: 'Normal', color: 'success' }
  }

  // Helper: get humidity status
  const getHumStatus = (val) => {
    if (val > 90) return { label: 'Çok Yüksek', color: 'danger' }
    if (val > 70) return { label: 'Yüksek', color: 'warning' }
    if (val < 30) return { label: 'Düşük', color: 'warning' }
    return { label: 'Normal', color: 'success' }
  }

  return (
    <div className="space-y-6">
      {/* ══ Floor & Room Selector ══ */}
      <div className="bg-bg-card border border-border-subtle rounded-card p-0 overflow-hidden">
        {/* Floor Tabs */}
        <div className="flex items-center border-b border-border-subtle">
          <div className="flex items-center gap-1.5 px-4 py-2 border-r border-border-subtle">
            <Building2 size={14} className="text-accent" />
            <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Kat</span>
          </div>
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {BUILDING_FLOORS.map((floor) => (
              <button
                key={floor.value}
                onClick={() => handleFloorChange(floor.value)}
                className={cn(
                  'px-4 py-3 text-sm font-medium transition-all duration-200 border-b-2 -mb-px relative whitespace-nowrap',
                  selectedFloor === floor.value
                    ? 'text-accent border-accent bg-accent/5'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-bg-card-alt/50'
                )}
              >
                {floor.label}
                {selectedFloor === floor.value && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Room Tabs (only if floor selected and has rooms) */}
        {floorConfig.rooms.length > 0 && (
          <div className="flex items-center bg-bg-card-alt/30">
            <div className="flex items-center gap-1.5 px-4 py-2 border-r border-border-subtle">
              <DoorOpen size={14} className="text-text-secondary" />
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">Oda</span>
            </div>
            <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
              {floorConfig.rooms.map((room) => (
                <button
                  key={room.value}
                  onClick={() => setSelectedRoom(room.value)}
                  className={cn(
                    'px-4 py-2.5 text-xs font-medium transition-all duration-200 relative whitespace-nowrap',
                    selectedRoom === room.value
                      ? 'text-accent'
                      : 'text-text-secondary hover:text-text-primary'
                  )}
                >
                  {room.label}
                  {selectedRoom === room.value && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ Active Filter Breadcrumb ══ */}
      <div className="flex items-center gap-2">
        <div className="bg-bg-card border border-border-subtle rounded-card px-4 py-2.5 flex items-center gap-2 flex-1">
          <Activity size={14} className="text-accent" />
          <span className="text-xs text-text-secondary">Gösterilen:</span>
          <span className="text-sm font-medium text-text-primary">{floorConfig.label}</span>
          {selectedRoom !== 'all' && floorConfig.rooms.length > 0 && (
            <>
              <ChevronRight size={12} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-primary">
                {floorConfig.rooms.find((r) => r.value === selectedRoom)?.label || selectedRoom}
              </span>
            </>
          )}
          {latestReading && (
            <span className="text-xs text-text-secondary ml-auto flex items-center gap-1">
              <Clock size={10} />
              Son veri: {formatDateTime(latestReading.created_at)}
            </span>
          )}
        </div>
        {rawReadings && (
          <div className="bg-bg-card border border-border-subtle rounded-card px-4 py-2.5 flex items-center gap-2">
            <span className="text-xs text-text-secondary">Kayıt:</span>
            <span className="text-sm font-bold text-accent">{rawReadings.length}</span>
          </div>
        )}
      </div>

      {/* ══ Per-Room Sensor Detail Cards ══ */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-bg-card border border-border-subtle rounded-card p-6">
              <Skeleton variant="text" className="w-40 mb-4" />
              <div className="grid grid-cols-3 gap-4">
                <Skeleton variant="chart" className="h-32" />
                <Skeleton variant="chart" className="h-32" />
                <Skeleton variant="chart" className="h-32" />
              </div>
            </div>
          ))}
        </div>
      ) : roomStats.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="Sensör verisi bulunamadı"
          description={
            selectedFloor === 'all'
              ? 'ESP32 cihazlarından henüz sensör verisi alınmadı. Cihazların sisteme bağlı olduğundan emin olun.'
              : `${floorConfig.label} için henüz sensör verisi bulunmuyor. Bu kata ESP32 cihazı bağlandığında veriler burada görünecektir.`
          }
        />
      ) : (
        <div className="space-y-4">
          {roomStats.map((room) => {
            const tempStatus = getTempStatus(room.temp.current)
            const humStatus = getHumStatus(room.hum.current)

            return (
              <div
                key={`${room.kat}/${room.oda}`}
                className="bg-bg-card border border-border-subtle rounded-card overflow-hidden"
              >
                {/* Room Header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-border-subtle bg-bg-card-alt/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <DoorOpen size={16} className="text-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">
                        {room.kat.replace('kat', 'Kat ')} — {room.oda.replace('oda', 'Oda ')}
                      </h3>
                      <span className="text-[10px] text-text-secondary">
                        {room.count} kayıt • Son güncelleme: {formatDateTime(room.latest.created_at)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.gaz.current && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-danger/15 text-danger animate-pulse-subtle">
                        ⚠ GAZ ALGILANDI
                      </span>
                    )}
                  </div>
                </div>

                {/* Sensor Grid */}
                <div className="grid grid-cols-3 divide-x divide-border-subtle">
                  {/* ── Sıcaklık ── */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Thermometer size={14} className="text-red-400" />
                        <span className="text-xs font-medium text-text-secondary">Sıcaklık</span>
                      </div>
                      <StatusBadge status={tempStatus.color} label={tempStatus.label} />
                    </div>
                    <div className="text-3xl font-bold text-text-primary mb-1">
                      {room.temp.current.toFixed(1)}
                      <span className="text-sm font-normal text-text-secondary ml-1">°C</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5">
                          <TrendingDown size={10} />
                          <span className="text-[9px] uppercase tracking-wider font-semibold">Min</span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">{room.temp.min?.toFixed(1)}°</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-text-secondary mb-0.5">
                          <Gauge size={10} />
                          <span className="text-[9px] uppercase tracking-wider font-semibold">Ort</span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">{room.temp.avg?.toFixed(1)}°</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-400 mb-0.5">
                          <TrendingUp size={10} />
                          <span className="text-[9px] uppercase tracking-wider font-semibold">Max</span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">{room.temp.max?.toFixed(1)}°</span>
                      </div>
                    </div>
                    <SensorSparkline data={room.temp.sparkData} color="#EF4444" />
                  </div>

                  {/* ── Nem ── */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Droplets size={14} className="text-blue-400" />
                        <span className="text-xs font-medium text-text-secondary">Nem</span>
                      </div>
                      <StatusBadge status={humStatus.color} label={humStatus.label} />
                    </div>
                    <div className="text-3xl font-bold text-text-primary mb-1">
                      {room.hum.current.toFixed(1)}
                      <span className="text-sm font-normal text-text-secondary ml-1">%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-400 mb-0.5">
                          <TrendingDown size={10} />
                          <span className="text-[9px] uppercase tracking-wider font-semibold">Min</span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">{room.hum.min?.toFixed(1)}%</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-text-secondary mb-0.5">
                          <Gauge size={10} />
                          <span className="text-[9px] uppercase tracking-wider font-semibold">Ort</span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">{room.hum.avg?.toFixed(1)}%</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-red-400 mb-0.5">
                          <TrendingUp size={10} />
                          <span className="text-[9px] uppercase tracking-wider font-semibold">Max</span>
                        </div>
                        <span className="text-xs font-bold text-text-primary">{room.hum.max?.toFixed(1)}%</span>
                      </div>
                    </div>
                    <SensorSparkline data={room.hum.sparkData} color="#4F8EF7" />
                  </div>

                  {/* ── Gaz Algılama ── */}
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Flame size={14} className={room.gaz.current ? 'text-danger' : 'text-green-400'} />
                        <span className="text-xs font-medium text-text-secondary">Gaz Algılama</span>
                      </div>
                      <StatusBadge
                        status={room.gaz.current ? 'danger' : 'success'}
                        label={room.gaz.current ? 'Tehlike!' : 'Temiz'}
                      />
                    </div>
                    <div className={cn(
                      'text-3xl font-bold mb-1',
                      room.gaz.current ? 'text-danger' : 'text-success'
                    )}>
                      {room.gaz.current ? '⚠ UYARI' : '✓ Temiz'}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="text-center">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-text-secondary block mb-0.5">Anlık Durum</span>
                        <span className={cn(
                          'text-xs font-bold',
                          room.gaz.current ? 'text-danger' : 'text-success'
                        )}>
                          {room.gaz.current ? 'Gaz Var' : 'Gaz Yok'}
                        </span>
                      </div>
                      <div className="text-center">
                        <span className="text-[9px] uppercase tracking-wider font-semibold text-text-secondary block mb-0.5">Toplam Uyarı</span>
                        <span className={cn(
                          'text-xs font-bold',
                          room.gaz.alertCount > 0 ? 'text-warning' : 'text-success'
                        )}>
                          {room.gaz.alertCount} kez
                        </span>
                      </div>
                    </div>
                    <SensorSparkline data={room.gaz.sparkData} color="#F59E0B" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ Time Series Chart ══ */}
      {!loading && roomStats.length > 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-text-primary">Zaman Serisi</h2>
            <div className="flex items-center gap-1">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.value}
                  onClick={() => setTimeRange(tr.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-btn transition-colors duration-150',
                    timeRange === tr.value
                      ? 'bg-accent text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-card-alt'
                  )}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94A3B8', fontSize: 11 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111118',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94A3B8' }} />
                <Line
                  type="monotone"
                  dataKey="sicaklik"
                  name="Sıcaklık (°C)"
                  stroke={chartLineColors.sicaklik}
                  strokeWidth={1.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="nem"
                  name="Nem (%)"
                  stroke={chartLineColors.nem}
                  strokeWidth={1.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Seçili zaman aralığında veri yok" />
          )}
        </div>
      )}

      {/* ══ Anomaly Table ══ */}
      <div>
        <h2 className="text-sm font-semibold text-text-primary mb-3">Anomali Tablosu (Gaz / Aşırı Değerler)</h2>
        <DataTable
          columns={anomalyColumns}
          data={anomalies || []}
          loading={loading}
          emptyMessage="Tespit edilen anomali bulunmuyor."
        />
      </div>
    </div>
  )
}
