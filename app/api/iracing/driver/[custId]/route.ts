import { NextRequest, NextResponse } from 'next/server'
import type { IracingDriverDetail, DriverPerformanceSnapshot, DriverRecentRace, DriverTrendPoint, DriverStrength, DriverConsistencyMetrics, DriverHighlight } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const cache = new TtlCache<IracingDriverDetail>(10 * 60_000)
const limiter = new IpRateLimiter(60)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ custId: string }> }
) {
  const { custId } = await params
  if (!custId) return NextResponse.json({ error: 'custId 필요' }, { status: 400 })
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) return NextResponse.json({ error: 'rate limit' }, { status: 429 })

  const cacheKey = `driver:${custId}`
  const cached = cache.get(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const buildPerformance = (careerData: any): DriverPerformanceSnapshot | null => {
      if (!careerData) return null
      const starts = careerData.starts ?? careerData.total_starts ?? null
      const wins = careerData.wins ?? null
      const podiums = careerData.podiums ?? careerData.top_3 ?? null
      const top5 = careerData.top5 ?? careerData.top_5 ?? null
      const avgFinish = careerData.avg_finish ?? careerData.avg_finish_position ?? null
      const avgIncidents = careerData.avg_incidents ?? careerData.incidents_per_race ?? null
      const cleanRaces = careerData.clean_races ?? careerData.clean_race_count ?? null
      const winRate = starts ? (wins ?? 0) / starts * 100 : null
      const podiumRate = starts ? (podiums ?? 0) / starts * 100 : null
      const top5Rate = starts ? (top5 ?? 0) / starts * 100 : null
      const cleanRaceRate = starts ? (cleanRaces ?? 0) / starts * 100 : null
      return {
        totalStarts: starts,
        wins,
        podiums,
        top5,
        winRate,
        podiumRate,
        top5Rate,
        avgFinish,
        avgIncidents,
        cleanRaceRate,
      }
    }

    const toNumber = (value: any): number | null => {
      if (value === null || value === undefined) return null
      const num = typeof value === 'string' ? parseFloat(value) : Number(value)
      return Number.isFinite(num) ? num : null
    }

    const buildRecentRaces = (raw: any): DriverRecentRace[] | null => {
      const races = raw?.races || raw?.results || raw
      if (!Array.isArray(races) || races.length === 0) return null
      return races.slice(0, 20).map((race: any) => {
        const oldIr = toNumber(race.old_irating ?? race.old_i_rating ?? race.start_irating)
        const newIr = toNumber(race.new_irating ?? race.new_i_rating ?? race.finish_irating)
        const irChange = newIr !== null && oldIr !== null ? newIr - oldIr : toNumber(race.ir_change ?? race.irating_change)
        const oldSr = toNumber(race.old_safety_rating ?? race.start_safety_rating)
        const newSr = toNumber(race.new_safety_rating ?? race.finish_safety_rating)
        return {
          subsessionId: race.subsession_id ?? race.subsessionId ?? race.session_id ?? `${race.start_time || ''}`,
          seriesName: race.series_name ?? race.series?.name ?? null,
          startTime: race.start_time ?? race.session_time ?? null,
          track: race.track_name ?? race.track?.name ?? null,
          car: race.car_name ?? race.car?.name ?? null,
          finishPosition: toNumber(race.finish_position ?? race.finish_pos),
          startPosition: toNumber(race.starting_position ?? race.start_pos),
          iratingChange: irChange,
          incidents: toNumber(race.incidents ?? race.incident_count ?? race.incidents_total),
          lapsLed: toNumber(race.laps_led),
          strengthOfField: toNumber(race.sof ?? race.strength_of_field),
          safetyRatingAfter: newSr,
          safetyRatingBefore: oldSr,
        }
      })
    }

    const buildTrends = (races: DriverRecentRace[] | null, latestIrating: number | null, latestSafety: number | null): DriverTrendPoint[] | null => {
      if (!races || races.length === 0) return null
      const points: DriverTrendPoint[] = []
      const sorted = races
        .slice()
        .sort((a, b) => {
          const at = a.startTime ? new Date(a.startTime).getTime() : 0
          const bt = b.startTime ? new Date(b.startTime).getTime() : 0
          return at - bt
        })
      let runningIr = latestIrating
      let runningSr = latestSafety
      for (let i = sorted.length - 1; i >= 0; i -= 1) {
        const race = sorted[i]
        if (!race.startTime) continue
        if (runningIr !== null) {
          points.unshift({
            date: race.startTime,
            irating: runningIr,
            safetyRating: runningSr ?? null,
          })
          if (typeof race.iratingChange === 'number') {
            runningIr -= race.iratingChange
          }
          if (typeof race.safetyRatingAfter === 'number' && typeof race.safetyRatingBefore === 'number') {
            runningSr = race.safetyRatingBefore
          } else if (typeof race.safetyRatingBefore === 'number') {
            runningSr = race.safetyRatingBefore
          }
        } else {
          points.unshift({ date: race.startTime, irating: null, safetyRating: runningSr ?? null })
        }
      }
      return points.length ? points : null
    }

    const buildStrengths = (races: DriverRecentRace[] | null): DriverStrength[] | null => {
      if (!races || races.length === 0) return null
      const aggregate = (key: 'track' | 'car' | 'series') => {
        const map = new Map<string, { starts: number; wins: number; totalFinish: number; best: number }>()
        races.forEach((race) => {
          const label = (key === 'track' ? race.track : key === 'car' ? race.car : race.seriesName) || null
          if (!label) return
          const entry = map.get(label) || { starts: 0, wins: 0, totalFinish: 0, best: Number.POSITIVE_INFINITY }
          entry.starts += 1
          if ((race.finishPosition ?? Infinity) <= 1) entry.wins += 1
          const finish = race.finishPosition ?? 99
          entry.totalFinish += finish
          if (finish < entry.best) entry.best = finish
          map.set(label, entry)
        })
        return Array.from(map.entries())
          .map(([label, stats]) => ({
            label,
            type: key,
            starts: stats.starts,
            winRate: stats.starts ? (stats.wins / stats.starts) * 100 : null,
            avgFinish: stats.starts ? stats.totalFinish / stats.starts : null,
            bestResult: stats.best === Number.POSITIVE_INFINITY ? null : stats.best,
          }))
          .sort((a, b) => (b.starts ?? 0) - (a.starts ?? 0))
          .slice(0, 3)
      }

      return [...aggregate('series'), ...aggregate('car'), ...aggregate('track')]
    }

    const buildConsistency = (performance: DriverPerformanceSnapshot | null, races: DriverRecentRace[] | null): DriverConsistencyMetrics | null => {
      if (!performance && !races) return null
      const avgIncidentsRecent = races && races.length
        ? races.reduce((sum, r) => sum + (r.incidents ?? 0), 0) / races.length
        : null
      const cleanRateRecent = races && races.length
        ? (races.filter((r) => (r.incidents ?? 0) === 0).length / races.length) * 100
        : null
      return {
        avgIncidents: avgIncidentsRecent ?? performance?.avgIncidents ?? null,
        cleanRaceRate: cleanRateRecent ?? performance?.cleanRaceRate ?? null,
        dnfRate: null,
        avgLaps: null,
        strengthOfField: races && races.length
          ? races.reduce((sum, r) => sum + (r.strengthOfField ?? 0), 0) / races.length
          : null,
      }
    }

    const buildHighlights = (performance: DriverPerformanceSnapshot | null, races: DriverRecentRace[] | null): DriverHighlight[] | null => {
      if (!performance && !races) return null
      const highlights: DriverHighlight[] = []
      if (performance?.wins) {
        highlights.push({
          type: 'careerWins',
          title: 'Career Wins',
          description: `${performance.wins.toLocaleString('en-US')} wins recorded`,
          data: {
            wins: performance.wins,
          },
        })
      }
      if (performance?.winRate) {
        highlights.push({
          type: 'winRate',
          title: 'Win Rate',
          description: `Win probability ${(performance.winRate).toFixed(1)}%`,
          data: {
            winRate: performance.winRate,
          },
        })
      }
      if (races && races.length) {
        const bestFinish = races.reduce((prev, race) => {
          if (race.finishPosition === null || race.finishPosition === undefined) return prev
          if (!prev || (race.finishPosition ?? 99) < (prev.finishPosition ?? 99)) return race
          return prev
        }, null as DriverRecentRace | null)
        if (bestFinish) {
          highlights.push({
            type: 'recentBestFinish',
            title: 'Recent Best Finish',
            description: `Achieved P${bestFinish.finishPosition} at ${bestFinish.track || bestFinish.seriesName || 'recent race'}`,
            timestamp: bestFinish.startTime || undefined,
            data: {
              finishPosition: bestFinish.finishPosition ?? null,
              track: bestFinish.track ?? null,
              series: bestFinish.seriesName ?? null,
            },
          })
        }
        const biggestGain = races.reduce((prev, race) => {
          if (race.iratingChange === null || race.iratingChange === undefined) return prev
          if (!prev || (race.iratingChange ?? -Infinity) > (prev.iratingChange ?? -Infinity)) return race
          return prev
        }, null as DriverRecentRace | null)
        if (biggestGain && (biggestGain.iratingChange ?? 0) > 0) {
          highlights.push({
            type: 'maxIrGain',
            title: 'Largest iRating Gain',
            description: `${biggestGain.iratingChange?.toFixed(0)} iR gain (${biggestGain.seriesName || 'race'})`,
            timestamp: biggestGain.startTime || undefined,
            data: {
              irGain: biggestGain.iratingChange ?? null,
              series: biggestGain.seriesName ?? null,
            },
          })
        }
      }
      return highlights.length ? highlights : null
    }

    if (IRACING_MOCK) {
      console.log(`[Driver Detail] Using mock data for custId: ${custId}`)
      const mockRecent: DriverRecentRace[] = Array.from({ length: 6 }).map((_, idx) => ({
        subsessionId: `mock-${custId}-${idx}`,
        seriesName: 'Global Endurance Series',
        startTime: new Date(Date.now() - idx * 86400000).toISOString(),
        track: ['Suzuka', 'Spa', 'Monza'][idx % 3],
        car: ['BMW M4 GT3', 'Porsche 911 GT3 R', 'Ferrari 296 GT3'][idx % 3],
        finishPosition: [1, 3, 5, 2, 4, 6][idx % 6],
        startPosition: [3, 4, 5, 6, 2, 1][idx % 6],
        iratingChange: [38, -12, 5, 24, -8, 15][idx % 6],
        incidents: [0, 2, 6, 1, 0, 3][idx % 6],
        lapsLed: [15, 0, 0, 8, 0, 0][idx % 6],
        strengthOfField: 3200 + idx * 40,
        safetyRatingAfter: 3.76,
        safetyRatingBefore: 3.76,
      }))

      const performance = buildPerformance({
        starts: 182,
        wins: 24,
        podiums: 56,
        top5: 78,
        avg_finish: 5.6,
        avg_incidents: 3.2,
        clean_races: 98,
      })

      const detail: IracingDriverDetail = {
        custId,
        name: `Mock Driver ${custId}`,
        country: 'KR',
        irating: 2450,
        licenseClass: 'A',
        safetyRating: 3.76,
        licenses: [{ category: 'road', class: 'A' }],
        lastUpdated: new Date().toISOString(),
        performance,
        trends: buildTrends(mockRecent, 2450, 3.76),
        strengths: buildStrengths(mockRecent),
        recentRaces: mockRecent,
        consistency: buildConsistency(performance, mockRecent),
        highlights: buildHighlights(performance, mockRecent),
      }
      cache.set(cacheKey, detail, 60_000)
      return NextResponse.json(detail)
    }
    
    console.log(`[Driver Detail] Fetching real data for custId: ${custId}`)
    const prof = await irGet<{ members?: Array<{ cust_id: number; display_name: string; country?: string }> }>(
      '/data/member/get',
      { cust_ids: custId }
    )
    const ratings = await irGet<{ i_rating?: number; safety_rating?: number; licenses?: Array<{ category: string; class: string }> }>(
      '/data/member/ratings',
      { cust_id: custId }
    )

    let careerData: any = null
    try {
      careerData = await irGet<{ career?: any }>(
        '/data/stats/member_career',
        { cust_id: custId }
      )
    } catch (error) {
      console.warn('[Driver Detail] Unable to fetch career stats:', error)
    }

    let recentRaceData: DriverRecentRace[] | null = null
    try {
      const recent = await irGet<any>(
        '/data/stats/member_recent_races',
        { cust_id: custId, category_id: 2 }
      )
      recentRaceData = buildRecentRaces(recent)
    } catch (error) {
      console.warn('[Driver Detail] Unable to fetch recent races:', error)
    }

    const member = prof?.members?.[0]
    const performance = buildPerformance(careerData?.career ?? careerData)
    const detail: IracingDriverDetail = {
      custId,
      name: member?.display_name ?? 'Unknown',
      country: member?.country || null,
      irating: ratings?.i_rating ?? null,
      licenseClass: ratings?.licenses?.[0]?.class ?? null,
      safetyRating: ratings?.safety_rating ?? null,
      licenses: ratings?.licenses ?? null,
      lastUpdated: new Date().toISOString(),
      performance,
      trends: buildTrends(recentRaceData, ratings?.i_rating ?? null, ratings?.safety_rating ?? null),
      strengths: buildStrengths(recentRaceData),
      recentRaces: recentRaceData,
      consistency: buildConsistency(performance, recentRaceData),
      highlights: buildHighlights(performance, recentRaceData),
    }
    cache.set(cacheKey, detail, 5 * 60_000)
    return NextResponse.json(detail)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}


