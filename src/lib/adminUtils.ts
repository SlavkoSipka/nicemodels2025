/**
 * Pure, server-agnostic admin utility functions.
 * Safe to import from both server routes AND client components.
 */

export type RangeKey = '7d' | '30d' | '90d' | 'all'

export function rangeToDate(range: RangeKey): Date | null {
  const now = Date.now()
  switch (range) {
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000)
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000)
    case '90d':
      return new Date(now - 90 * 24 * 60 * 60 * 1000)
    case 'all':
    default:
      return null
  }
}

export function parseRange(url: URL): RangeKey {
  const r = url.searchParams.get('range')
  if (r === '7d' || r === '30d' || r === '90d' || r === 'all') return r
  return '30d'
}

/**
 * Group an array of rows (each with a `created_at` ISO string) into dense daily
 * buckets from `since` up to today, zero-filling missing days.
 */
export function bucketByDay<T extends { created_at: string }>(
  rows: T[],
  since: Date | null,
  classify?: (row: T) => string
): { date: string; count: number; [k: string]: any }[] {
  const start = since
    ? new Date(since)
    : (() => {
        let earliest = Date.now()
        for (const r of rows) {
          const t = new Date(r.created_at).getTime()
          if (t < earliest) earliest = t
        }
        return new Date(earliest)
      })()
  start.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const days: { [date: string]: Record<string, number> } = {}
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    days[d.toISOString().slice(0, 10)] = { total: 0 }
  }

  for (const r of rows) {
    const d = new Date(r.created_at)
    d.setHours(0, 0, 0, 0)
    const key = d.toISOString().slice(0, 10)
    if (!days[key]) days[key] = { total: 0 }
    days[key].total++
    if (classify) {
      const k = classify(r)
      days[key][k] = (days[key][k] || 0) + 1
    }
  }

  return Object.keys(days)
    .sort()
    .map(date => ({
      date,
      count: days[date].total,
      ...days[date],
    }))
}

/** Formats a YYYY-MM-DD key as a short chart-axis label. */
export function shortDate(d: string): string {
  const date = new Date(d)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function parseDayKey(raw: unknown): string | null {
  if (typeof raw === 'string' && raw.length >= 10) return raw.slice(0, 10)
  if (typeof raw !== 'number' && raw != null) {
    const dt = new Date(raw as Date)
    const x = dt.getTime()
    if (!Number.isFinite(x)) return null
    return dt.toISOString().slice(0, 10)
  }
  return null
}

/** Zero-fill daily page-view series from RPC `series` JSON (UTC dates). */
export function denseTrafficSeriesFromRpc(
  pts: unknown,
  since: Date | null,
): { date: string; views: number }[] {
  const rows = Array.isArray(pts)
    ? (pts as { date?: unknown; views?: unknown }[])
    : []
  const viewsByDay = new Map<string, number>()
  for (const p of rows) {
    if (!p?.date) continue
    const k = parseDayKey(p.date)
    if (!k) continue
    viewsByDay.set(k, Number(p.views ?? 0))
  }

  let start: Date
  if (since) {
    start = new Date(since)
    start.setHours(0, 0, 0, 0)
  } else if (viewsByDay.size > 0) {
    const times = [...viewsByDay.keys()].map(k => new Date(`${k}T00:00:00Z`).getTime())
    start = new Date(Math.min(...times))
    start.setHours(0, 0, 0, 0)
  } else {
    start = new Date()
    start.setHours(0, 0, 0, 0)
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const out: { date: string; views: number }[] = []
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    out.push({ date: key, views: viewsByDay.get(key) ?? 0 })
  }
  return out
}
