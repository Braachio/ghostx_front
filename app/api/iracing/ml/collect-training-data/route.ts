import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { irGet } from '@/lib/iracingClient'
import { extractFeaturesFromRecentRaces, type RecentRace } from '@/lib/iracingMLFeatures'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const limiter = new IpRateLimiter(5) // 데이터 수집은 rate limit 낮춤

/**
 * 최근 레이스 데이터 가져오기 (최대 10경기)
 */
async function fetchRecentRaces(custId: number): Promise<RecentRace[]> {
  try {
    const recentRacesData = await irGet<any>(
      '/data/stats/member_recent_races',
      { cust_id: custId }
    )

    if (!recentRacesData || !Array.isArray(recentRacesData)) {
      return []
    }

    const races = recentRacesData.slice(0, 10)
    
    return races.map((race: any) => ({
      finish_position: race.finish_position ?? race.finish_position_in_class ?? 0,
      incidents: race.incidents ?? 0,
      dnf: race.dnf ?? false,
      i_rating_before: race.oldi_rating ?? race.old_i_rating ?? null,
      i_rating_after: race.newi_rating ?? race.new_i_rating ?? null,
      safety_rating_before: race.old_sub_level ? race.old_sub_level / 100 : null,
      safety_rating_after: race.new_sub_level ? race.new_sub_level / 100 : null,
      session_start_time: race.session_start_time ?? race.start_time ?? new Date().toISOString(),
    }))
  } catch (error) {
    console.error(`[Training Data] Failed to fetch recent races for ${custId}:`, error)
    return []
  }
}

/**
 * 세션 결과에서 참가자 정보 가져오기
 */
async function getSessionParticipants(subsessionId: number) {
  try {
    const sessionResults = await irGet<any>('/data/results/get', { 
      subsession_id: subsessionId 
    })
    
    let raceResults: any[] = []
    if (sessionResults.session_results && Array.isArray(sessionResults.session_results)) {
      const raceSession = sessionResults.session_results.find((s: any) => s.simsession_number === 0)
      if (raceSession && raceSession.results) {
        raceResults = raceSession.results
      }
    } else if (sessionResults.results) {
      raceResults = sessionResults.results
    }
    
    return {
      results: raceResults,
      sessionInfo: {
        series_id: sessionResults.series_id ?? null,
        series_name: sessionResults.series_name ?? null,
        track_id: sessionResults.track_id ?? null,
        track_name: sessionResults.track_name ?? null,
        session_start_time: sessionResults.session_start_time ?? null,
      }
    }
  } catch (error) {
    console.error(`[Training Data] Failed to get session results for ${subsessionId}:`, error)
    throw error
  }
}

