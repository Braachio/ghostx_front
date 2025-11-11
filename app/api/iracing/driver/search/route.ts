import { NextRequest, NextResponse } from 'next/server'
import type { IracingDriverSummary } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const cache = new TtlCache<IracingDriverSummary[]>(10 * 60_000)
const limiter = new IpRateLimiter(60) // 60 req/min/IP

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ error: '쿼리는 2자 이상이어야 합니다.' }, { status: 400 })
  }

  const ip = getClientIp(req)
  if (!limiter.allow(ip)) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  }

  const cacheKey = `search:${q.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    if (IRACING_MOCK) {
      console.log('[Driver Search] Using mock data (IRACING_MOCK enabled or credentials missing)')
      const results: IracingDriverSummary[] = [
        { custId: '1001', name: `${q} Kim`, country: 'KR', irating: 2800, licenseClass: 'A' },
        { custId: '1002', name: `${q} Park`, country: 'KR', irating: 2200, licenseClass: 'B' },
      ]
      cache.set(cacheKey, results, 60_000)
      return NextResponse.json(results)
    }
    
    console.log('[Driver Search] Using real iRacing API')
    // NOTE: iRacing API의 /data/member/get은 search 파라미터를 지원하지 않을 수 있습니다.
    // 실제 API 문서를 확인하여 올바른 엔드포인트를 사용해야 할 수 있습니다.
    const data = await irGet<{ members?: Array<{ cust_id: number; display_name: string; country?: string; i_rating?: number; license_level?: string }> }>(
      '/data/member/get',
      { search: q }
    )
    const results: IracingDriverSummary[] = (data?.members || []).map(m => ({
      custId: String(m.cust_id),
      name: m.display_name,
      country: m.country || null,
      irating: m.i_rating ?? null,
      licenseClass: m.license_level ?? null,
    }))
    cache.set(cacheKey, results, 2 * 60_000)
    return NextResponse.json(results)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}


