type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Returns true when the key is blocked (already over quota). */
export function hitRateLimit(
  key: string,
  opts: { windowMs: number; maxRequests: number },
): boolean {
  const nowMs = Date.now()
  if (buckets.size > 5000 && Math.random() < 0.05) {
    buckets.forEach((b, key) => {
      if (b.resetAt <= nowMs) buckets.delete(key)
    })
  }

  const b = buckets.get(key)
  if (!b || b.resetAt <= nowMs) {
    buckets.set(key, {
      count: 1,
      resetAt: nowMs + opts.windowMs,
    })
    return false
  }

  if (b.count >= opts.maxRequests) return true
  b.count += 1
  return false
}

export function clientIpFromHeaders(requestHeaders: Headers): string {
  return (
    requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? requestHeaders.get('x-real-ip')
    ?? 'unknown'
  )
}
