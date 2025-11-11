import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { BopAlert } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const cache = new TtlCache<BopAlert[]>(10 * 60_000) // 10분 캐시
const limiter = new IpRateLimiter(60)

/**
 * GET /api/iracing/meta/bop-alerts
 * BoP 패치에 따른 급상승/하락 차량 알림
 * 
 * Query params:
 * - series_id: 시리즈 ID (선택, 없으면 모든 시리즈)
 * - patch_date: 패치 날짜 (선택, 없으면 최근 패치)
 * - threshold: 변화율 임계값 % (기본값 20)
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { searchParams } = new URL(req.url)
    const seriesId = searchParams.get('series_id')
    const patchDate = searchParams.get('patch_date')
    const threshold = parseFloat(searchParams.get('threshold') || '20')

    const cacheKey = `bop:${seriesId || 'all'}:${patchDate || 'latest'}:${threshold}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // 최근 BoP 패치 날짜 찾기
    let query = supabase
      .from('iracing_bop_patches')
      .select('patch_date, series_id')
      .order('patch_date', { ascending: false })
      .limit(1)

    if (seriesId) {
      query = query.eq('series_id', parseInt(seriesId))
    }

    const { data: patches, error: patchError } = await query

    if (patchError) {
      throw patchError
    }

    if (!patches || patches.length === 0) {
      // 패치 기록이 없으면 최근 7일 전후 비교
      const targetDate = patchDate ? new Date(patchDate) : new Date()
      targetDate.setDate(targetDate.getDate() - 7)

      return await comparePeriods(
        supabase,
        seriesId ? parseInt(seriesId) : null,
        targetDate,
        threshold
      )
    }

    const latestPatch = patches[0]
    const patchDateObj = new Date(latestPatch.patch_date)

    // 패치 전후 비교 기간 설정 (패치 전 7일, 패치 후 7일)
    const beforeEnd = new Date(patchDateObj)
    beforeEnd.setDate(beforeEnd.getDate() - 1)
    const beforeStart = new Date(beforeEnd)
    beforeStart.setDate(beforeStart.getDate() - 7)

    const afterStart = new Date(patchDateObj)
    afterStart.setDate(afterStart.getDate() + 1)
    const afterEnd = new Date(afterStart)
    afterEnd.setDate(afterEnd.getDate() + 7)

    // 패치 전 통계
    const beforeStats = await getPeriodStats(
      supabase,
      seriesId ? parseInt(seriesId) : null,
      beforeStart,
      beforeEnd
    )

    // 패치 후 통계
    const afterStats = await getPeriodStats(
      supabase,
      seriesId ? parseInt(seriesId) : null,
      afterStart,
      afterEnd
    )

    // 변화율 계산 및 임계값 이상 차량 필터링
    const alerts: BopAlert[] = []

    for (const [carKey, before] of beforeStats.entries()) {
      const after = afterStats.get(carKey)
      if (!after) continue

      const winRateChange = after.win_rate - before.win_rate
      const pickRateChange = after.pick_rate - before.pick_rate
      const top5RateChange = after.top5_rate - before.top5_rate

      const maxChange = Math.max(
        Math.abs(winRateChange),
        Math.abs(pickRateChange),
        Math.abs(top5RateChange)
      )

      if (maxChange >= threshold) {
        const alertType = winRateChange > 0 || pickRateChange > 0 ? 'surge' : 'drop'

        alerts.push({
          car_id: before.car_id,
          car_name: before.car_name,
          series_id: before.series_id,
          series_name: before.series_name,
          patch_date: latestPatch.patch_date,
          win_rate_change: parseFloat(winRateChange.toFixed(2)),
          pick_rate_change: parseFloat(pickRateChange.toFixed(2)),
          top5_rate_change: parseFloat(top5RateChange.toFixed(2)),
          alert_type: alertType,
        })
      }
    }

    // 변화율 기준으로 정렬
    alerts.sort((a, b) => {
      const aMax = Math.max(
        Math.abs(a.win_rate_change),
        Math.abs(a.pick_rate_change),
        Math.abs(a.top5_rate_change)
      )
      const bMax = Math.max(
        Math.abs(b.win_rate_change),
        Math.abs(b.pick_rate_change),
        Math.abs(b.top5_rate_change)
      )
      return bMax - aMax
    })

    cache.set(cacheKey, alerts)
    return NextResponse.json(alerts)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'bop alert error'
    console.error('BOP alert error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * 기간별 통계 가져오기
 */
