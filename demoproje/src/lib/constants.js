import {
  LayoutDashboard,
  Users,
  Activity,
  AlertTriangle,
  BarChart2,
  TrendingUp,
  Sparkles,
  FileText,
  Settings,
} from 'lucide-react'

/**
 * Sidebar navigation configuration
 */
export const NAV_ITEMS = [
  { path: '/', label: 'Ana Panel', icon: LayoutDashboard },
  { path: '/visitors', label: 'Ziyaretçi Takibi', icon: Users },
  { path: '/sensors', label: 'Sensör Verileri', icon: Activity },
  { path: '/camera', label: 'Şüpheli Şahıs', icon: AlertTriangle },
  { path: '/analysis', label: 'Karşılaştırmalı Analiz', icon: BarChart2 },
  { path: '/prediction', label: 'Tahmin Motoru', icon: TrendingUp },
  { path: '/assistant', label: 'Bina Asistanı', icon: Sparkles },
  { path: '/reports', label: 'Raporlar', icon: FileText },
]

export const SETTINGS_NAV = { path: '/settings', label: 'Ayarlar', icon: Settings }

/**
 * ESP32 device list
 */
export const ESP_DEVICES = [
  { id: 'kat3/oda1', label: 'Kat 3 - Oda 1', kat: 'kat3', oda: 'oda1' },
]

/**
 * Building floor & room configuration
 * Used for floor-based sensor data browsing
 */
export const BUILDING_FLOORS = [
  {
    value: 'all',
    label: 'Tüm Katlar',
    kat: null,
    rooms: [],
  },
  {
    value: 'kat3',
    label: 'Kat 3',
    kat: 'kat3',
    rooms: [
      { value: 'all', label: 'Tüm Odalar', oda: null },
      { value: 'oda1', label: 'Oda 1', oda: 'oda1' },
      { value: 'oda2', label: 'Oda 2', oda: 'oda2' },
    ],
  },
  {
    value: 'kat4',
    label: 'Kat 4',
    kat: 'kat4',
    rooms: [
      { value: 'all', label: 'Tüm Odalar', oda: null },
      { value: 'oda1', label: 'Oda 1', oda: 'oda1' },
      { value: 'oda2', label: 'Oda 2', oda: 'oda2' },
    ],
  },
]

/**
 * Sensor type definitions with Turkish labels and units
 */
export const SENSOR_TYPES = {
  temperature: { label: 'Sıcaklık', unit: '°C', icon: '🌡️', field: 'sicaklik' },
  humidity: { label: 'Nem', unit: '%', icon: '💧', field: 'nem' },
  gas: { label: 'Gaz Algılama', unit: '', icon: '🔥', field: 'gaz' },
}

/**
 * Severity labels in Turkish
 */
export const SEVERITY_LABELS = {
  low: { label: 'Düşük', color: 'success' },
  medium: { label: 'Orta', color: 'warning' },
  high: { label: 'Yüksek', color: 'danger' },
}

/**
 * Status labels in Turkish
 */
export const STATUS_LABELS = {
  normal: { label: 'Normal', color: 'success' },
  suspicious: { label: 'Şüpheli', color: 'danger' },
  warning: { label: 'Uyarı', color: 'warning' },
  safe: { label: 'Güvenli', color: 'success' },
  critical: { label: 'Kritik', color: 'danger' },
}



/**
 * Time range filter options
 */
export const TIME_RANGES = [
  { value: '1h', label: 'Son 1 Saat' },
  { value: '24h', label: 'Son 24 Saat' },
  { value: '7d', label: 'Son 7 Gün' },
]

/**
 * Report type options
 */
export const REPORT_TYPES = [
  { value: 'weekly', label: 'Haftalık' },
  { value: 'monthly', label: 'Aylık' },
  { value: 'custom', label: 'Özel Dönem' },
]

/**
 * Page title mapping for header
 */
export const PAGE_TITLES = {
  '/': 'Ana Panel',
  '/visitors': 'Ziyaretçi Takibi',
  '/sensors': 'Sensör Verileri',
  '/camera': 'Şüpheli Şahıs',
  '/analysis': 'Karşılaştırmalı Analiz',
  '/prediction': 'Tahmin Motoru',
  '/assistant': 'Bina Asistanı',
  '/reports': 'Raporlar',
  '/settings': 'Ayarlar',
}
