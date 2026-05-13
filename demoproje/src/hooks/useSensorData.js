import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Hook that fetches ESP32 sensor data from the `sensor_data` table.
 * The ESP32 writes data in this format:
 *   { id, kat, oda, sicaklik, nem, gaz, created_at }
 *
 * This hook provides data both in raw form and transformed for UI consumption.
 *
 * @param {object} options
 * @param {string} options.kat - Filter by floor (e.g., 'kat3')
 * @param {string} options.oda - Filter by room (e.g., 'oda1')
 * @param {number} options.limit - Row limit (default 500)
 * @param {boolean} options.realtime - Enable realtime subscription (default true)
 */
export function useSensorData(options = {}) {
  const {
    kat,
    oda,
    limit = 500,
    realtime = true,
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    async function fetchInitial() {
      try {
        let query = supabase
          .from('sensor_data')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit)

        if (kat) query = query.eq('kat', kat)
        if (oda) query = query.eq('oda', oda)

        const { data: result, error: queryError } = await query

        if (queryError) {
          if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
            setData([])
          } else {
            throw queryError
          }
        } else {
          setData(result || [])
        }
      } catch (err) {
        console.error('sensor_data fetch error:', err)
        setError(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitial()

    // Set up realtime subscription
    if (realtime) {
      const channelName = `realtime-sensor_data-${Date.now()}`
      const channel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'sensor_data',
        }, (payload) => {
          setData((prev) => {
            if (!prev) return prev
            const updated = [...prev]

            switch (payload.eventType) {
              case 'INSERT':
                updated.unshift(payload.new)
                if (limit && updated.length > limit) {
                  updated.pop()
                }
                return updated

              case 'UPDATE':
                return updated.map((item) =>
                  item.id === payload.new.id ? payload.new : item
                )

              case 'DELETE':
                return updated.filter((item) => item.id !== payload.old.id)

              default:
                return updated
            }
          })
        })
        .subscribe()

      channelRef.current = channel
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [kat, oda, limit, realtime])

  return { data, loading, error }
}

/**
 * Transform raw sensor_data rows into the grouped sensor card format
 * that the UI expects.
 *
 * Input rows: { id, kat, oda, sicaklik, nem, gaz, created_at }
 * Output: Array of sensor card objects with sparkline data.
 */
export function transformToSensorCards(rawData) {
  if (!rawData || rawData.length === 0) return []

  const sensorTypes = {
    sicaklik: { label: 'Sıcaklık', unit: '°C', key: 'sicaklik', type: 'temperature' },
    nem: { label: 'Nem', unit: '%', key: 'nem', type: 'humidity' },
    gaz: { label: 'Gaz Algılama', unit: '', key: 'gaz', type: 'gas' },
  }

  return Object.entries(sensorTypes).map(([field, info]) => {
    const latest = rawData[0]
    const rawValue = latest[field]
    const value = field === 'gaz' ? (rawValue ? 1 : 0) : Number(rawValue)

    // Build sparkline data from last 24 readings
    const sparkData = rawData
      .slice(0, 24)
      .reverse()
      .map((r) => ({
        value: field === 'gaz' ? (r[field] ? 1 : 0) : Number(r[field]),
      }))

    // Determine status
    let status = 'Normal'
    let statusColor = 'success'

    if (field === 'sicaklik') {
      if (value > 28) { status = 'Yüksek'; statusColor = 'warning' }
      else if (value < 16) { status = 'Düşük'; statusColor = 'warning' }
      if (value > 35) { status = 'Kritik'; statusColor = 'danger' }
    } else if (field === 'nem') {
      if (value > 70) { status = 'Yüksek'; statusColor = 'warning' }
      else if (value < 30) { status = 'Düşük'; statusColor = 'warning' }
      if (value > 90) { status = 'Çok Yüksek'; statusColor = 'danger' }
    } else if (field === 'gaz') {
      if (rawValue === true) { status = 'Gaz Algılandı!'; statusColor = 'danger' }
      else { status = 'Temiz'; statusColor = 'success' }
    }

    return {
      type: info.type,
      field,
      label: info.label,
      unit: info.unit,
      value,
      displayValue: field === 'gaz' ? (rawValue ? 'UYARI' : 'Temiz') : value.toFixed(1),
      lastUpdated: latest.created_at,
      sparkData,
      status,
      statusColor,
      location: `${latest.kat} / ${latest.oda}`,
    }
  })
}

/**
 * Transform raw sensor_data rows into time-series chart data.
 */
export function transformToTimeSeries(rawData, timeRange = '24h') {
  if (!rawData || rawData.length === 0) return []

  const now = new Date()
  let cutoff = new Date(now)
  if (timeRange === '1h') cutoff.setHours(cutoff.getHours() - 1)
  else if (timeRange === '24h') cutoff.setDate(cutoff.getDate() - 1)
  else cutoff.setDate(cutoff.getDate() - 7)

  const filtered = rawData.filter((r) => new Date(r.created_at) >= cutoff)

  // Group by time bucket
  const buckets = {}
  filtered.forEach((r) => {
    const d = new Date(r.created_at)
    const key = timeRange === '7d'
      ? `${d.getDate()}.${d.getMonth() + 1}`
      : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

    if (!buckets[key]) buckets[key] = { label: key }
    buckets[key].sicaklik = Number(r.sicaklik)
    buckets[key].nem = Number(r.nem)
    buckets[key].gaz = r.gaz ? 1 : 0
  })

  return Object.values(buckets).reverse()
}

/**
 * Calculate sensor averages from raw sensor_data for comfort score.
 */
export function calcSensorAverages(rawData) {
  if (!rawData || rawData.length === 0) return {}

  let tempSum = 0, tempCount = 0
  let humSum = 0, humCount = 0

  rawData.forEach((r) => {
    if (r.sicaklik != null) { tempSum += Number(r.sicaklik); tempCount++ }
    if (r.nem != null) { humSum += Number(r.nem); humCount++ }
  })

  const averages = {}
  if (tempCount > 0) averages.temperature = tempSum / tempCount
  if (humCount > 0) averages.humidity = humSum / humCount

  return averages
}
