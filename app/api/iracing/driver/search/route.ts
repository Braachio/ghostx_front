import { NextRequest, NextResponse } from 'next/server'
import type { IracingDriverSummary } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'

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

  // TODO: Replace with real iRacing Data API call
  // This is a mocked response for scaffolding.
  const results: IracingDriverSummary[] = [
    { custId: '12345', name: `${q} (예시)`, country: 'KR', irating: 2500, licenseClass: 'A' },
  ]

  cache.set(cacheKey, results, 2 * 60_000)
  return NextResponse.json(results)
}


