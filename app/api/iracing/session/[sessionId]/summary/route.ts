import { NextRequest, NextResponse } from 'next/server'
import { TtlCache } from '@/lib/ttlCache'
import { irGet } from '@/lib/iracingClient'

type Summary = {
  sessionId: string
  sofEstimate?: number | null
  participants: Array<{
    custId: string
    name: string
    country?: string | null
    irating?: number | null
    safetyRating?: number | null
    stability?: { incPerRace?: number | null; dnfRate?: number | null }
    pace?: { estLap?: number | null }
  }>
  snapshotAt: string
}

const cache = new TtlCache<Summary>(30_000)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  if (!sessionId) return NextResponse.json({ error: 'sessionId 필요' }, { status: 400 })

  const key = `sess:${sessionId}:summary`
  const cached = cache.get(key)
  if (cached) return NextResponse.json(cached)

  try {
    // 1) 참가자 목록
    const res = await fetch(`${new URL(req.url).origin}/api/iracing/session/${sessionId}/participants`)
    const participants: Array<{ custId: string; name: string }> = await res.json()

    // 2) 병렬로 최근 레이팅/프로필 조회 (간략화)
    const enriched = await Promise.all(participants.map(async p => {
      try {
        const prof = await irGet<{ members?: Array<{ cust_id: number; display_name: string; country?: string }> }>(
          '/data/member/get',
          { cust_ids: p.custId }
        )
        const rat = await irGet<{ i_rating?: number; safety_rating?: number }>(
          '/data/member/ratings',
          { cust_id: p.custId }
        )
        const mem = prof?.members?.[0]
        return {
          custId: p.custId,
          name: mem?.display_name || p.name,
          country: mem?.country || null,
          irating: rat?.i_rating ?? null,
          safetyRating: rat?.safety_rating ?? null,
          stability: { incPerRace: null, dnfRate: null },
          pace: { estLap: null },
        }
      } catch {
        return { custId: p.custId, name: p.name, country: null, irating: null, safetyRating: null, stability: {}, pace: {} } as any
      }
    }))

    // SoF 간단 추정: 평균 iR
    const irs = enriched.map(e => e.irating).filter((v): v is number => typeof v === 'number')
    const sof = irs.length ? Math.round(irs.reduce((a,b)=>a+b,0) / irs.length) : null

    const summary: Summary = {
      sessionId,
      sofEstimate: sof,
      participants: enriched,
      snapshotAt: new Date().toISOString(),
    }
    cache.set(key, summary, 20_000)
    return NextResponse.json(summary)
  } catch (e) {
    return NextResponse.json({ error: '요약 실패' }, { status: 500 })
  }
}


