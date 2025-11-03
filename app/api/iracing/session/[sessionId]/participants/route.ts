import { NextRequest, NextResponse } from 'next/server'
import { irGet } from '@/lib/iracingClient'
import { TtlCache } from '@/lib/ttlCache'

type Participant = { custId: string; name: string; car?: string | null; teamId?: string | null }

const cache = new TtlCache<Participant[]>(60_000)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  if (!sessionId) return NextResponse.json({ error: 'sessionId 필요' }, { status: 400 })

  const key = `sess:${sessionId}:parts`
  const cached = cache.get(key)
  if (cached) return NextResponse.json(cached)

  // NOTE: iRacing 세션/서브세션 참여자 API는 시리즈/타입에 따라 경로가 상이합니다.
  // 여기서는 일반화된 형태를 가정하고 placeholder를 둡니다.
  try {
    // 예시: /data/results/get?subsession_id=... → participants
    const data = await irGet<{ participants?: Array<{ cust_id: number; display_name: string; car_name?: string; team_id?: number }> }>(
      '/data/results/get',
      { subsession_id: sessionId }
    )
    const participants: Participant[] = (data.participants || []).map(p => ({
      custId: String(p.cust_id),
      name: p.display_name,
      car: p.car_name || null,
      teamId: p.team_id ? String(p.team_id) : null,
    }))
    cache.set(key, participants, 30_000)
    return NextResponse.json(participants)
  } catch (e) {
    // 폴백: 비어있는 리스트
    return NextResponse.json([], { status: 200 })
  }
}


