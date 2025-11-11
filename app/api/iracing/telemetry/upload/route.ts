import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { TelemetryUploadRequest, TelemetryUploadResponse } from '@/lib/iracingTypes'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'
import crypto from 'crypto'
import { TELEMETRY_ENABLED, TELEMETRY_DISABLED_MESSAGE } from '@/lib/featureFlags'

const limiter = new IpRateLimiter(10) // 텔레메트리 업로드는 rate limit을 낮게 설정

/**
 * POST /api/iracing/telemetry/upload
 * iRacing 텔레메트리 데이터를 수집하여 DB에 저장
 * 
 * Body: TelemetryUploadRequest
 * - session: 세션 메타데이터
 * - samples: 텔레메트리 샘플 배열 (최대 10,000개)
 */
export async function POST(req: NextRequest) {
  if (!TELEMETRY_ENABLED) {
    return NextResponse.json({ error: TELEMETRY_DISABLED_MESSAGE }, { status: 503 })
  }

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

    const body: TelemetryUploadRequest = await req.json()

    if (!body.samples || !Array.isArray(body.samples)) {
      return NextResponse.json(
        { error: 'samples array required' },
        { status: 400 }
      )
    }

    // session 또는 session_id 중 하나는 필수
    if (!body.session && !body.session_id) {
      return NextResponse.json(
        { error: 'session or session_id required' },
        { status: 400 }
      )
    }

    // 샘플 수 제한 (성능 고려)
    if (body.samples.length > 10000) {
      return NextResponse.json(
        { error: 'samples array too large (max 10,000)' },
        { status: 400 }
      )
    }

    let sessionId: string
    let sessionData: { id: string }

    // 기존 세션에 샘플 추가
    if (body.session_id) {
      // 세션 존재 확인
      const { data: existingSession, error: sessionError } = await supabase
        .from('iracing_telemetry_sessions')
        .select('id, user_id, sample_count')
        .eq('id', body.session_id)
        .eq('user_id', user.id)
        .single()

      if (sessionError || !existingSession) {
        return NextResponse.json(
          { error: 'Session not found or access denied' },
          { status: 404 }
        )
      }

      sessionId = existingSession.id

      // 샘플 수 업데이트
      await supabase
        .from('iracing_telemetry_sessions')
        .update({
          sample_count: (existingSession.sample_count || 0) + body.samples.length,
        })
        .eq('id', sessionId)

      sessionData = { id: sessionId }
    } else {
      // 새 세션 생성
      if (!body.session) {
        return NextResponse.json(
          { error: 'session required when creating new session' },
          { status: 400 }
        )
      }

      // 데이터 해시 생성 (중복 검사)
      const dataString = JSON.stringify({
        user_id: user.id,
        track_id: body.session.track_id,
        car_id: body.session.car_id,
        start_time: body.session.start_time,
        samples: body.samples.slice(0, 100).map(s => ({
          elapsed_time: s.elapsed_time,
          throttle: s.throttle_position,
          brake: s.brake_position,
          speed: s.speed_kmh,
        })),
      })
      const dataHash = crypto.createHash('sha256').update(dataString).digest('hex')

      // 중복 검사
      const { data: existing } = await supabase
        .from('iracing_telemetry_sessions')
        .select('id')
        .eq('data_hash', dataHash)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'Duplicate session data', session_id: existing.id },
          { status: 409 }
        )
      }

      // 세션 기간 계산
      const startTime = new Date(body.session.start_time)
      const endTime = body.session.end_time ? new Date(body.session.end_time) : new Date()
      const durationSeconds = (endTime.getTime() - startTime.getTime()) / 1000

      // 샘플링 주파수 계산 (대략적)
      const sampleRateHz = body.samples.length > 1
        ? body.samples.length / durationSeconds
        : null

      // 세션 메타데이터 저장
      const { data: newSessionData, error: sessionError } = await supabase
        .from('iracing_telemetry_sessions')
        .insert({
          user_id: user.id,
          session_name: body.session.session_name || null,
          track_id: body.session.track_id || null,
          track_name: body.session.track_name || null,
          car_id: body.session.car_id || null,
          car_name: body.session.car_name || null,
          session_type: body.session.session_type || null,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
          sample_count: body.samples.length,
          sample_rate_hz: sampleRateHz,
          data_hash: dataHash,
          is_complete: true,
          notes: body.session.notes || null,
        })
        .select('id')
        .single()

      if (sessionError) {
        console.error('Failed to insert session:', sessionError)
        throw sessionError
      }

      sessionId = newSessionData.id
      sessionData = newSessionData
    }

    // 값 검증 및 클리핑 함수
    const clampDecimal53 = (value: number | null | undefined): number | null => {
      if (value === null || value === undefined || isNaN(value)) return null
      // DECIMAL(5,3) 최대값: 99.999
      if (value > 99.999) return 99.999
      if (value < -99.999) return -99.999
      return value
    }
    
    const clampDecimal63 = (value: number | null | undefined): number | null => {
      if (value === null || value === undefined || isNaN(value)) return null
      // DECIMAL(6,3) 최대값: 999.999
      if (value > 999.999) return 999.999
      if (value < -999.999) return -999.999
      return value
    }
    
    const clamp01 = (value: number | null | undefined): number | null => {
      if (value === null || value === undefined || isNaN(value)) return null
      // 0.0 ~ 1.0 범위로 클리핑
      if (value > 1.0) return 1.0
      if (value < 0.0) return 0.0
      return value
    }

    // 샘플 데이터 준비 및 배치 삽입
    const sampleRecords = body.samples.map((sample) => ({
      session_id: sessionId,
      elapsed_time: sample.elapsed_time,
      
      // 제어 입력 (0.0~1.0 범위)
      throttle_position: clamp01(sample.throttle_position),
      brake_position: clamp01(sample.brake_position),
      steering_angle: sample.steering_angle ?? null, // 스티어링은 -180~180도 가능
      clutch_position: clamp01(sample.clutch_position),
      
      // 차량 상태
      speed_ms: sample.speed_ms ?? null,
      speed_kmh: sample.speed_kmh ?? null,
      rpm: sample.rpm ?? null,
      gear: sample.gear ?? null,
      engine_power: sample.engine_power ?? null,
      engine_torque: sample.engine_torque ?? null,
      
      // 위치
      position_x: sample.position_x ?? null,
      position_y: sample.position_y ?? null,
      position_z: sample.position_z ?? null,
      latitude: sample.latitude ?? null,
      longitude: sample.longitude ?? null,
      heading: sample.heading ?? null,
      distance_lap: sample.distance_lap ?? null,
      
      // 타이어
      tire_temp_fl: sample.tire_temp_fl ?? null,
      tire_temp_fr: sample.tire_temp_fr ?? null,
      tire_temp_rl: sample.tire_temp_rl ?? null,
      tire_temp_rr: sample.tire_temp_rr ?? null,
      tire_pressure_fl: clampDecimal63(sample.tire_pressure_fl), // DECIMAL(6,3) - 최대 999.999
      tire_pressure_fr: clampDecimal63(sample.tire_pressure_fr),
      tire_pressure_rl: clampDecimal63(sample.tire_pressure_rl),
      tire_pressure_rr: clampDecimal63(sample.tire_pressure_rr),
      tire_wear_fl: clamp01(sample.tire_wear_fl), // 0.0~1.0
      tire_wear_fr: clamp01(sample.tire_wear_fr),
      tire_wear_rl: clamp01(sample.tire_wear_rl),
      tire_wear_rr: clamp01(sample.tire_wear_rr),
      
      // 서스펜션
      suspension_travel_fl: sample.suspension_travel_fl ?? null,
      suspension_travel_fr: sample.suspension_travel_fr ?? null,
      suspension_travel_rl: sample.suspension_travel_rl ?? null,
      suspension_travel_rr: sample.suspension_travel_rr ?? null,
      ride_height_fl: sample.ride_height_fl ?? null,
      ride_height_fr: sample.ride_height_fr ?? null,
      ride_height_rl: sample.ride_height_rl ?? null,
      ride_height_rr: sample.ride_height_rr ?? null,
      
      // G-Force (DECIMAL(6,3) 또는 DECIMAL(5,3) - 보수적으로 5,3으로 클리핑)
      g_force_lateral: clampDecimal53(sample.g_force_lateral),
      g_force_longitudinal: clampDecimal53(sample.g_force_longitudinal),
      g_force_vertical: clampDecimal53(sample.g_force_vertical),
      
      // 슬립 (0.0~1.0 범위 또는 DECIMAL(5,3))
      wheel_slip_fl: clampDecimal53(sample.wheel_slip_fl),
      wheel_slip_fr: clampDecimal53(sample.wheel_slip_fr),
      wheel_slip_rl: clampDecimal53(sample.wheel_slip_rl),
      wheel_slip_rr: clampDecimal53(sample.wheel_slip_rr),
      
      // 브레이크/ABS
      brake_temperature_fl: sample.brake_temperature_fl ?? null,
      brake_temperature_fr: sample.brake_temperature_fr ?? null,
      brake_temperature_rl: sample.brake_temperature_rl ?? null,
      brake_temperature_rr: sample.brake_temperature_rr ?? null,
      abs_active: sample.abs_active ?? null,
      traction_control_active: sample.traction_control_active ?? null,
      
      // 메타데이터
      lap_number: sample.lap_number ?? null,
      sector_number: sample.sector_number ?? null,
      fuel_level: sample.fuel_level ?? null,
      fuel_pressure: sample.fuel_pressure ?? null,
    }))

    // 배치로 삽입 (500개씩 - 더 작은 배치로 안정성 향상)
    const batchSize = 500
    let totalInserted = 0
    const totalBatches = Math.ceil(sampleRecords.length / batchSize)
    const failedBatches: Array<{ batchNum: number; startIdx: number; size: number; error: string }> = []

    console.log(`[Telemetry Upload] Inserting ${sampleRecords.length} samples in ${totalBatches} batches (batchSize: ${batchSize})`)

    // 첫 번째 패스: 배치 삽입 시도
    for (let i = 0; i < sampleRecords.length; i += batchSize) {
      const batch = sampleRecords.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      
      console.log(`[Telemetry Upload] Batch ${batchNum}/${totalBatches}: Inserting ${batch.length} samples...`)
      
      const { error: samplesError, data: insertedData } = await supabase
        .from('iracing_telemetry_samples')
        .insert(batch)
        .select('id')

      if (samplesError) {
        console.error(`[Telemetry Upload] Failed to insert batch ${batchNum}:`, samplesError)
        console.error(`[Telemetry Upload] Batch ${batchNum} error details:`, JSON.stringify(samplesError, null, 2))
        
        // 문제가 될 수 있는 값들을 로깅 (첫 번째 샘플만)
        if (batch.length > 0) {
          const firstSample = batch[0]
          console.error(`[Telemetry Upload] First sample in failed batch ${batchNum}:`, {
            elapsed_time: firstSample.elapsed_time,
            g_force_lateral: firstSample.g_force_lateral,
            g_force_longitudinal: firstSample.g_force_longitudinal,
            g_force_vertical: firstSample.g_force_vertical,
            tire_pressure_fl: firstSample.tire_pressure_fl,
            wheel_slip_fl: firstSample.wheel_slip_fl,
            throttle_position: firstSample.throttle_position,
            brake_position: firstSample.brake_position,
          })
        }
        
        // 실패한 배치 기록
        failedBatches.push({
          batchNum,
          startIdx: i,
          size: batch.length,
          error: samplesError.message || 'Unknown error'
        })
        
        // 실패한 배치를 더 작은 단위로 재시도 (250개씩)
        console.log(`[Telemetry Upload] Retrying batch ${batchNum} in smaller chunks (250 each)...`)
        const retryBatchSize = 250
        for (let retryIdx = i; retryIdx < i + batch.length; retryIdx += retryBatchSize) {
          const retryBatch = sampleRecords.slice(retryIdx, Math.min(retryIdx + retryBatchSize, i + batch.length))
          const retryChunkNum = Math.floor((retryIdx - i) / retryBatchSize) + 1
          
          console.log(`[Telemetry Upload] Retry chunk ${retryChunkNum} of batch ${batchNum}: ${retryBatch.length} samples...`)
          
          const { error: retryError, data: retryData } = await supabase
            .from('iracing_telemetry_samples')
            .insert(retryBatch)
            .select('id')
          
          if (retryError) {
            console.error(`[Telemetry Upload] Retry chunk ${retryChunkNum} of batch ${batchNum} also failed:`, retryError)
            // 재시도도 실패하면 더 작게 나눔 (100개씩)
            if (retryBatch.length > 100) {
              const finalBatchSize = 100
              for (let finalIdx = retryIdx; finalIdx < retryIdx + retryBatch.length; finalIdx += finalBatchSize) {
                const finalBatch = sampleRecords.slice(finalIdx, Math.min(finalIdx + finalBatchSize, retryIdx + retryBatch.length))
                
                const { error: finalError, data: finalData } = await supabase
                  .from('iracing_telemetry_samples')
                  .insert(finalBatch)
                  .select('id')
                
                if (finalError) {
                  console.error(`[Telemetry Upload] Final retry of ${finalBatch.length} samples also failed:`, finalError)
                } else {
                  const finalCount = finalData?.length || finalBatch.length
                  totalInserted += finalCount
                  console.log(`[Telemetry Upload] Final retry succeeded: inserted ${finalCount} samples`)
                }
              }
            }
          } else {
            const retryCount = retryData?.length || retryBatch.length
            totalInserted += retryCount
            console.log(`[Telemetry Upload] Retry chunk ${retryChunkNum} of batch ${batchNum} succeeded: inserted ${retryCount} samples`)
          }
        }
      } else {
        const insertedCount = insertedData?.length || batch.length
        totalInserted += insertedCount
        console.log(`[Telemetry Upload] Batch ${batchNum}/${totalBatches}: Successfully inserted ${insertedCount} samples (total: ${totalInserted}/${sampleRecords.length})`)
      }
    }

    console.log(`[Telemetry Upload] Final: Inserted ${totalInserted} out of ${sampleRecords.length} samples`)
    
    if (failedBatches.length > 0) {
      console.warn(`[Telemetry Upload] Warning: ${failedBatches.length} batches failed initially, but retried with smaller chunks`)
    }
    
    if (totalInserted < sampleRecords.length) {
      console.warn(`[Telemetry Upload] Warning: Only ${totalInserted} out of ${sampleRecords.length} samples were inserted`)
    }

    const response: TelemetryUploadResponse = {
      session_id: sessionId,
      samples_inserted: totalInserted,
      message: `Successfully uploaded ${totalInserted} samples`,
    }

    return NextResponse.json(response)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'upload error'
    console.error('Telemetry upload error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

