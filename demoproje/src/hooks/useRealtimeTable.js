import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Generic hook for subscribing to Supabase Realtime changes on a table.
 * Returns the latest data and auto-merges INSERT/UPDATE/DELETE events.
 *
 * @param {string} table - Table name
 * @param {object} options
 * @param {string} options.select - Column selection
 * @param {string} options.order - Order column
 * @param {boolean} options.ascending - Order direction
 * @param {number} options.limit - Row limit
 * @param {string} options.event - Event type to listen for ('*', 'INSERT', 'UPDATE', 'DELETE')
 * @param {string} options.filterColumn - Column to filter realtime events
 * @param {string} options.filterValue - Value to filter realtime events
 * @param {boolean} options.enabled - Whether to run (default true)
 */
export function useRealtimeTable(table, options = {}) {
  const {
    select = '*',
    order = 'created_at',
    ascending = false,
    limit,
    event = '*',
    filterColumn,
    filterValue,
    enabled = true,
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const channelRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    // Initial fetch
    async function fetchInitial() {
      try {
        let query = supabase.from(table).select(select)

        if (order) {
          query = query.order(order, { ascending })
        }
        if (limit) {
          query = query.limit(limit)
        }

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
        console.error(`Realtime initial fetch error (${table}):`, err)
        setError(err.message)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchInitial()

    // Set up realtime subscription
    const channelName = `realtime-${table}-${Date.now()}`
    let channelConfig = {
      event,
      schema: 'public',
      table,
    }

    if (filterColumn && filterValue) {
      channelConfig.filter = `${filterColumn}=eq.${filterValue}`
    }

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', channelConfig, (payload) => {
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

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [table, select, order, ascending, limit, event, filterColumn, filterValue, enabled])

  return { data, loading, error, setData }
}
