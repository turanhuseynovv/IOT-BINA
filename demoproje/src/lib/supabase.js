/**
 * Mock Supabase Client — Demo Mode
 * Gerçek Supabase bağlantısı yoktur. Tüm veriler yerel sahte verilerdir.
 */
import { DATA_STORE, MOCK_STORAGE } from './mockData.js'

// ── Auth State ──
let _currentUser = null
let _currentSession = null
let _authListeners = []

const DEMO_USER = {
  id: 'demo-user-001',
  email: 'admin@smartbuilding.io',
  user_metadata: { name: 'Demo Admin' },
  created_at: new Date().toISOString(),
}

const DEMO_PASSWORD = 'demo1234'

// ── Query Builder (mimics Supabase chainable API) ──
class MockQueryBuilder {
  constructor(tableName) {
    this._table = tableName
    this._filters = []
    this._orderCol = null
    this._ascending = false
    this._limitN = null
    this._single = false
    this._insertData = null
    this._updateData = null
  }

  select() { return this }

  eq(col, val) { this._filters.push({ op: 'eq', col, val }); return this }
  neq(col, val) { this._filters.push({ op: 'neq', col, val }); return this }
  gte(col, val) { this._filters.push({ op: 'gte', col, val }); return this }
  lte(col, val) { this._filters.push({ op: 'lte', col, val }); return this }
  gt(col, val) { this._filters.push({ op: 'gt', col, val }); return this }
  lt(col, val) { this._filters.push({ op: 'lt', col, val }); return this }
  in(col, vals) { this._filters.push({ op: 'in', col, vals }); return this }
  like(col, val) { this._filters.push({ op: 'like', col, val }); return this }
  ilike(col, val) { this._filters.push({ op: 'ilike', col, val }); return this }
  is(col, val) { this._filters.push({ op: 'is', col, val }); return this }

  order(col, opts = {}) {
    this._orderCol = col
    this._ascending = opts.ascending ?? false
    return this
  }

  limit(n) { this._limitN = n; return this }

  maybeSingle() { this._single = true; return this }

  insert(data) {
    this._insertData = data
    return this
  }

  update(data) {
    this._updateData = data
    return this
  }

  _applyFilters(data) {
    let result = [...data]
    for (const f of this._filters) {
      switch (f.op) {
        case 'eq':  result = result.filter(r => r[f.col] === f.val); break
        case 'neq': result = result.filter(r => r[f.col] !== f.val); break
        case 'gte': result = result.filter(r => r[f.col] >= f.val); break
        case 'lte': result = result.filter(r => r[f.col] <= f.val); break
        case 'gt':  result = result.filter(r => r[f.col] > f.val); break
        case 'lt':  result = result.filter(r => r[f.col] < f.val); break
        case 'in':  result = result.filter(r => f.vals.includes(r[f.col])); break
        case 'is':  result = result.filter(r => r[f.col] === f.val); break
        case 'like': {
          const pattern = f.val.replace(/%/g, '.*')
          const re = new RegExp(`^${pattern}$`)
          result = result.filter(r => re.test(String(r[f.col])))
          break
        }
        case 'ilike': {
          const pattern = f.val.replace(/%/g, '.*')
          const re = new RegExp(`^${pattern}$`, 'i')
          result = result.filter(r => re.test(String(r[f.col])))
          break
        }
      }
    }
    return result
  }

  then(resolve, reject) {
    try {
      const tableData = DATA_STORE[this._table] || []

      // INSERT
      if (this._insertData) {
        const newRow = { id: `mock-insert-${Date.now()}`, ...this._insertData }
        tableData.unshift(newRow)
        resolve({ data: newRow, error: null })
        return
      }

      // UPDATE
      if (this._updateData) {
        let filtered = this._applyFilters(tableData)
        filtered.forEach(item => {
          Object.assign(item, this._updateData)
        })
        resolve({ data: filtered, error: null })
        return
      }

      // SELECT
      let result = this._applyFilters(tableData)

      if (this._orderCol) {
        result.sort((a, b) => {
          const aVal = a[this._orderCol]
          const bVal = b[this._orderCol]
          if (aVal < bVal) return this._ascending ? -1 : 1
          if (aVal > bVal) return this._ascending ? 1 : -1
          return 0
        })
      }

      if (this._limitN) result = result.slice(0, this._limitN)

      if (this._single) {
        resolve({ data: result[0] || null, error: null })
      } else {
        resolve({ data: result, error: null })
      }
    } catch (err) {
      if (reject) reject(err)
      else resolve({ data: null, error: err })
    }
  }
}

// ── Storage Mock ──
class MockStorageBucket {
  constructor(bucketName) {
    this._bucket = bucketName
  }

  async list() {
    return { data: MOCK_STORAGE[this._bucket] || [], error: null }
  }

  getPublicUrl(name) {
    return { data: { publicUrl: `/demo/${name}` } }
  }
}

// ── Channel Mock (realtime) ──
class MockChannel {
  on() { return this }
  subscribe() { return this }
  unsubscribe() {}
}

// ── Main Supabase Mock ──
export const supabase = {
  from(table) {
    return new MockQueryBuilder(table)
  },

  auth: {
    async getSession() {
      return { data: { session: _currentSession } }
    },

    onAuthStateChange(callback) {
      _authListeners.push(callback)
      // Fire immediately with current state
      setTimeout(() => callback('INITIAL_SESSION', _currentSession), 0)
      return {
        data: {
          subscription: {
            unsubscribe() {
              _authListeners = _authListeners.filter(l => l !== callback)
            }
          }
        }
      }
    },

    async signInWithPassword({ email, password }) {
      if (email === DEMO_USER.email && password === DEMO_PASSWORD) {
        _currentUser = DEMO_USER
        _currentSession = { user: DEMO_USER, access_token: 'demo-token' }
        _authListeners.forEach(cb => cb('SIGNED_IN', _currentSession))
        return { data: { user: DEMO_USER, session: _currentSession }, error: null }
      }
      throw new Error('Invalid login credentials')
    },

    async signOut() {
      _currentUser = null
      _currentSession = null
      _authListeners.forEach(cb => cb('SIGNED_OUT', null))
      return { error: null }
    },
  },

  storage: {
    from(bucket) {
      return new MockStorageBucket(bucket)
    },
  },

  channel() {
    return new MockChannel()
  },

  removeChannel() {},
}
