import { NextRequest, NextResponse } from 'next/server'
import { TtlCache } from '@/lib/ttlCache'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

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
const limiter = new IpRateLimiter(30)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  if (!sessionId) return NextResponse.json({ error: 'sessionId 필요' }, { status: 400 })
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) return NextResponse.json({ error: 'rate limit' }, { status: 429 })

  const key = `sess:${sessionId}:summary`
  const cached = cache.get(key)
  if (cached) return NextResponse.json(cached)

  try {
    if (IRACING_MOCK) {
      console.log(`[Session Summary] Using mock data for sessionId: ${sessionId}`)
      const participants = [
        { custId: '1001', name: 'Mock Kim', country: 'KR', irating: 2800, safetyRating: 3.9, stability: { incPerRace: 0.6, dnfRate: 0.05 }, pace: { estLap: 87.3 } },
        { custId: '1002', name: 'Mock Park', country: 'KR', irating: 2200, safetyRating: 3.2, stability: { incPerRace: 1.1, dnfRate: 0.12 }, pace: { estLap: 90.5 } },
      ]
      const sof = Math.round((participants[0].irating! + participants[1].irating!) / 2)
      return NextResponse.json({ sessionId, sofEstimate: sof, participants, snapshotAt: new Date().toISOString() })
    }
    
    console.log(`[Session Summary] Fetching real data for sessionId: ${sessionId}`)
    // 1) 참가자 목록
    const res = await fetch(`${new URL(req.url).origin}/api/iracing/session/${sessionId}/participants`)
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
      // 404 에러는 세션이 존재하지 않음을 의미
      if (res.status === 404) {
        return NextResponse.json({ 
          error: errorData.error || `Subsession ${sessionId} does not exist or is not accessible.`,
          sessionId,
          participants: [],
          snapshotAt: new Date().toISOString()
        }, { status: 404 })
      }
      throw new Error(errorData.error || `Failed to fetch participants: ${res.status}`)
    }
    
    const participants: Array<{ custId: string; name: string }> = await res.json()
    
    console.log(`[Session Summary] Participants count: ${participants.length}`)
    if (participants.length === 0) {
      console.warn(`[Session Summary] No participants found for session ${sessionId}`)
    }

    // 2) 병렬로 최근 레이팅/프로필 조회 (간략화)
    const enriched = await Promise.all(participants.map(async p => {
      try {
        // custId를 숫자로 변환
        const custIdNum = parseInt(p.custId, 10)
        if (isNaN(custIdNum)) {
          console.warn(`[Session Summary] Invalid custId: ${p.custId}`)
          return { custId: p.custId, name: p.name, country: null, irating: null, safetyRating: null, stability: {}, pace: {} } as any
        }
        
        const prof = await irGet<{ 
          members?: Array<{ 
            cust_id: number
            display_name: string
            country?: string
            flair_name?: string
            i_rating?: number
          }> 
        }>(
          '/data/member/get',
          { cust_ids: custIdNum }
        )
        
        // ratings API는 존재하지 않을 수 있으므로 try-catch로 처리
        let rat: { i_rating?: number; safety_rating?: number } | null = null
        try {
          rat = await irGet<{ i_rating?: number; safety_rating?: number }>(
            '/data/member/ratings',
            { cust_id: custIdNum }
          )
        } catch (error) {
          // ratings가 없어도 계속 진행
        }
        
        const mem = prof?.members?.[0]
        const irating = rat?.i_rating ?? mem?.i_rating ?? null
        
        // 간단한 안정성/페이스 추정치(placeholder)
        const incPerRace = rat?.safety_rating ? Math.max(0, (4.99 - (rat.safety_rating as number)) / 1.5) : null
        const dnfRate = irating ? Math.max(0, Math.min(0.35, 0.2 - (irating - 1500) / 10000)) : null
        const estLap = irating ? Math.max(0, 100 - irating / 50) : null

        return {
          custId: p.custId,
          name: mem?.display_name || p.name,
          country: mem?.country || mem?.flair_name || null,
          irating,
          safetyRating: rat?.safety_rating ?? null,
          stability: { incPerRace, dnfRate },
          pace: { estLap },
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
    
    console.log(`[Session Summary] Final summary:`, {
      sessionId: summary.sessionId,
      sofEstimate: summary.sofEstimate,
      participantsCount: summary.participants.length,
      enrichedCount: enriched.length,
    })
    
    cache.set(key, summary, 20_000)
    return NextResponse.json(summary)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}


