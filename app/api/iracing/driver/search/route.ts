import { NextRequest, NextResponse } from 'next/server'
import type { IracingDriverSummary } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const cache = new TtlCache<IracingDriverSummary[]>(10 * 60_000)
const limiter = new IpRateLimiter(60) // 60 req/min/IP

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  let q = (searchParams.get('q') || '').trim()
  
  // # 기호 제거 (예: #1060971 -> 1060971)
  if (q.startsWith('#')) {
    q = q.substring(1).trim()
  }
  
  if (!q || q.length < 1) {
    return NextResponse.json({ error: '쿼리가 필요합니다.' }, { status: 400 })
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
    
    // iRacing API의 /data/member/get은 search 파라미터를 지원하지 않습니다.
    // 하지만 cust_id를 알고 있는 경우, 직접 조회할 수 있습니다.
    
    // 입력이 숫자인 경우 (cust_id로 추정)
    const custIdNum = parseInt(q, 10)
    if (!isNaN(custIdNum) && custIdNum > 0) {
      console.log(`[Driver Search] Treating input as cust_id: ${custIdNum}`)
      try {
        const data = await irGet<{ 
          members?: Array<{ 
            cust_id: number
            display_name: string
            country?: string
            flair_name?: string
            i_rating?: number
            license_level?: string
          }> 
        }>(
      '/data/member/get',
          { cust_ids: custIdNum }
    )
        
        console.log('[Driver Search] API response:', JSON.stringify(data, null, 2))
        console.log('[Driver Search] Members count:', data?.members?.length ?? 0)
        
    const results: IracingDriverSummary[] = (data?.members || []).map(m => ({
      custId: String(m.cust_id),
      name: m.display_name,
          country: m.country || m.flair_name || null,
      irating: m.i_rating ?? null,
      licenseClass: m.license_level ?? null,
    }))
        
        console.log('[Driver Search] Mapped results:', JSON.stringify(results, null, 2))
        
    cache.set(cacheKey, results, 2 * 60_000)
        return NextResponse.json(results)
      } catch (error) {
        console.error('[Driver Search] Failed to fetch by cust_id:', error)
        // 에러가 발생해도 빈 결과 반환 (502 대신)
        return NextResponse.json([])
      }
    }
    
    // 입력이 문자열인 경우 (이름 검색)
    // iRacing API는 이름으로 검색하는 기능을 제공하지 않습니다.
    console.warn(`[Driver Search] Name search not supported. Input "${q}" is not a valid cust_id.`)
    const results: IracingDriverSummary[] = []
    cache.set(cacheKey, results, 60_000)
    return NextResponse.json(results)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}


