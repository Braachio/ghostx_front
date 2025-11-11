type Bucket = { tokens: number; lastRefill: number }

export class IpRateLimiter {
  private buckets = new Map<string, Bucket>()
  constructor(private ratePerMin: number = 60) {}

  allow(ip: string, cost = 1): boolean {
    const now = Date.now()
    const refillRatePerMs = this.ratePerMin / 60_000
    const b = this.buckets.get(ip) || { tokens: this.ratePerMin, lastRefill: now }
    const elapsed = now - b.lastRefill
    b.tokens = Math.min(this.ratePerMin, b.tokens + elapsed * refillRatePerMs)
    b.lastRefill = now
    if (b.tokens >= cost) {
      b.tokens -= cost
      this.buckets.set(ip, b)
      return true
    }
    this.buckets.set(ip, b)
    return false
  }
}

export function getClientIp(req: Request): string {
  // NextRequest also exposes headers
  // Try common proxy headers
  const xf = (req.headers.get('x-forwarded-for') || '').split(',')[0]?.trim()
  return xf || req.headers.get('x-real-ip') || 'unknown'
}


