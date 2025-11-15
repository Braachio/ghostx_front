import { NextRequest, NextResponse } from 'next/server'
import { TtlCache } from '@/lib/ttlCache'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

type QuickSummary = {
  sessionId: string
  sofEstimate?: number | null
  participants: Array<{
    custId: string
    name: string
    country?: string | null
    irating?: number | null
    safetyRating?: number | null
  }>
  snapshotAt: string
}

const cache = new TtlCache<QuickSummary>(30_000)
const limiter = new IpRateLimiter(30)

/**
 * 빠른 세션 요약 (기본 정보만, 상세 통계 없음)
 * 상세 분석은 /advanced 엔드포인트에서 별도로 로드
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  if (!sessionId) return NextResponse.json({ error: 'sessionId 필요' }, { status: 400 })
  
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) return NextResponse.json({ error: 'rate limit' }, { status: 429 })

  const key = `sess:${sessionId}:quick`
  const cached = cache.get(key)
  if (cached) return NextResponse.json(cached)

  try {
    if (IRACING_MOCK) {
      const participants = [
        { custId: '1001', name: 'Mock Kim', country: 'KR', irating: 2800, safetyRating: 3.9 },
        { custId: '1002', name: 'Mock Park', country: 'KR', irating: 2200, safetyRating: 3.2 },
      ]
      const sof = Math.round((participants[0].irating! + participants[1].irating!) / 2)
      return NextResponse.json({ sessionId, sofEstimate: sof, participants, snapshotAt: new Date().toISOString() })
    }

    console.log(`[Quick Summary] Fetching quick data for sessionId: ${sessionId}`)
    
    // 1) 참가자 목록 가져오기
    const res = await fetch(`${new URL(req.url).origin}/api/iracing/session/${sessionId}/participants`)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      if (res.status === 404) {
        return NextResponse.json({
          error: errorData.error || `Subsession ${sessionId} does not exist.`,
          sessionId,
          participants: [],
          snapshotAt: new Date().toISOString(),
        }, { status: 404 })
      }
      throw new Error(errorData.error || `Failed to fetch participants: ${res.status}`)
    }
    
    const participants: Array<{ custId: string; name: string }> = await res.json()
    console.log(`[Quick Summary] Participants count: ${participants.length}`)

    // 2) 각 참가자의 기본 정보만 빠르게 가져오기 (병렬, 최대 20개만)
    const participantsToFetch = participants.slice(0, 20) // 너무 많으면 일부만
    
    const basicInfo = await Promise.all(participantsToFetch.map(async p => {
      try {
        const custIdNum = parseInt(p.custId, 10)
        if (isNaN(custIdNum)) {
          return { custId: p.custId, name: p.name, country: null, irating: null, safetyRating: null }
        }
        
        const prof = await irGet<{
          members?: Array<{
            cust_id: number
            display_name: string
            country?: string
            flair_name?: string
            i_rating?: number
          }>
        }>('/data/member/get', { cust_ids: custIdNum })
        
        const mem = prof?.members?.[0]
        return {
          custId: p.custId,
          name: mem?.display_name || p.name,
          country: mem?.country || mem?.flair_name || null,
          irating: mem?.i_rating ?? null,
          safetyRating: null,
        }
      } catch {
        return { custId: p.custId, name: p.name, country: null, irating: null, safetyRating: null }
      }
    }))

    // 나머지 참가자는 기본 정보만
    const remainingParticipants = participants.slice(20).map(p => ({
      custId: p.custId,
      name: p.name,
      country: null,
      irating: null,
      safetyRating: null,
    }))

    const allParticipants = [...basicInfo, ...remainingParticipants]

    // SOF 계산
    const irs = allParticipants.map(e => e.irating).filter((v): v is number => typeof v === 'number')
    const sof = irs.length ? Math.round(irs.reduce((a, b) => a + b, 0) / irs.length) : null

    const summary: QuickSummary = {
      sessionId,
      sofEstimate: sof,
      participants: allParticipants,
      snapshotAt: new Date().toISOString(),
    }

    cache.set(key, summary, 20_000)
    return NextResponse.json(summary)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    console.error(`[Quick Summary] Error:`, msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}

