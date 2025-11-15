import { NextRequest, NextResponse } from 'next/server'
import type { IracingDriverDetail, DriverPerformanceSnapshot, DriverRecentRace, DriverTrendPoint, DriverStrength, DriverConsistencyMetrics, DriverHighlight } from '@/lib/iracingTypes'
import { TtlCache } from '@/lib/ttlCache'
import { irGet, IRACING_MOCK } from '@/lib/iracingClient'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

// iRacing 차량 ID와 이름 매핑
// 참고: iRacing API는 차량 이름을 직접 제공하지 않으므로 매핑이 필요함
// 이 매핑은 일반적인 차량들을 포함하며, 필요에 따라 확장 가능
const CAR_NAME_MAP: Record<number, string> = {
  // Formula Cars
  178: 'Super Formula Lights',
  142: 'Formula Vee',
  163: 'Ray FF1600',
  148: 'FIA F4',
  3: 'Dallara F3',
  4: 'Dallara IR18',
  5: 'Dallara DW12',
  6: 'Dallara F3',
  7: 'Dallara IR18',
  8: 'Dallara DW12',
  9: 'Dallara F3',
  10: 'Dallara IR18',
  11: 'Dallara DW12',
  12: 'Dallara F3',
  13: 'Dallara IR18',
  14: 'Dallara DW12',
  15: 'Dallara F3',
  16: 'Dallara IR18',
  17: 'Dallara DW12',
  18: 'Dallara F3',
  19: 'Dallara IR18',
  20: 'Dallara DW12',
  // Sports Cars
  132: 'BMW M4 GT3',
  169: 'Porsche 911 GT3 R',
  173: 'Ferrari 296 GT3',
  24: 'Mercedes-AMG GT3',
  25: 'Audi R8 LMS GT3',
  26: 'Lamborghini Huracán GT3',
  27: 'McLaren 720S GT3',
  206: 'Aston Martin Vantage GT3',
  29: 'BMW M4 GT4',
  30: 'Porsche 718 Cayman GT4',
  31: 'Mercedes-AMG GT4',
  32: 'Aston Martin Vantage GT4',
  33: 'Audi R8 LMS GT4',
  34: 'McLaren 570S GT4',
  35: 'BMW M4 GT3',
  36: 'Porsche 911 GT3 R',
  37: 'Ferrari 296 GT3',
  38: 'Mercedes-AMG GT3',
  39: 'Audi R8 LMS GT3',
  40: 'Lamborghini Huracán GT3',
  // 추가 차량들은 필요에 따라 확장
}

