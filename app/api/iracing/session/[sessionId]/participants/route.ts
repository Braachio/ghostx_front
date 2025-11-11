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
    const data = await irGet<{ results?: Array<{ cust_id: number; display_name: string; car_name?: string; team_id?: number }> }>(
      '/data/results/get',
      { subsession_id: parseInt(sessionId) }
    )
    
    const participants: Participant[] = (data.results || []).map(p => ({
      custId: String(p.cust_id),
      name: p.display_name,
      car: p.car_name || null,
      teamId: p.team_id ? String(p.team_id) : null,
    }))
    cache.set(key, participants, 30_000)
    return NextResponse.json(participants)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return NextResponse.json({ error: msg, participants: [] }, { status: 502 })
  }
}