async function getPeriodStats(
  supabase: ReturnType<typeof createRouteHandlerClient>,
  seriesId: number | null,
  startDate: Date,
  endDate: Date
): Promise<Map<string, {
  car_id: number
  car_name: string
  series_id: number
  series_name: string
  win_rate: number
  pick_rate: number
  top5_rate: number
}>> {
  let query = supabase
    .from('iracing_subsession_results')
    .select(`
      subsession_id,
      series_id,
      start_time
    `)
    .gte('start_time', startDate.toISOString())
    .lte('start_time', endDate.toISOString())

  if (seriesId) {
    query = query.eq('series_id', seriesId)
  }

  const { data: sessions, error: sessionsError } = await query

  if (sessionsError || !sessions || sessions.length === 0) {
    return new Map()
  }

  const subsessionIds = sessions.map(s => s.subsession_id)

  const { data: participants, error: participantsError } = await supabase
    .from('iracing_participant_results')
    .select('*')
    .in('subsession_id', subsessionIds)

  if (participantsError || !participants || participants.length === 0) {
    return new Map()
  }

  const statsByCar = new Map<string, {
    car_id: number
    car_name: string
    series_id: number
    series_name: string
    total_races: Set<number>
    total_participants: number
    wins: number
    top5_finishes: number
  }>()

  participants.forEach((p: any) => {
    const key = `${p.car_id}:${p.subsession_id}`
    const seriesId = sessions.find(s => s.subsession_id === p.subsession_id)?.series_id || 0

    if (!statsByCar.has(`${p.car_id}:${seriesId}`)) {
      statsByCar.set(`${p.car_id}:${seriesId}`, {
        car_id: p.car_id,
        car_name: p.car_name,
        series_id: seriesId,
        series_name: `Series ${seriesId}`,
        total_races: new Set(),
        total_participants: 0,
        wins: 0,
        top5_finishes: 0,
      })
    }

    const stats = statsByCar.get(`${p.car_id}:${seriesId}`)!
    stats.total_races.add(p.subsession_id)
    stats.total_participants++

    if (p.finish_position === 1) {
      stats.wins++
    }
    if (p.finish_position <= 5) {
      stats.top5_finishes++
    }
  })

  const result = new Map<string, {
    car_id: number
    car_name: string
    series_id: number
    series_name: string
    win_rate: number
    pick_rate: number
    top5_rate: number
  }>()

  statsByCar.forEach((stats, key) => {
    const totalRaces = stats.total_races.size
    const totalParticipants = participants.length

    const winRate = totalRaces > 0 ? (stats.wins / totalRaces) * 100 : 0
    const top5Rate = totalRaces > 0 ? (stats.top5_finishes / totalRaces) * 100 : 0
    const pickRate = totalParticipants > 0 ? (stats.total_participants / totalParticipants) * 100 : 0

    result.set(key, {
      car_id: stats.car_id,
      car_name: stats.car_name,
      series_id: stats.series_id,
      series_name: stats.series_name,
      win_rate,
      pick_rate,
      top5_rate,
    })
  })

  return result
}

/**
 * 두 기간 비교 (패치 기록이 없을 때)
 */
async function comparePeriods(
  supabase: ReturnType<typeof createRouteHandlerClient>,
  seriesId: number | null,
  patchDate: Date,
  threshold: number
): Promise<NextResponse> {
  const beforeEnd = new Date(patchDate)
  beforeEnd.setDate(beforeEnd.getDate() - 1)
  const beforeStart = new Date(beforeEnd)
  beforeStart.setDate(beforeStart.getDate() - 7)

  const afterStart = new Date(patchDate)
  const afterEnd = new Date(afterStart)
  afterEnd.setDate(afterEnd.getDate() + 7)

  const beforeStats = await getPeriodStats(supabase, seriesId, beforeStart, beforeEnd)
  const afterStats = await getPeriodStats(supabase, seriesId, afterStart, afterEnd)

  const alerts: BopAlert[] = []

  for (const [carKey, before] of beforeStats.entries()) {
    const after = afterStats.get(carKey)
    if (!after) continue

    const winRateChange = after.win_rate - before.win_rate
    const pickRateChange = after.pick_rate - before.pick_rate
    const top5RateChange = after.top5_rate - before.top5_rate

    const maxChange = Math.max(
      Math.abs(winRateChange),
      Math.abs(pickRateChange),
      Math.abs(top5RateChange)
    )

    if (maxChange >= threshold) {
      alerts.push({
        car_id: before.car_id,
        car_name: before.car_name,
        series_id: before.series_id,
        series_name: before.series_name,
        patch_date: patchDate.toISOString(),
        win_rate_change: parseFloat(winRateChange.toFixed(2)),
        pick_rate_change: parseFloat(pickRateChange.toFixed(2)),
        top5_rate_change: parseFloat(top5RateChange.toFixed(2)),
        alert_type: winRateChange > 0 || pickRateChange > 0 ? 'surge' : 'drop',
      })
    }
  }

  return NextResponse.json(alerts)
}
