/**
 * Format a date as DD.MM.YYYY (Turkish locale)
 */
export function formatDate(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}.${month}.${year}`
}

/**
 * Format a date as HH:mm (24-hour, Turkish locale)
 */
export function formatTime(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Format a date as DD.MM.YYYY HH:mm
 */
export function formatDateTime(date) {
  if (!date) return '—'
  return `${formatDate(date)} ${formatTime(date)}`
}

/**
 * Format relative time in Turkish (e.g., "5 dakika önce")
 */
export function formatRelativeTime(date) {
  if (!date) return '—'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '—'
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'Az önce'
  if (diffMin < 60) return `${diffMin} dakika önce`
  if (diffHour < 24) return `${diffHour} saat önce`
  if (diffDay < 7) return `${diffDay} gün önce`
  return formatDate(date)
}

/**
 * Calculate comfort score from sensor averages (0-100).
 * Each sensor contributes up to 20 points.
 */
export function calculateComfortScore(sensors) {
  if (!sensors || Object.keys(sensors).length === 0) return null

  let score = 0
  let count = 0

  // Temperature: ideal 20-24°C
  if (sensors.temperature != null) {
    const t = sensors.temperature
    if (t >= 20 && t <= 24) score += 20
    else if (t >= 18 && t <= 26) score += 14
    else if (t >= 15 && t <= 30) score += 8
    else score += 2
    count++
  }

  // Humidity: ideal 40-60%
  if (sensors.humidity != null) {
    const h = sensors.humidity
    if (h >= 40 && h <= 60) score += 20
    else if (h >= 30 && h <= 70) score += 14
    else if (h >= 20 && h <= 80) score += 8
    else score += 2
    count++
  }

  // CO2: ideal < 600ppm
  if (sensors.co2 != null) {
    const c = sensors.co2
    if (c < 600) score += 20
    else if (c < 800) score += 14
    else if (c < 1000) score += 8
    else score += 2
    count++
  }

  // Noise: ideal < 40dB
  if (sensors.noise != null) {
    const n = sensors.noise
    if (n < 40) score += 20
    else if (n < 55) score += 14
    else if (n < 70) score += 8
    else score += 2
    count++
  }

  // Light: ideal 300-500 lux
  if (sensors.light != null) {
    const l = sensors.light
    if (l >= 300 && l <= 500) score += 20
    else if (l >= 200 && l <= 700) score += 14
    else if (l >= 100 && l <= 900) score += 8
    else score += 2
    count++
  }

  if (count === 0) return null
  // Normalize to 0-100 based on number of available sensors
  return Math.round((score / (count * 20)) * 100)
}

/**
 * Get color class based on comfort score
 */
export function getScoreColor(score) {
  if (score == null) return 'text-text-secondary'
  if (score >= 70) return 'text-success'
  if (score >= 40) return 'text-warning'
  return 'text-danger'
}

/**
 * Get background color class based on comfort score
 */
export function getScoreBgColor(score) {
  if (score == null) return 'bg-bg-card-alt'
  if (score >= 70) return 'bg-success/10'
  if (score >= 40) return 'bg-warning/10'
  return 'bg-danger/10'
}

/**
 * Conditional class name merging utility
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

/**
 * Get today's date range (start of day → now) in ISO format
 */
export function getTodayRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return { start: start.toISOString(), end: now.toISOString() }
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength = 50) {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '…'
}
