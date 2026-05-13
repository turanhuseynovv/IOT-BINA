import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

/**
 * Generic hook for fetching data from Supabase with loading/error states.
 *
 * @param {string} table - Table name
 * @param {object} options
 * @param {string} options.select - Column selection (default '*')
 * @param {Array} options.filters - Array of filter objects: { column, operator, value }
 * @param {string} options.order - Column to order by
 * @param {boolean} options.ascending - Order direction (default false)
 * @param {number} options.limit - Row limit
 * @param {boolean} options.enabled - Whether to run query (default true)
 */
export function useSupabaseQuery(table, options = {}) {
  const {
    select = '*',
    filters = [],
    order = 'created_at',
    ascending = false,
    limit,
    enabled = true,
  } = options

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Serialize options for dependency tracking
  const filterKey = JSON.stringify(filters)
  const optionKey = `${table}-${select}-${filterKey}-${order}-${ascending}-${limit}-${enabled}`

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      let query = supabase.from(table).select(select)

      // Apply filters
      for (const filter of filters) {
        const { column, operator, value } = filter
        switch (operator) {
          case 'eq':
            query = query.eq(column, value)
            break
          case 'neq':
            query = query.neq(column, value)
            break
          case 'gt':
            query = query.gt(column, value)
            break
          case 'gte':
            query = query.gte(column, value)
            break
          case 'lt':
            query = query.lt(column, value)
            break
          case 'lte':
            query = query.lte(column, value)
            break
          case 'like':
            query = query.like(column, value)
            break
          case 'ilike':
            query = query.ilike(column, value)
            break
          case 'is':
            query = query.is(column, value)
            break
          case 'in':
            query = query.in(column, value)
            break
          default:
            query = query.eq(column, value)
        }
      }

      // Apply ordering
      if (order) {
        query = query.order(order, { ascending })
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit)
      }

      const { data: result, error: queryError } = await query

      if (queryError) {
        // If table doesn't exist, treat as empty data (for sensor tables that don't exist yet)
        if (queryError.code === '42P01' || queryError.message?.includes('does not exist')) {
          setData([])
        } else {
          throw queryError
        }
      } else {
        setData(result)
      }
    } catch (err) {
      console.error(`Supabase query error (${table}):`, err)
      setError(err.message || 'Veri yüklenirken bir hata oluştu.')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [optionKey])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData, setData }
}