/**
 * POST /api/iracing/ml/collect-training-data
 * 과거 세션 데이터를 수집하여 ML 학습 데이터 생성
 * 
 * Body: { subsessionIds: number[] }
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  if (!limiter.allow(ip)) {
    return NextResponse.json({ error: 'rate limit' }, { status: 429 })
  }

  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // 인증 확인
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body
    try {
      body = await req.json()
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid JSON body. Expected: { subsessionIds: number[] }' 
      }, { status: 400 })
    }

    const { subsessionIds } = body || {}

    if (!body || !subsessionIds) {
      return NextResponse.json({ 
        error: 'subsessionIds array required in request body. Example: { "subsessionIds": [71628994, 71693839] }' 
      }, { status: 400 })
    }

    if (!Array.isArray(subsessionIds)) {
      return NextResponse.json({ 
        error: 'subsessionIds must be an array. Example: { "subsessionIds": [71628994, 71693839] }' 
      }, { status: 400 })
    }

    if (subsessionIds.length === 0) {
      return NextResponse.json({ 
        error: 'subsessionIds array cannot be empty' 
      }, { status: 400 })
    }

    console.log(`[Training Data] Starting collection for ${subsessionIds.length} sessions`)

    let totalCollected = 0
    let totalFailed = 0
    const errors: string[] = []

    // 각 세션 처리
    for (const subsessionId of subsessionIds) {
      try {
        console.log(`[Training Data] Processing session ${subsessionId}...`)

        // 1. 세션 결과 가져오기
        const { results, sessionInfo } = await getSessionParticipants(subsessionId)
        
        if (!results || results.length === 0) {
          console.warn(`[Training Data] No results found for session ${subsessionId}`)
          totalFailed++
          continue
        }

        const totalParticipants = results.length

        // 2. SOF 계산 (평균 iRating)
        const iratings = results
          .map((r: any) => r.newi_rating ?? r.oldi_rating ?? r.i_rating ?? null)
          .filter((v: any): v is number => typeof v === 'number')
        const sof = iratings.length > 0 
          ? Math.round(iratings.reduce((a: number, b: number) => a + b, 0) / iratings.length)
          : null

        // 3. 상대 전력 통계 계산 (각 참가자마다)
        const opponentStats = results.map((r: any) => ({
          custId: String(r.cust_id),
          iRating: r.newi_rating ?? r.oldi_rating ?? r.i_rating ?? null,
        }))

        // 4. 각 참가자를 기준으로 학습 데이터 생성
        const trainingDataPromises = results.map(async (result: any) => {
          const custId = String(result.cust_id)
          const custIdNum = parseInt(custId, 10)
          
          if (isNaN(custIdNum)) {
            return null
          }

          try {
            // 내 iRating과 Safety Rating
            const myIRating = result.newi_rating ?? result.oldi_rating ?? result.i_rating ?? null
            const mySafetyRating = result.new_sub_level ? result.new_sub_level / 100 : null

            // 최근 레이스 데이터 가져오기
            const recentRaces = await fetchRecentRaces(custIdNum)
            
            // 특성 추출
            const features = extractFeaturesFromRecentRaces(
              recentRaces,
              myIRating,
              mySafetyRating,
              sof,
              totalParticipants,
              result.starting_position ?? null
            )

            // 상대 전력 통계 계산 (나를 제외한 상대들의 통계)
            const opponents = opponentStats.filter(o => o.custId !== custId)
            const opponentIRatings = opponents
              .map(o => o.iRating)
              .filter((v): v is number => v !== null && typeof v === 'number' && !isNaN(v))
            
            const avgOpponentIR = opponentIRatings.length > 0
              ? Math.round(opponentIRatings.reduce((a, b) => a + b, 0) / opponentIRatings.length)
              : null
            
            const maxOpponentIR = opponentIRatings.length > 0
              ? Math.round(Math.max(...opponentIRatings))
              : null
            
            const minOpponentIR = opponentIRatings.length > 0
              ? Math.round(Math.min(...opponentIRatings))
              : null

            // 실제 결과
            const actualFinishPosition = result.finish_position ?? result.finish_position_in_class ?? null
            const actualIncidents = result.incidents ?? null
            const actualDnf = result.dnf ?? false

            // 세션 결과에서 추가 데이터 추출
            const bestLapTime = result.best_lap_time 
              ? (typeof result.best_lap_time === 'number' ? result.best_lap_time / 10000 : parseFloat(String(result.best_lap_time)) / 10000) // 마이크로초를 초로 변환
              : null
            const lapsLed = result.laps_led ?? result.lapsled ?? null
            const lapsComplete = result.laps_complete ?? result.lapscomplete ?? result.laps ?? null
            const qualifyingTime = result.qualifying_time 
              ? (typeof result.qualifying_time === 'number' ? result.qualifying_time / 10000 : parseFloat(String(result.qualifying_time)) / 10000) // 마이크로초를 초로 변환
              : null
            const points = result.points ?? null
            const carId = result.car_id ?? result.carid ?? null
            const licenseLevel = result.license_level ?? result.licenselevel ?? result.old_license_level ?? result.new_license_level ?? null

            // 학습 데이터 생성 (타입 검증 및 변환)
            const trainingRecord: any = {
              subsession_id: parseInt(String(subsessionId), 10),
              cust_id: parseInt(String(custIdNum), 10),
              
              // 입력 특성
              i_rating: features.i_rating ? parseInt(String(features.i_rating), 10) : null,
              safety_rating: features.safety_rating !== null && features.safety_rating !== undefined 
                ? parseFloat(String(features.safety_rating)) 
                : null,
              avg_incidents_per_race: features.avg_incidents_per_race !== null && features.avg_incidents_per_race !== undefined
                ? parseFloat(String(features.avg_incidents_per_race))
                : null,
              dnf_rate: features.dnf_rate !== null && features.dnf_rate !== undefined
                ? parseFloat(String(features.dnf_rate))
                : null,
              recent_avg_finish_position: features.recent_avg_finish_position !== null && features.recent_avg_finish_position !== undefined
                ? parseFloat(String(features.recent_avg_finish_position))
                : null,
              avg_finish_position: features.avg_finish_position !== null && features.avg_finish_position !== undefined
                ? parseFloat(String(features.avg_finish_position))
                : null,
              win_rate: features.win_rate !== null && features.win_rate !== undefined
                ? parseFloat(String(features.win_rate))
                : null,
              top5_rate: features.top5_rate !== null && features.top5_rate !== undefined
                ? parseFloat(String(features.top5_rate))
                : null,
              top10_rate: features.top10_rate !== null && features.top10_rate !== undefined
                ? parseFloat(String(features.top10_rate))
                : null,
              ir_trend: features.ir_trend !== null && features.ir_trend !== undefined
                ? parseFloat(String(features.ir_trend))
                : null,
              sr_trend: features.sr_trend !== null && features.sr_trend !== undefined
                ? parseFloat(String(features.sr_trend))
                : null,
              sof: sof ? parseInt(String(sof), 10) : null,
              starting_position: result.starting_position !== null && result.starting_position !== undefined
                ? parseInt(String(result.starting_position), 10)
                : null,
              
              // 세션 컨텍스트
              series_id: sessionInfo.series_id ? parseInt(String(sessionInfo.series_id), 10) : null,
              track_id: sessionInfo.track_id ? parseInt(String(sessionInfo.track_id), 10) : null, // ✅ 이미 수집 중
              total_participants: parseInt(String(totalParticipants), 10),
              
              // 상대 전력 통계 (추가) - INTEGER 필드이므로 null이거나 정수여야 함
              avg_opponent_ir: avgOpponentIR !== null && !isNaN(avgOpponentIR) ? avgOpponentIR : null,
              max_opponent_ir: maxOpponentIR !== null && !isNaN(maxOpponentIR) ? maxOpponentIR : null,
              min_opponent_ir: minOpponentIR !== null && !isNaN(minOpponentIR) ? minOpponentIR : null,
              ir_diff_from_avg: (myIRating && avgOpponentIR && !isNaN(myIRating) && !isNaN(avgOpponentIR))
                ? parseInt(String(myIRating - avgOpponentIR), 10)
                : null,
              
              // 추가 Feature (세션 결과에서)
              best_lap_time: bestLapTime !== null && !isNaN(bestLapTime) ? parseFloat(String(bestLapTime)) : null,
              laps_led: lapsLed !== null && lapsLed !== undefined ? parseInt(String(lapsLed), 10) : null,
              laps_complete: lapsComplete !== null && lapsComplete !== undefined ? parseInt(String(lapsComplete), 10) : null,
              qualifying_time: qualifyingTime !== null && !isNaN(qualifyingTime) ? parseFloat(String(qualifyingTime)) : null,
              points: points !== null && points !== undefined ? parseInt(String(points), 10) : null,
              car_id: carId !== null && carId !== undefined ? parseInt(String(carId), 10) : null,
              license_level: licenseLevel !== null && licenseLevel !== undefined ? parseInt(String(licenseLevel), 10) : null,
              
              // 실제 결과
              actual_finish_position: actualFinishPosition !== null && actualFinishPosition !== undefined
                ? parseInt(String(actualFinishPosition), 10)
                : null,
              actual_incidents: actualIncidents !== null && actualIncidents !== undefined
                ? parseInt(String(actualIncidents), 10)
                : null,
              actual_dnf: Boolean(actualDnf),
              
              session_start_time: sessionInfo.session_start_time || null,
            }

            // null 값 제거 (데이터베이스에서 허용하는 경우에만)
            // INTEGER 필드는 null을 허용하므로 그대로 유지
            
            return trainingRecord
          } catch (error) {
            console.error(`[Training Data] Failed to process participant ${custId} in session ${subsessionId}:`, error)
            return null
          }
        })

        const trainingDataArray = (await Promise.all(trainingDataPromises))
          .filter((d): d is NonNullable<typeof d> => d !== null)

        if (trainingDataArray.length === 0) {
          console.warn(`[Training Data] No valid training data generated for session ${subsessionId}`)
          totalFailed++
          continue
        }

        // 5. 데이터베이스에 저장 (중복 체크)
        const { data: existing, error: checkError } = await supabase
          .from('iracing_ml_training_data')
          .select('id')
          .eq('subsession_id', subsessionId)
          .limit(1)

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
          throw checkError
        }

        // 이미 수집된 세션은 스킵
        if (existing && existing.length > 0) {
          console.log(`[Training Data] Session ${subsessionId} already collected, skipping`)
          continue
        }

        // 배치 삽입
        const { error: insertError } = await supabase
          .from('iracing_ml_training_data')
          .insert(trainingDataArray)

        if (insertError) {
          console.error(`[Training Data] Failed to insert data for session ${subsessionId}:`, insertError)
          errors.push(`Session ${subsessionId}: ${insertError.message}`)
          totalFailed++
        } else {
          console.log(`[Training Data] Successfully collected ${trainingDataArray.length} records for session ${subsessionId}`)
          totalCollected += trainingDataArray.length
        }

        // Rate limit 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000))

      } catch (error) {
        console.error(`[Training Data] Error processing session ${subsessionId}:`, error)
        errors.push(`Session ${subsessionId}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        totalFailed++
      }
    }

    return NextResponse.json({
      success: true,
      totalSessions: subsessionIds.length,
      totalCollected,
      totalFailed,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Training Data] Error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

