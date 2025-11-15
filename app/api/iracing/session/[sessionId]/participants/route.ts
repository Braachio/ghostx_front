import { NextRequest, NextResponse } from 'next/server'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { TtlCache } from '@/lib/ttlCache'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

type Participant = { custId: string; name: string; car?: string | null; teamId?: string | null }

const cache = new TtlCache<Participant[]>(60_000)
const limiter = new IpRateLimiter(60)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  if (!sessionId) return NextResponse.json({ error: 'sessionId 필요' }, { status: 400 })
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) return NextResponse.json({ error: 'rate limit' }, { status: 429 })

  const key = `sess:${sessionId}:parts`
  const cached = cache.get(key)
  if (cached) return NextResponse.json(cached)

  // NOTE: iRacing 세션/서브세션 참여자 API는 시리즈/타입에 따라 경로가 상이합니다.
  // 여기서는 일반화된 형태를 가정하고 placeholder를 둡니다.
  try {
    if (IRACING_MOCK) {
      const participants: Participant[] = [
        { custId: '1001', name: 'Mock Kim', car: 'GT3', teamId: null },
        { custId: '1002', name: 'Mock Park', car: 'GT3', teamId: null },
        { custId: '1003', name: 'Mock Lee', car: 'GT3', teamId: null },
      ]
      cache.set(key, participants, 30_000)
      return NextResponse.json(participants)
    }
    // iRacing API: /data/results/get?subsession_id=... 
    // 응답 구조: { results: Array<{ cust_id, display_name, car_name, team_id, ... }> }
    const subsessionId = parseInt(sessionId)
    if (isNaN(subsessionId)) {
      return NextResponse.json({ error: 'Invalid session ID. Must be a valid subsession_id (number).', participants: [] }, { status: 400 })
    }
    
    try {
      const data = await irGet<any>(
        '/data/results/get',
        { subsession_id: subsessionId }
      )
      
      // iRacing API 응답 구조: { session_results: [{ simsession_number, results: [...] }] }
      // RACE 세션(simsession_number: 0)의 results에서 참가자 정보 가져오기
      let results: any[] = []
      
      if (data.session_results && Array.isArray(data.session_results)) {
        // RACE 세션 찾기 (simsession_number: 0)
        const raceSession = data.session_results.find((s: any) => s.simsession_number === 0)
        if (raceSession && raceSession.results && Array.isArray(raceSession.results)) {
          results = raceSession.results
          console.log(`[Session Participants] Found ${results.length} participants in RACE session`)
        } else {
          // RACE 세션이 없으면 첫 번째 세션의 results 사용
          const firstSession = data.session_results.find((s: any) => s.results && Array.isArray(s.results))
          if (firstSession) {
            results = firstSession.results
            console.log(`[Session Participants] Using first available session (${firstSession.simsession_name}) with ${results.length} participants`)
          }
        }
      } else if (data.results && Array.isArray(data.results)) {
        // 직접 results 배열이 있는 경우 (fallback)
        results = data.results
        console.log(`[Session Participants] Using direct results array with ${results.length} participants`)
      }
      
      if (results.length === 0) {
        console.warn(`[Session Participants] No results found in API response`)
        return NextResponse.json({ error: 'No participants found in session', participants: [] }, { status: 404 })
      }
      
      const participants: Participant[] = results.map((p: any) => ({
        custId: String(p.cust_id ?? p.custId ?? ''),
        name: p.display_name ?? p.name ?? '',
        car: p.car_name ?? p.car ?? null,
        teamId: p.team_id ? String(p.team_id) : null,
      }))
      
      console.log(`[Session Participants] Mapped ${participants.length} participants`)
      cache.set(key, participants, 30_000)
      return NextResponse.json(participants)
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : 'upstream error'
      
      // 404 에러는 세션이 존재하지 않음을 의미
      if (errorMsg.includes('404') || errorMsg.includes('Not Found') || errorMsg.includes('does not exist')) {
        return NextResponse.json({ 
          error: `Subsession ${subsessionId} does not exist or is not accessible. Please check the subsession ID.`,
          participants: [] 
        }, { status: 404 })
      }
      
      return NextResponse.json({ error: errorMsg, participants: [] }, { status: 502 })
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return NextResponse.json({ error: msg, participants: [] }, { status: 502 })
  }
}


