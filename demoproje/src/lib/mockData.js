/**
 * Mock Data Layer — IoT Akıllı Bina Takip Sistemi
 * Tüm veriler sahte/demo amaçlıdır. Gerçek kişi veya kurum ile ilgisi yoktur.
 */

// ── Helpers ──
let _idCounter = 1000
function uid() { return `mock-${_idCounter++}` }
function minutesAgo(n) { return new Date(Date.now() - n * 60 * 1000).toISOString() }
function hoursAgo(n) { return new Date(Date.now() - n * 3600 * 1000).toISOString() }
function daysAgo(n) { return new Date(Date.now() - n * 86400 * 1000).toISOString() }

// Seeded pseudo-random for consistency
function seededRandom(seed) {
  let s = seed
  return function () {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

const rand = seededRandom(42)
function randBetween(min, max) { return min + rand() * (max - min) }
function randInt(min, max) { return Math.floor(randBetween(min, max + 1)) }
function pick(arr) { return arr[randInt(0, arr.length - 1)] }

// ── Visitor Data ──
const VISITOR_NAMES = Array.from({ length: 150 }, (_, i) => i + 1)
const VISIT_FREQUENCIES = [
  // kisi_id, number of visits (weighted to create realistic distribution)
  ...Array.from({ length: 15 }, (_, i) => ({ id: i + 1, visits: randInt(30, 50) })),   // Düzenli
  ...Array.from({ length: 20 }, (_, i) => ({ id: i + 16, visits: randInt(15, 25) })),     // Sık
  ...Array.from({ length: 30 }, (_, i) => ({ id: i + 36, visits: randInt(5, 10) })),   // Ara sıra
  ...Array.from({ length: 50 }, (_, i) => ({ id: i + 66, visits: randInt(1, 3) })),               // Tek seferlik
]

function generateVisits() {
  const visits = []
  VISIT_FREQUENCIES.forEach(({ id, visits: count }) => {
    for (let v = 0; v < count; v++) {
      const daysBack = rand() < 0.4 ? 0 : randInt(1, 29)
      const hour = randInt(7, 20)
      const minute = randInt(0, 59)
      const date = new Date(Date.now() - daysBack * 86400000)
      date.setHours(hour, minute, randInt(0, 59), 0)
      visits.push({
        id: uid(),
        kisi_id: id,
        foto_url: `https://i.pravatar.cc/150?u=kisi_${id}`,
        created_at: date.toISOString(),
        tarih: date.toISOString(),
      })
    }
  })
  // Sort by created_at descending
  visits.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return visits
}

// ── Sensor Data ──
function generateSensorData() {
  const readings = []
  const rooms = [
    { kat: 'kat3', oda: 'oda1' },
    { kat: 'kat3', oda: 'oda2' },
    { kat: 'kat4', oda: 'oda1' },
    { kat: 'kat4', oda: 'oda2' },
  ]

  // Generate last 72 hours of data, one reading every 5 minutes per room
  const totalMinutes = 72 * 60
  const interval = 5

  rooms.forEach((room) => {
    let baseTemp = 20 + rand() * 5  // 20-25 base
    let baseHum = 45 + rand() * 15  // 45-60 base

    for (let m = 0; m < totalMinutes; m += interval) {
      // Smooth random walk
      baseTemp += (rand() - 0.5) * 1.2
      baseHum += (rand() - 0.5) * 2.5

      // Clamp to realistic ranges
      baseTemp = Math.max(16, Math.min(34, baseTemp))
      baseHum = Math.max(25, Math.min(85, baseHum))

      // Occasional anomaly (2% chance)
      const isAnomaly = rand() < 0.02
      const temp = isAnomaly ? baseTemp + randBetween(8, 15) : baseTemp
      const gaz = rand() < 0.03 // 3% chance gas detected

      readings.push({
        id: uid(),
        kat: room.kat,
        oda: room.oda,
        sicaklik: parseFloat(temp.toFixed(1)),
        nem: parseFloat(baseHum.toFixed(1)),
        gaz: gaz,
        created_at: minutesAgo(m),
      })
    }
  })

  // Sort descending by created_at
  readings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return readings
}

// ── Camera Events ──
function generateCameraEvents() {
  const events = []
  const suspectPhotos = [
    '/demo/suspect_1.webp',
    '/demo/suspect_2.webp',
    '/demo/suspect_3.webp',
    '/demo/suspect_4.webp',
  ]

  // 150 total camera events over last 14 days
  for (let i = 0; i < 150; i++) {
    const dBack = rand() < 0.5 ? 0 : randInt(1, 13) // %50 chance it's today
    const hour = randInt(0, 23)
    const date = new Date(Date.now() - dBack * 86400000)
    date.setHours(hour, randInt(0, 59), 0, 0)

    const isSuspicious = rand() < 0.25 || i < 15  // ~25% suspicious, plus guarantee some
    events.push({
      id: uid(),
      camera_type: pick(['dis_kamera', 'ic_kamera']),
      captured_at: date.toISOString(),
      photo_url: isSuspicious
        ? (rand() < 0.4 ? suspectPhotos[i % suspectPhotos.length] : `https://i.pravatar.cc/300?u=suspect_${i}`)
        : `https://i.pravatar.cc/300?u=cam_${i}`,
      is_flagged: isSuspicious,
      flag_count: isSuspicious ? randInt(1, 4) : 0,
    })
  }

  events.sort((a, b) => new Date(b.captured_at) - new Date(a.captured_at))
  return events
}

// ── Security Alerts ──
function generateSecurityAlerts() {
  const types = [
    { alert_type: 'gas_detected', description: 'Kat 3 Oda 1\'de gaz algılandı', severity: 'high' },
    { alert_type: 'temperature_high', description: 'Kat 4 Oda 2 sıcaklık 35°C üzerine çıktı', severity: 'medium' },
    { alert_type: 'suspicious_person', description: 'Dış kamerada şüpheli kişi tespit edildi', severity: 'high' },
    { alert_type: 'humidity_warning', description: 'Kat 3 Oda 2 nem seviyesi %85 üzerine çıktı', severity: 'low' },
    { alert_type: 'sensor_offline', description: 'ESP32 Kat 4 Oda 1 sensörü çevrimdışı', severity: 'medium' },
    { alert_type: 'gas_detected', description: 'Kat 4 Oda 1\'de gaz algılandı', severity: 'high' },
    { alert_type: 'door_forced', description: 'Ana giriş kapısında zorlama tespit edildi', severity: 'high' },
    { alert_type: 'temperature_low', description: 'Kat 3 Oda 1 sıcaklık 15°C altına düştü', severity: 'low' },
    { alert_type: 'multiple_entry', description: 'Aynı kişi kısa sürede 5 kez giriş yaptı', severity: 'medium' },
    { alert_type: 'camera_offline', description: 'Dış kamera bağlantısı kesildi', severity: 'medium' },
    { alert_type: 'gas_detected', description: 'Kat 3 Oda 2\'de düşük seviye gaz algılandı', severity: 'low' },
    { alert_type: 'suspicious_person', description: 'İç kamerada tanınmayan kişi tespit edildi', severity: 'medium' },
    { alert_type: 'temperature_high', description: 'Kat 3 Oda 1 sıcaklık 32°C seviyesinde', severity: 'medium' },
    { alert_type: 'power_outage', description: 'Kat 4 elektrik kesintisi algılandı', severity: 'high' },
    { alert_type: 'humidity_warning', description: 'Kat 4 Oda 2 nem seviyesi kritik', severity: 'medium' },
  ]

  const alerts = []
  for (let i = 0; i < 60; i++) {
    const t = types[i % types.length]
    alerts.push({
      id: uid(),
      ...t,
      created_at: hoursAgo(rand() < 0.6 ? randBetween(0, 23) : randBetween(24, 168)),
      resolved: rand() < 0.6,
    })
  }

  alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return alerts
}

// ── Generate All Data ──
export const MOCK_VISITS = generateVisits()
export const MOCK_SENSOR_DATA = generateSensorData()
export const MOCK_CAMERA_EVENTS = generateCameraEvents()
export const MOCK_SECURITY_ALERTS = generateSecurityAlerts()

// Storage mock data
export const MOCK_STORAGE = {
  ziyaretciler: Array.from({ length: 10 }, (_, i) => ({
    name: `visitor_${i + 1}.jpg`,
    id: `file_${i}`,
    created_at: daysAgo(i),
  })),
  guvenlik_fotolari: Array.from({ length: 5 }, (_, i) => ({
    name: `suspect_${i + 1}.jpg`,
    id: `sec_${i}`,
    created_at: daysAgo(i),
  })),
}

// Combined data store (mutable for insert/update operations)
export const DATA_STORE = {
  ziyaretler: MOCK_VISITS,
  sensor_data: MOCK_SENSOR_DATA,
  camera_events: MOCK_CAMERA_EVENTS,
  security_alerts: MOCK_SECURITY_ALERTS,
}
