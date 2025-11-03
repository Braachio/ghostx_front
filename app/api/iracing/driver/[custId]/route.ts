import { NextRequest, NextResponse } from 'next/server'
import type { IracingDriverDetail } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'

const cache = new TtlCache<IracingDriverDetail>(10 * 60_000)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ custId: string }> }
) {
  const { custId } = await params
  if (!custId) return NextResponse.json({ error: 'custId 필요' }, { status: 400 })

  const cacheKey = `driver:${custId}`
  const cached = cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  // TODO: Replace with real iRacing Data API call
  const detail: IracingDriverDetail = {
    custId,
    name: '예시 드라이버',
    country: 'KR',
    irating: 2578,
    licenseClass: 'A',
    safetyRating: 3.45,
    licenses: [{ category: 'road', class: 'A' }],
    lastUpdated: new Date().toISOString(),
  }

  cache.set(cacheKey, detail, 5 * 60_000)
  return NextResponse.json(detail)
}