// 카테고리별 캐시를 위해 TTL을 짧게 설정 (5분)
const cache = new TtlCache<IracingDriverDetail>(5 * 60_000)
const limiter = new IpRateLimiter(60)

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ custId: string }> }
) {
  const { custId } = await params
  if (!custId) return NextResponse.json({ error: 'custId 필요' }, { status: 400 })
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) return NextResponse.json({ error: 'rate limit' }, { status: 429 })

  // 카테고리 파라미터 확인 (선택적)
  // category_id: 1=Oval, 2=Road, 3=Dirt Oval, 4=Dirt Road, 5=Sports Car, 6=Formula Car
  const { searchParams } = new URL(req.url)
  const categoryIdParam = searchParams.get('category_id')
  const refresh = searchParams.get('refresh') === 'true' // 캐시 무효화 옵션
  const categoryId = categoryIdParam ? parseInt(categoryIdParam, 10) : null
  const validCategoryIds = [1, 2, 3, 4, 5, 6]
  const selectedCategoryId = categoryId && validCategoryIds.includes(categoryId) ? categoryId : null

  console.log(`[Driver Detail] Request for custId: ${custId}, categoryId: ${selectedCategoryId || 'auto-detect'}, refresh: ${refresh}`)

  const cacheKey = `driver:${custId}${selectedCategoryId ? `:cat${selectedCategoryId}` : ''}`
  const cached = refresh ? null : cache.get(cacheKey) // refresh=true면 캐시 무시
  if (cached) {
    console.log(`[Driver Detail] Returning cached data for category ${selectedCategoryId || 'auto'}, cacheKey: ${cacheKey}`, {
      categoryId: cached.categoryId,
      recentRacesCount: cached.recentRaces?.length || 0,
      performanceTotalStarts: cached.performance?.totalStarts,
    })
    // 캐시된 데이터의 categoryId가 요청한 categoryId와 일치하는지 확인
    if (cached.categoryId === selectedCategoryId || (!selectedCategoryId && cached.categoryId)) {
      // 캐시된 데이터가 유효한지 확인
      if (cached.performance !== undefined) {
        // 의심스러운 캐시 데이터 재검증:
        // - performanceTotalStarts > 0인데 recentRacesCount가 0인 경우
        //   (레이스가 있어야 하는데 최근 레이스가 없는 것은 이상함)
        // - 단, selectedCategoryId가 없으면 (auto-detect) 재검증하지 않음
        const hasPerformance = cached.performance?.totalStarts > 0
        const hasNoRecentRaces = (cached.recentRaces?.length || 0) === 0
        const isSuspicious = selectedCategoryId && hasPerformance && hasNoRecentRaces
        
        if (isSuspicious) {
          console.warn(`[Driver Detail] Suspicious cached data: performanceTotalStarts=${cached.performance.totalStarts} but recentRacesCount=0. Re-fetching to verify.`)
          // 캐시를 무시하고 새로 가져오기
        } else {
          // recentRaces가 undefined이면 null로 설정 (아직 로드되지 않음)
          // recentRaces가 null이면 빈 배열로 설정 (레이스가 없음)
          const response = {
            ...cached,
            recentRaces: cached.recentRaces === undefined ? null : (cached.recentRaces || []),
          }
          return NextResponse.json(response)
        }
      } else {
        console.warn(`[Driver Detail] Cached data is incomplete (missing performance). Fetching new data.`)
      }
    } else {
      console.warn(`[Driver Detail] Cached data category mismatch! Requested: ${selectedCategoryId}, Cached: ${cached.categoryId}. Fetching new data.`)
    }
  }
  
  // 캐시가 없거나 categoryId가 일치하지 않으면 새로 가져오기
  console.log(`[Driver Detail] Cache miss or mismatch for ${cacheKey}, fetching new data`)

  try {
    const buildPerformance = (careerData: any): DriverPerformanceSnapshot | null => {
      if (!careerData) return null
      
      // careerData가 stats 배열인 경우 (iRacing API 응답 구조)
      if (Array.isArray(careerData.stats)) {
        const stats = careerData.stats
        // 모든 카테고리 통계 합산
        const totalStarts = stats.reduce((sum: number, s: any) => sum + (s.starts || 0), 0)
        const totalWins = stats.reduce((sum: number, s: any) => sum + (s.wins || 0), 0)
        const totalTop5 = stats.reduce((sum: number, s: any) => sum + (s.top5 || 0), 0)
        const totalLaps = stats.reduce((sum: number, s: any) => sum + (s.laps || 0), 0)
        const totalIncidents = stats.reduce((sum: number, s: any) => sum + (s.avg_incidents * (s.starts || 0) || 0), 0)
        
        // 가중 평균 계산
        const avgFinish = totalStarts > 0 
          ? stats.reduce((sum: number, s: any) => sum + (s.avg_finish_position * (s.starts || 0) || 0), 0) / totalStarts
          : null
        const avgIncidents = totalStarts > 0 ? totalIncidents / totalStarts : null
        
        // podiums는 top5에서 추정 (정확하지 않을 수 있음)
        const podiums = totalTop5 >= totalWins ? totalTop5 - totalWins : null
        
        const winRate = totalStarts > 0 ? (totalWins / totalStarts) * 100 : null
        const top5Rate = totalStarts > 0 ? (totalTop5 / totalStarts) * 100 : null
        const podiumRate = totalStarts > 0 && podiums !== null ? (podiums / totalStarts) * 100 : null
        
        // clean races는 incidents가 0인 레이스 수를 추정할 수 없으므로 null
        return {
          totalStarts,
          wins: totalWins,
          podiums,
          top5: totalTop5,
          winRate,
          podiumRate,
          top5Rate,
          avgFinish: avgFinish ? Math.round(avgFinish * 10) / 10 : null,
          avgIncidents: avgIncidents ? Math.round(avgIncidents * 10) / 10 : null,
          cleanRaceRate: null, // 데이터 없음
        }
      }
      
      // 기존 구조 (단일 객체)
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

    const buildRecentRaces = async (raw: any, custIdNum: number): Promise<DriverRecentRace[] | null> => {
      // raw가 null이거나 undefined이면 null 반환
      if (!raw) {
        console.log('[Driver Detail] buildRecentRaces: raw is null/undefined')
        return null
      }
      
      // races 배열 확인
      const races = raw?.races || raw?.results || (Array.isArray(raw) ? raw : null)
      if (!Array.isArray(races) || races.length === 0) {
        console.log('[Driver Detail] buildRecentRaces: no races found', {
          hasRaces: !!raw?.races,
          racesLength: raw?.races?.length || 0,
          hasResults: !!raw?.results,
          resultsLength: raw?.results?.length || 0,
          isRawArray: Array.isArray(raw),
        })
        return null
      }
      
      console.log(`[Driver Detail] buildRecentRaces: processing ${races.length} races`)
      
      // 차량 이름이 없는 레이스들에 대해 병렬로 차량 이름 가져오기
      const racesToFetch = races.slice(0, 20).filter((race: any) => {
        return !race.car_name && !race.car?.name && race.car_id && race.subsession_id
      })
      
      // 차량 이름을 가져올 레이스들에 대해 병렬로 API 호출
      const carNamePromises = racesToFetch.map(async (race: any) => {
        try {
          const sessionResult = await irGet<any>(
            '/data/results/get',
            { subsession_id: race.subsession_id }
          )
          
          let driverResult: any = null
          if (sessionResult?.results && Array.isArray(sessionResult.results)) {
            driverResult = sessionResult.results.find((r: any) => r.cust_id === custIdNum)
          } else if (sessionResult?.session_results && Array.isArray(sessionResult.session_results)) {
            for (const session of sessionResult.session_results) {
              if (session.results && Array.isArray(session.results)) {
                driverResult = session.results.find((r: any) => r.cust_id === custIdNum)
                if (driverResult) break
              }
            }
          }
          
          if (driverResult?.car_name) {
            return { subsession_id: race.subsession_id, car_id: race.car_id, car_name: driverResult.car_name }
          }
        } catch (error) {
          console.log(`[Driver Detail] Unable to fetch car name from session result for car_id ${race.car_id}`)
        }
        return null
      })
      
      const carNameResults = await Promise.all(carNamePromises)
      const carNameMap = new Map<number, string>()
      carNameResults.forEach((result) => {
        if (result) {
          carNameMap.set(result.subsession_id, result.car_name)
          console.log(`[Driver Detail] Found car name: car_id=${result.car_id}, car_name=${result.car_name}`)
        }
      })
      
      return races.slice(0, 20).map((race: any) => {
        const oldIr = toNumber(race.oldi_rating ?? race.old_irating ?? race.old_i_rating ?? race.start_irating)
        const newIr = toNumber(race.newi_rating ?? race.new_irating ?? race.new_i_rating ?? race.finish_irating)
        const irChange = newIr !== null && oldIr !== null ? newIr - oldIr : toNumber(race.ir_change ?? race.irating_change)
        
        // Safety Rating은 sub_level로 표현됨 (0-4.99 범위)
        const oldSr = toNumber(race.old_sub_level)
        const newSr = toNumber(race.new_sub_level)
        
        // 차량 이름 가져오기
        // 1. API 응답에 car_name이 있으면 사용
        // 2. 세션 결과에서 가져온 차량 이름 사용
        // 3. 매핑 데이터에서 찾기
        // 4. car_id로 표시
        let carName = race.car_name ?? race.car?.name ?? null
        
        if (!carName && race.subsession_id) {
          carName = carNameMap.get(race.subsession_id) ?? null
        }
        
        if (!carName && race.car_id) {
          carName = CAR_NAME_MAP[race.car_id] ?? null
        }
        
        if (!carName && race.car_id) {
          carName = `Car #${race.car_id}`
        }
        
        return {
          subsessionId: race.subsession_id ?? race.subsessionId ?? race.session_id ?? `${race.session_start_time || ''}`,
          seriesName: race.series_name ?? race.series?.name ?? null,
          startTime: race.session_start_time ?? race.start_time ?? race.session_time ?? null,
          track: race.track?.track_name ?? race.track_name ?? race.track?.name ?? null,
          car: carName,
          finishPosition: toNumber(race.finish_position ?? race.finish_pos),
          startPosition: toNumber(race.start_position ?? race.starting_position ?? race.start_pos),
          iratingChange: irChange,
          incidents: toNumber(race.incidents ?? race.incident_count ?? race.incidents_total),
          lapsLed: toNumber(race.laps_led),
          strengthOfField: toNumber(race.strength_of_field ?? race.sof),
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
    
    // custId를 숫자로 변환하여 전달
    const custIdNum = parseInt(custId, 10)
    if (isNaN(custIdNum)) {
      return NextResponse.json({ error: 'Invalid custId' }, { status: 400 })
    }
    
    const prof = await irGet<{ 
      members?: Array<{ 
        cust_id: number
        display_name: string
        country?: string
        flair_name?: string
        i_rating?: number
        license_level?: string
      }> 
    }>(
      '/data/member/get',
      { cust_ids: custIdNum }
    )
    
    console.log('[Driver Detail] Member API response:', JSON.stringify(prof, null, 2))
    console.log('[Driver Detail] Members count:', prof?.members?.length ?? 0)
    
    // ratings API는 존재하지 않을 수 있으므로 try-catch로 처리
    let ratings: { i_rating?: number; safety_rating?: number; licenses?: Array<{ category: string; class: string }> } | null = null
    try {
      ratings = await irGet<{ i_rating?: number; safety_rating?: number; licenses?: Array<{ category: string; class: string }> }>(
        '/data/member/ratings',
        { cust_id: custIdNum }
      )
    } catch (error) {
      console.warn('[Driver Detail] Unable to fetch ratings (endpoint may not exist):', error instanceof Error ? error.message : error)
      // ratings가 없어도 계속 진행
    }

    let careerData: any = null
    try {
      careerData = await irGet<{ career?: any }>(
        '/data/stats/member_career',
        { cust_id: custIdNum }
      )
      console.log('[Driver Detail] Career API response:', JSON.stringify(careerData, null, 2))
      // Career stats에 iRating이나 Safety Rating이 포함되어 있는지 확인
      if (careerData?.stats && Array.isArray(careerData.stats)) {
        console.log('[Driver Detail] Career stats structure check:', {
          statsCount: careerData.stats.length,
          firstStatKeys: careerData.stats[0] ? Object.keys(careerData.stats[0]) : [],
          hasIRating: careerData.stats.some((s: any) => s.i_rating !== undefined),
          hasSafetyRating: careerData.stats.some((s: any) => s.safety_rating !== undefined),
          hasSubLevel: careerData.stats.some((s: any) => s.sub_level !== undefined),
        })
      }
    } catch (error) {
      console.warn('[Driver Detail] Unable to fetch career stats:', error)
    }

    // 최근 레이스 데이터 가져오기 (선택된 카테고리 또는 자동 감지)
    // category_id: 1=Oval, 2=Road, 3=Dirt Oval, 4=Dirt Road, 5=Sports Car, 6=Formula Car
    let recentRaceData: DriverRecentRace[] | null = null
    let recentRacesRaw: any = null
    let recentAllRaces: any = null // 필터링 전 모든 최근 레이스 (iRating/Safety Rating 찾기용)
    let primaryCategoryId: number | null = selectedCategoryId
    
    if (selectedCategoryId) {
      // 특정 카테고리로 조회
      // 주의: iRacing API가 category_id 파라미터를 무시할 수 있으므로,
      // category_id 없이 모든 레이스를 가져온 후 클라이언트 측에서 필터링
      console.log(`[Driver Detail] Fetching recent races for category ${selectedCategoryId}`)
      try {
        // category_id 파라미터 없이 모든 최근 레이스 가져오기
        const recent = await irGet<any>(
          '/data/stats/member_recent_races',
          { cust_id: custIdNum }
        )
        recentAllRaces = recent // 필터링 전 원본 데이터 저장
        // API 응답 구조 전체 로깅 (첫 번째 레이스의 모든 필드 확인)
        const firstRace = recent?.races?.[0]
        console.log(`[Driver Detail] Recent races API response (Category ${selectedCategoryId}):`, {
          racesCount: recent?.races?.length || 0,
          hasRaces: !!recent?.races && recent.races.length > 0,
          firstRaceAllFields: firstRace ? Object.keys(firstRace).reduce((acc: any, key: string) => {
            acc[key] = firstRace[key]
            return acc
          }, {}) : null,
        })
        
        // iRacing API가 category_id 파라미터를 무시할 수 있으므로, 응답에서 카테고리 필터링
        let filteredRaces = recent?.races || []
        if (selectedCategoryId && filteredRaces.length > 0) {
          const beforeFilter = filteredRaces.length
          
          // 카테고리 매핑: API 응답의 실제 필드명 확인 필요
          // 가능한 필드: license_category_id, category_id, license_category (문자열)
          filteredRaces = filteredRaces.filter((race: any) => {
            // 1. license_category_id 필드 확인
            if (race.license_category_id !== undefined && race.license_category_id !== null) {
              return race.license_category_id === selectedCategoryId
            }
            
            // 2. category_id 필드 확인 (다른 가능한 필드명)
            if (race.category_id !== undefined && race.category_id !== null) {
              return race.category_id === selectedCategoryId
            }
            
            // 3. license_category 문자열로 매핑
            const categoryMap: Record<string, number> = {
              'Oval': 1,
              'Road': 2,
              'Dirt Oval': 3,
              'Dirt Road': 4,
              'Sports Car': 5,
              'Formula Car': 6,
            }
            const raceCategory = race.license_category
            if (raceCategory && categoryMap[raceCategory] === selectedCategoryId) {
              return true
            }
            
          // 4. series_name으로 카테고리 추론 (더 정확한 패턴 매칭)
          const seriesName = (race.series_name || '').toLowerCase()
          
          // Formula Car (6): Formula, F1, F2, F3, F4, F2000, IndyCar, Super Formula 등
          if (selectedCategoryId === 6) {
            const formulaPatterns = ['formula', 'f1', 'f2', 'f3', 'f4', 'f2000', 'indycar', 'indy', 'super formula', 'formula renault', 'formula ford', 'usf2000', 'pro mazda']
            if (formulaPatterns.some(pattern => seriesName.includes(pattern))) {
              return true
            }
          }
          
          // Sports Car (5): GT3, GT4, IMSA, WEC, GTE, LMP, Prototype, TCR, Touring Car, MX-5 Cup 등
          if (selectedCategoryId === 5) {
            const sportsCarPatterns = ['gt3', 'gt4', 'gtd', 'gte', 'imsa', 'wec', 'lmp', 'prototype', 'tcr', 'touring car', 'mx-5', 'mazda mx-5', 'porsche cup', 'ferrari challenge', 'lamborghini', 'audi', 'bmw', 'mercedes', 'mclaren gt', 'aston martin']
            if (sportsCarPatterns.some(pattern => seriesName.includes(pattern))) {
              return true
            }
            // "Sports Car"가 직접 포함된 경우
            if (seriesName.includes('sports car')) {
              return true
            }
          }
          
          // Oval (1): NASCAR, Stock Car, Oval, Short Track, Late Model 등
          if (selectedCategoryId === 1) {
            const ovalPatterns = ['nascar', 'stock car', 'oval', 'short track', 'late model', 'dirt late model', 'modified', 'sprint car', 'dirt sprint']
            if (ovalPatterns.some(pattern => seriesName.includes(pattern))) {
              return true
            }
          }
          
          // Dirt Oval (3): Dirt, Dirt Track, Dirt Late Model 등
          if (selectedCategoryId === 3) {
            const dirtOvalPatterns = ['dirt oval', 'dirt track', 'dirt late model', 'dirt sprint', 'dirt modified', 'dirt street stock']
            if (dirtOvalPatterns.some(pattern => seriesName.includes(pattern))) {
              return true
            }
          }
          
          // Dirt Road (4): Dirt Road, Rallycross 등
          if (selectedCategoryId === 4) {
            const dirtRoadPatterns = ['dirt road', 'rallycross', 'rally cross']
            if (dirtRoadPatterns.some(pattern => seriesName.includes(pattern))) {
              return true
            }
          }
          
          // Road (2): 일반 Road 레이싱 (다른 카테고리에 해당하지 않는 경우)
          if (selectedCategoryId === 2) {
            // Formula, Sports Car, Oval, Dirt가 아닌 경우
            const excludePatterns = ['formula', 'f1', 'f2', 'f3', 'f4', 'gt3', 'gt4', 'nascar', 'oval', 'dirt']
            if (!excludePatterns.some(pattern => seriesName.includes(pattern))) {
              return true
            }
          }
          
          // 5. 카테고리 정보가 없으면 제외 (안전한 필터링)
          console.log(`[Driver Detail] Race filtered out (no category match):`, {
            series_name: race.series_name,
            selectedCategoryId,
            license_category: race.license_category,
            license_category_id: race.license_category_id,
            category_id: race.category_id,
          })
          return false
          })
          
          console.log(`[Driver Detail] Filtered races by category ${selectedCategoryId}: ${beforeFilter} -> ${filteredRaces.length}`)
          
          if (filteredRaces.length === 0 && beforeFilter > 0) {
            console.warn(`[Driver Detail] No races found for category ${selectedCategoryId} after filtering.`)
            console.warn(`[Driver Detail] Note: iRacing API returns only the most recent 10 races. If the driver's most recent races are in other categories, no races will be shown for this category.`)
            console.warn(`[Driver Detail] Career stats show ${careerData?.stats?.find((s: any) => s.category_id === selectedCategoryId)?.starts || 0} starts for category ${selectedCategoryId}, but they may be older than the 10 most recent races.`)
          }
        }
        
        recentRacesRaw = filteredRaces.length > 0 ? { ...recent, races: filteredRaces } : { ...recent, races: [] }
        recentRaceData = await buildRecentRaces(recentRacesRaw, custIdNum)
        console.log(`[Driver Detail] Built ${recentRaceData?.length || 0} recent races for category ${selectedCategoryId}`, {
          isNull: recentRaceData === null,
          isEmpty: Array.isArray(recentRaceData) && recentRaceData.length === 0,
        })
      } catch (error) {
        console.warn(`[Driver Detail] Unable to fetch recent races (Category ${selectedCategoryId}):`, error)
      }
    } else {
      // 카테고리 미지정 시 자동 감지
      try {
        // 먼저 Road 카테고리 (가장 일반적)로 시도
        const recent = await irGet<any>(
          '/data/stats/member_recent_races',
          { cust_id: custIdNum, category_id: 2 }
        )
        console.log('[Driver Detail] Recent races API response (Road):', JSON.stringify(recent, null, 2))
        recentRacesRaw = recent
        recentRaceData = await buildRecentRaces(recent, custIdNum)
        
        // 최근 레이스가 있으면 해당 카테고리 사용
        if (recentRacesRaw?.races && recentRacesRaw.races.length > 0) {
          primaryCategoryId = 2 // Road
        }
      } catch (error) {
        console.warn('[Driver Detail] Unable to fetch recent races (Road):', error)
      }
      
      // Road 카테고리에 레이스가 없으면 다른 카테고리 시도
      if (!recentRaceData || recentRaceData.length === 0) {
        const categories = [1, 3, 4, 5, 6] // Oval, Dirt Oval, Dirt Road, Sports Car, Formula Car
        for (const catId of categories) {
          try {
            const recent = await irGet<any>(
              '/data/stats/member_recent_races',
              { cust_id: custIdNum, category_id: catId }
            )
            if (recent?.races && recent.races.length > 0) {
              console.log(`[Driver Detail] Found recent races in category ${catId}`)
              recentRacesRaw = recent
              recentRaceData = await buildRecentRaces(recent, custIdNum)
              primaryCategoryId = catId
              break
            }
          } catch (error) {
            // 다음 카테고리 시도
            continue
          }
        }
      }
    }

    const member = prof?.members?.[0]
    
    // 선택된 카테고리에 해당하는 통계만 필터링
    let filteredCareerData: any = null
    console.log(`[Driver Detail] Filtering career data for category ${selectedCategoryId || 'all'}`)
    console.log(`[Driver Detail] Career data structure:`, {
      hasStats: !!careerData?.stats,
      isStatsArray: Array.isArray(careerData?.stats),
      statsCount: Array.isArray(careerData?.stats) ? careerData.stats.length : 0,
    })
    
    if (selectedCategoryId && careerData?.stats && Array.isArray(careerData.stats)) {
      const categoryStats = careerData.stats.find((s: any) => s.category_id === selectedCategoryId)
      console.log(`[Driver Detail] Looking for category ${selectedCategoryId} in stats:`, {
        found: !!categoryStats,
        availableCategories: careerData.stats.map((s: any) => ({ id: s.category_id, name: s.category })),
      })
      
      if (categoryStats) {
        // 단일 카테고리 통계를 performance 형식으로 변환 (배열이 아닌 단일 객체)
        filteredCareerData = {
          starts: categoryStats.starts || 0,
          wins: categoryStats.wins || 0,
          top5: categoryStats.top5 || 0,
          avg_finish_position: categoryStats.avg_finish_position || null,
          avg_incidents: categoryStats.avg_incidents || null,
          win_percentage: categoryStats.win_percentage || null,
          top5_percentage: categoryStats.top5_percentage || null,
        }
        console.log(`[Driver Detail] Filtered career data for category ${selectedCategoryId}:`, filteredCareerData)
      } else {
        // 해당 카테고리 통계가 없으면 null
        filteredCareerData = null
        console.log(`[Driver Detail] No stats found for category ${selectedCategoryId}`)
      }
    } else if (!selectedCategoryId && careerData?.stats && Array.isArray(careerData.stats)) {
      // 카테고리 미선택 시 모든 카테고리 합산 (기존 로직)
      filteredCareerData = careerData
      console.log(`[Driver Detail] Using all categories (no filter)`)
    } else {
      // 기존 구조 (단일 객체)
      filteredCareerData = careerData
      console.log(`[Driver Detail] Using single object structure`)
    }
    
    const performance = buildPerformance(filteredCareerData)
    console.log(`[Driver Detail] Built performance:`, {
      totalStarts: performance?.totalStarts,
      wins: performance?.wins,
      winRate: performance?.winRate,
      categoryId: selectedCategoryId,
    })
    
    // 카테고리별 iRating과 Safety Rating 가져오기
    // 우선순위:
    // 1. 필터링된 최근 레이스에서 가져오기 (가장 정확)
    // 2. 모든 최근 레이스에서 해당 카테고리 레이스 찾기
    // 3. Career stats에서 가져오기 (iRating/Safety Rating이 포함되어 있는 경우)
    // 4. Fallback: member나 ratings에서 가져오기
    let irating: number | null = null
    let safetyRating: number | null = null
    
    console.log(`[Driver Detail] Getting iRating/Safety Rating for category ${selectedCategoryId}:`, {
      hasRecentRacesRaw: !!recentRacesRaw,
      recentRacesRawCount: recentRacesRaw?.races?.length || 0,
      hasRecentAllRaces: !!recentAllRaces,
      recentAllRacesCount: recentAllRaces?.races?.length || 0,
    })
    
    // 1. 선택된 카테고리에 해당하는 필터링된 최근 레이스 찾기
    if (selectedCategoryId && recentRacesRaw?.races && recentRacesRaw.races.length > 0) {
      // 필터링된 레이스 중 가장 최근 레이스 사용
      const latestRace = recentRacesRaw.races[0]
      irating = toNumber(latestRace.newi_rating ?? latestRace.new_irating)
      // new_sub_level은 Safety Rating (0-4.99 범위)
      safetyRating = toNumber(latestRace.new_sub_level)
      console.log(`[Driver Detail] Using iRating and Safety Rating from filtered race for category ${selectedCategoryId}:`, {
        irating,
        safetyRating,
        series_name: latestRace.series_name,
      })
    }
    
    // 2. 필터링된 레이스가 없으면 모든 최근 레이스에서 해당 카테고리 레이스 찾기
    if ((!irating || !safetyRating) && selectedCategoryId && recentAllRaces?.races && recentAllRaces.races.length > 0) {
      console.log(`[Driver Detail] Searching for category ${selectedCategoryId} race in all ${recentAllRaces.races.length} recent races...`)
      // 필터링되지 않은 모든 최근 레이스에서 해당 카테고리 레이스 찾기
      // (필터링 로직이 모든 레이스를 제외했을 수 있으므로, 원본 데이터에서 찾기)
      const categoryRace = recentAllRaces.races.find((race: any) => {
        const seriesName = (race.series_name || '').toLowerCase()
        // 카테고리별 패턴 매칭 (필터링 로직과 동일)
        if (selectedCategoryId === 6) {
          const formulaPatterns = ['formula', 'f1', 'f2', 'f3', 'f4', 'f2000', 'indycar', 'indy', 'super formula']
          return formulaPatterns.some(pattern => seriesName.includes(pattern))
        }
        if (selectedCategoryId === 5) {
          const sportsCarPatterns = ['gt3', 'gt4', 'gtd', 'gte', 'imsa', 'wec', 'lmp', 'prototype', 'tcr', 'touring car', 'mx-5', 'mazda mx-5', 'porsche cup', 'ferrari challenge']
          return sportsCarPatterns.some(pattern => seriesName.includes(pattern)) || seriesName.includes('sports car')
        }
        if (selectedCategoryId === 1) {
          const ovalPatterns = ['nascar', 'stock car', 'oval', 'short track', 'late model']
          return ovalPatterns.some(pattern => seriesName.includes(pattern))
        }
        if (selectedCategoryId === 3) {
          const dirtOvalPatterns = ['dirt oval', 'dirt track', 'dirt late model']
          return dirtOvalPatterns.some(pattern => seriesName.includes(pattern))
        }
        if (selectedCategoryId === 4) {
          const dirtRoadPatterns = ['dirt road', 'rallycross', 'rally cross']
          return dirtRoadPatterns.some(pattern => seriesName.includes(pattern))
        }
        return false
      })
      
      if (categoryRace) {
        irating = toNumber(categoryRace.newi_rating ?? categoryRace.new_irating)
        safetyRating = toNumber(categoryRace.new_sub_level)
        console.log(`[Driver Detail] Found category ${selectedCategoryId} race in all recent races:`, {
          irating,
          safetyRating,
          series_name: categoryRace.series_name,
          subsession_id: categoryRace.subsession_id,
        })
      } else {
        console.log(`[Driver Detail] No category ${selectedCategoryId} race found in all ${recentAllRaces.races.length} recent races. All races are:`, 
          recentAllRaces.races.map((r: any) => r.series_name).slice(0, 5)
        )
      }
    } else if (recentRacesRaw?.races && recentRacesRaw.races.length > 0) {
      // 카테고리 미지정 시 가장 최근 레이스 사용
      const latestRace = recentRacesRaw.races[0]
      irating = toNumber(latestRace.newi_rating ?? latestRace.new_irating)
      safetyRating = toNumber(latestRace.new_sub_level)
      console.log(`[Driver Detail] Using iRating and Safety Rating from latest race (category ${primaryCategoryId}):`, {
        irating,
        safetyRating,
      })
    }
    
    // 3. Career stats에서 가져오기 시도 (iRating/Safety Rating이 포함되어 있는 경우)
    if ((!irating || !safetyRating) && selectedCategoryId && careerData?.stats && Array.isArray(careerData.stats)) {
      const categoryStats = careerData.stats.find((s: any) => s.category_id === selectedCategoryId)
      if (categoryStats) {
        // Career stats에 iRating이나 Safety Rating이 포함되어 있는지 확인
        if (!irating && categoryStats.i_rating !== undefined) {
          irating = toNumber(categoryStats.i_rating)
          console.log(`[Driver Detail] Using iRating from career stats for category ${selectedCategoryId}:`, irating)
        }
        if (!safetyRating && categoryStats.safety_rating !== undefined) {
          safetyRating = toNumber(categoryStats.safety_rating)
          console.log(`[Driver Detail] Using Safety Rating from career stats for category ${selectedCategoryId}:`, safetyRating)
        }
        // Career stats에 license_level이나 sub_level이 있는지 확인
        if (!safetyRating && categoryStats.sub_level !== undefined) {
          safetyRating = toNumber(categoryStats.sub_level)
          console.log(`[Driver Detail] Using sub_level from career stats for category ${selectedCategoryId}:`, safetyRating)
        }
      }
    }
    
    // ratings나 member에서 가져오기 (fallback)
    if (!irating) {
      irating = ratings?.i_rating ?? member?.i_rating ?? null
    }
    if (!safetyRating) {
      safetyRating = ratings?.safety_rating ?? null
    }
    
    // 라이선스 정보는 iRacing API에서 직접 제공하지 않으므로 표시하지 않음
    const licenseClass: string | null = null
    const licenses: Array<{ category: string; class: string }> | null = null
    
    // 경고 메시지 생성: 최근 레이스가 없어서 iRating/Safety Rating을 표시할 수 없는 경우
    let warning: string | null = null
    if (selectedCategoryId) {
      const categoryNames: Record<number, string> = {
        1: 'Oval',
        2: 'Road',
        3: 'Dirt Oval',
        4: 'Dirt Road',
        5: 'Sports Car',
        6: 'Formula Car',
      }
      const categoryName = categoryNames[selectedCategoryId] || 'this category'
      const hasRecentRaces = recentRaceData && recentRaceData.length > 0
      const hasIRating = irating !== null && irating !== undefined
      const hasSafetyRating = safetyRating !== null && safetyRating !== undefined
      
      if (!hasRecentRaces && (!hasIRating || !hasSafetyRating)) {
        warning = `최근 10개 레이스에 ${categoryName} 카테고리 레이스가 없어서 iRating과 Safety Rating을 표시할 수 없습니다. iRacing API는 최근 10개 레이스만 반환합니다.`
      } else if (!hasIRating && !hasSafetyRating && hasRecentRaces) {
        warning = `${categoryName} 카테고리의 최근 레이스에서 iRating과 Safety Rating 정보를 찾을 수 없습니다.`
      } else if (!hasIRating) {
        warning = `${categoryName} 카테고리의 최근 레이스에서 iRating 정보를 찾을 수 없습니다.`
      } else if (!hasSafetyRating) {
        warning = `${categoryName} 카테고리의 최근 레이스에서 Safety Rating 정보를 찾을 수 없습니다.`
      }
    }
    
    console.log(`[Driver Detail] Building final detail object:`, {
      categoryId: primaryCategoryId,
      performance: {
        totalStarts: performance?.totalStarts,
        wins: performance?.wins,
        winRate: performance?.winRate,
      },
      recentRacesCount: recentRaceData?.length || 0,
      strengthsCount: recentRaceData ? buildStrengths(recentRaceData)?.length || 0 : 0,
      warning: warning || null,
    })
    
    const detail: IracingDriverDetail = {
      custId,
      name: member?.display_name ?? 'Unknown',
      country: member?.country || member?.flair_name || null,
      irating,
      licenseClass,
      safetyRating,
      licenses,
      lastUpdated: new Date().toISOString(),
      performance,
      trends: buildTrends(recentRaceData, irating, safetyRating),
      strengths: buildStrengths(recentRaceData),
      recentRaces: recentRaceData,
      consistency: buildConsistency(performance, recentRaceData),
      highlights: buildHighlights(performance, recentRaceData),
      categoryId: primaryCategoryId, // 현재 표시 중인 카테고리 ID
      warning, // 경고 메시지
    }
    
    console.log(`[Driver Detail] Final detail object:`, {
      categoryId: detail.categoryId,
      performanceTotalStarts: detail.performance?.totalStarts,
      recentRacesCount: detail.recentRaces?.length || 0,
      strengthsCount: detail.strengths?.length || 0,
    })
    cache.set(cacheKey, detail, 5 * 60_000)
    return NextResponse.json(detail)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upstream error'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}


