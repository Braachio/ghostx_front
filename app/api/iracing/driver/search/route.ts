import { NextRequest, NextResponse } from 'next/server'
import type { IracingDriverSummary } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { irGet } from '@/lib/iracingClient'

const cache = new TtlCache<IracingDriverSummary[]>(10 * 60_000)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ error: '쿼리는 2자 이상이어야 합니다.' }, { status: 400 })
  }

  const cacheKey = `search:${q.toLowerCase()}`
  const cached = cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  // iRacing member search (name)
  // Note: iRacing API may not provide a direct full-text search endpoint; many integrations
  // use /data/member/get?search= or similar. Adjust path/params as per your access.
  // Here we attempt a commonly used endpoint shape.
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
}


