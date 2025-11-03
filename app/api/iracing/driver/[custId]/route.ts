import { NextRequest, NextResponse } from 'next/server'
import type { IracingDriverDetail } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { irGet } from '@/lib/iracingClient'

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

  // Profile and stats
  const prof = await irGet<{ members: Array<{ cust_id: number; display_name: string; country?: string }> }>(
    '/data/member/get',
    { cust_ids: custId }
  )
  const ratings = await irGet<{ i_rating?: number; safety_rating?: number; licenses?: Array<{ category: string; class: string }> }>(
    '/data/member/ratings',
    { cust_id: custId }
  )

  const member = prof?.members?.[0]
  const detail: IracingDriverDetail = {
    custId,
    name: member?.display_name ?? 'Unknown',
    country: member?.country || null,
    irating: ratings?.i_rating ?? null,
    licenseClass: ratings?.licenses?.[0]?.class ?? null,
    safetyRating: ratings?.safety_rating ?? null,
    licenses: ratings?.licenses ?? null,
    lastUpdated: new Date().toISOString(),
  }

  cache.set(cacheKey, detail, 5 * 60_000)
  return NextResponse.json(detail)
}


