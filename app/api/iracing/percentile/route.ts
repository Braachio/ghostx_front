import { NextRequest, NextResponse } from 'next/server'
import type { PercentileResponse } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const cache = new TtlCache<PercentileResponse>(6 * 60 * 60_000)
const limiter = new IpRateLimiter(120)

export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  const { searchParams } = new URL(req.url)
  const metric = (searchParams.get('metric') || 'irating') as 'irating' | 'sr'
  const value = Number(searchParams.get('value') || '0')
  const country = (searchParams.get('country') || '').toUpperCase()
  if (!Number.isFinite(value)) return NextResponse.json({ error: 'value 숫자 필요' }, { status: 400 })

  const key = `pct:${metric}:${value}:${country}`
  const cached = cache.get(key)
  if (cached) return NextResponse.json(cached)

  // TODO: Replace with real histogram-based percentile calculation
  // Mock: 가우시안 근사 기반 임시 퍼센타일
  const mockTotal = 100000
  const globalPct = Math.max(0, Math.min(1, 1 - Math.exp(-Math.max(value - 1000, 0) / 1500)))
  const krPct = country ? Math.max(0, Math.min(1, 1 - Math.exp(-Math.max(value - 900, 0) / 1400))) : undefined

  const payload: PercentileResponse = {
    metric,
    value,
    global: { percentile: Number((globalPct * 100).toFixed(2)), total: mockTotal },
    country: country ? { code: country, percentile: Number(((krPct ?? globalPct) * 100).toFixed(2)), total: Math.floor(mockTotal * 0.1) } : undefined,
    snapshotAt: new Date().toISOString(),
  }
  cache.set(key, payload, 60 * 60_000)
  return NextResponse.json(payload)
}


