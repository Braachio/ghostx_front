import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { MetaVehicleStats } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const cache = new TtlCache<MetaVehicleStats[]>(5 * 60_000) // 5분 캐시
const limiter = new IpRateLimiter(60)

/**
 * GET /api/iracing/meta/report
 * 시리즈/트랙별 메타 리포트 조회
 * 
 * Query params:
 * - series_id: 시리즈 ID (필수)
 * - track_id: 트랙 ID (선택, 없으면 시리즈 전체 통계)
 * - period_days: 기간 (일, 기본값 7)
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
    const trackId = searchParams.get('track_id')
    const periodDays = parseInt(searchParams.get('period_days') || '7')

    if (!seriesId) {
      return NextResponse.json({ error: 'series_id required' }, { status: 400 })
    }

    const cacheKey = `meta:${seriesId}:${trackId || 'all'}:${periodDays}`
    const cached = cache.get(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // 기간 계산
    const endTime = new Date()
    const startTime = new Date()
    startTime.setDate(startTime.getDate() - periodDays)

    // 세션 결과 조회
    let query = supabase
      .from('iracing_subsession_results')
      .select(`
        subsession_id,
        track_id,
        track_name,
        start_time
      `)
      .eq('series_id', parseInt(seriesId))
      .gte('start_time', startTime.toISOString())
      .lte('start_time', endTime.toISOString())

    if (trackId) {
      query = query.eq('track_id', parseInt(trackId))
    }

    const { data: sessions, error: sessionsError } = await query

    if (sessionsError) {
      throw sessionsError
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json([])
    }

    const subsessionIds = sessions.map(s => s.subsession_id)

    // 참여자 결과 조회
    const { data: participants, error: participantsError } = await supabase
      .from('iracing_participant_results')
      .select('*')
      .in('subsession_id', subsessionIds)

    if (participantsError) {
      throw participantsError
    }

    if (!participants || participants.length === 0) {
      return NextResponse.json([])
    }

    // 차량별 통계 계산
    const statsByCar = new Map<number, {
      car_id: number
      car_name: string
      total_races: Set<number> // subsession_id 집합
      total_participants: number
      wins: number
      top5_finishes: number
      lap_times: number[]
      irating_bins: Map<string, { lap_times: number[]; count: number }>
    }>()

    // 시리즈 이름 가져오기 (첫 번째 세션에서)
    let seriesName = 'Unknown'
    if (sessions.length > 0) {
      // TODO: 시리즈 이름을 별도로 조회하거나 저장
      seriesName = `Series ${seriesId}`
    }

    participants.forEach((p: any) => {
      const carId = p.car_id
      const carName = p.car_name

      if (!statsByCar.has(carId)) {
        statsByCar.set(carId, {
          car_id: carId,
          car_name: carName,
          total_races: new Set(),
          total_participants: 0,
          wins: 0,
          top5_finishes: 0,
          lap_times: [],
          irating_bins: new Map(),
        })
      }

      const stats = statsByCar.get(carId)!
      stats.total_races.add(p.subsession_id)
      stats.total_participants++

      if (p.finish_position === 1) {
        stats.wins++
      }
      if (p.finish_position <= 5) {
        stats.top5_finishes++
      }

      if (p.best_lap_time) {
        stats.lap_times.push(p.best_lap_time)

        // iRating 구간별 분류
        if (p.i_rating) {
          const bin = getIratingBin(p.i_rating)
          if (!stats.irating_bins.has(bin)) {
            stats.irating_bins.set(bin, { lap_times: [], count: 0 })
          }
          const binData = stats.irating_bins.get(bin)!
          binData.lap_times.push(p.best_lap_time)
          binData.count++
        }
      }
    })

    // MetaVehicleStats 형식으로 변환
    const results: MetaVehicleStats[] = Array.from(statsByCar.values()).map(stats => {
      const totalRaces = stats.total_races.size
      const winRate = totalRaces > 0 ? (stats.wins / totalRaces) * 100 : 0
      const top5Rate = totalRaces > 0 ? (stats.top5_finishes / totalRaces) * 100 : 0
      const pickRate = stats.total_participants > 0 
        ? (stats.total_participants / participants.length) * 100 
        : 0
      const avgLapTime = stats.lap_times.length > 0
        ? stats.lap_times.reduce((a, b) => a + b, 0) / stats.lap_times.length
        : null

      // iRating 구간별 평균 랩타임 계산
      const iratingBins: Record<string, { avg_lap_time: number; count: number }> = {}
      stats.irating_bins.forEach((binData, bin) => {
        iratingBins[bin] = {
          avg_lap_time: binData.lap_times.reduce((a, b) => a + b, 0) / binData.lap_times.length,
          count: binData.count,
        }
      })

      const trackIdValue = trackId ? parseInt(trackId) : null
      const trackNameValue = trackId && sessions.length > 0 ? sessions[0].track_name : null

      return {
        car_id: stats.car_id,
        car_name: stats.car_name,
        series_id: parseInt(seriesId),
        series_name: seriesName,
        track_id: trackIdValue,
        track_name: trackNameValue,
        period_start: startTime.toISOString(),
        period_end: endTime.toISOString(),
        total_races: totalRaces,
        total_participants: stats.total_participants,
        wins: stats.wins,
        win_rate: parseFloat(winRate.toFixed(2)),
        top5_finishes: stats.top5_finishes,
        top5_rate: parseFloat(top5Rate.toFixed(2)),
        pick_rate: parseFloat(pickRate.toFixed(2)),
        avg_lap_time: avgLapTime ? parseFloat(avgLapTime.toFixed(3)) : null,
        avg_irating_gain: null, // TODO: 구현 필요
        irating_bins: iratingBins,
      }
    })

    // 승률 기준으로 정렬
    results.sort((a, b) => b.win_rate - a.win_rate)

    cache.set(cacheKey, results)
    return NextResponse.json(results)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'report error'
    console.error('Meta report error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * iRating을 구간별로 분류 (예: 2000-2100)
 */
function getIratingBin(irating: number): string {
  const binSize = 100
  const lower = Math.floor(irating / binSize) * binSize
  const upper = lower + binSize
  return `${lower}-${upper}`
}
