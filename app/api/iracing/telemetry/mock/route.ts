import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { TelemetryUploadRequest } from '@/lib/iracingTypes'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'
import { TELEMETRY_ENABLED, TELEMETRY_DISABLED_MESSAGE } from '@/lib/featureFlags'
import crypto from 'crypto'

const limiter = new IpRateLimiter(5) // mock 데이터 생성은 더 낮은 rate limit

/**
 * POST /api/iracing/telemetry/mock
 * 텔레메트리 Mock 데이터를 생성하여 DB에 저장
 * 
 * Query params:
 * - duration: 세션 지속 시간 (초, 기본값 60)
 * - sample_rate: 샘플링 주파수 (Hz, 기본값 60)
 * - track_id: 트랙 ID (선택)
 * - track_name: 트랙 이름 (선택)
 * - car_id: 차량 ID (선택)
 * - car_name: 차량 이름 (선택)
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

    const { searchParams } = new URL(req.url)
    const duration = parseFloat(searchParams.get('duration') || '60') // 초
    const sampleRate = parseInt(searchParams.get('sample_rate') || '60') // Hz
    const trackId = searchParams.get('track_id')
    const trackName = searchParams.get('track_name') || 'Watkins Glen International'
    const carId = searchParams.get('car_id')
    const carName = searchParams.get('car_name') || 'Ferrari 488 GT3'

    // Mock 텔레메트리 샘플 생성
    const samples = generateMockTelemetrySamples(duration, sampleRate)

    // 세션 시간 계산
    const startTime = new Date()
    const endTime = new Date(startTime.getTime() + duration * 1000)

    // 업로드 요청 형식으로 변환
    const uploadRequest: TelemetryUploadRequest = {
      session: {
        user_id: user.id,
        session_name: `Mock Telemetry Session - ${new Date().toISOString()}`,
        track_id: trackId ? parseInt(trackId) : undefined,
        track_name: trackName,
        car_id: carId ? parseInt(carId) : undefined,
        car_name: carName,
        session_type: 'practice',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_seconds: duration,
        sample_count: samples.length,
        sample_rate_hz: sampleRate,
      },
      samples,
    }

    // 직접 DB에 저장 (업로드 API 로직 재사용)
    // 데이터 해시 생성 (중복 검사) - start_time을 제외하여 Mock 데이터는 항상 새로 생성 가능하도록
    const dataString = JSON.stringify({
      user_id: user.id,
      track_id: uploadRequest.session.track_id,
      car_id: uploadRequest.session.car_id,
      duration: duration,
      sample_rate: sampleRate,
      samples: samples.slice(0, 10).map(s => ({
        elapsed_time: s.elapsed_time,
        throttle: s.throttle_position,
        brake: s.brake_position,
        speed: s.speed_kmh,
      })),
    })
    const dataHash = crypto.createHash('sha256').update(dataString).digest('hex')

    // 중복 검사 (선택적 - Mock 데이터는 항상 새로 생성 가능하도록 주석 처리)
    // const { data: existing } = await supabase
    //   .from('iracing_telemetry_sessions')
    //   .select('id')
    //   .eq('data_hash', dataHash)
    //   .eq('user_id', user.id)
    //   .single()

    // if (existing) {
    //   return NextResponse.json({
    //     message: 'Mock data already exists',
    //     session_id: existing.id,
    //     samples_inserted: 0,
    //     duration_seconds: duration,
    //     sample_rate_hz: sampleRate,
    //   })
    // }

    // 세션 메타데이터 저장
    const { data: sessionData, error: sessionError } = await supabase
      .from('iracing_telemetry_sessions')
      .insert({
        user_id: user.id,
        session_name: uploadRequest.session.session_name || null,
        track_id: uploadRequest.session.track_id || null,
        track_name: uploadRequest.session.track_name || null,
        car_id: uploadRequest.session.car_id || null,
        car_name: uploadRequest.session.car_name || null,
        session_type: uploadRequest.session.session_type || null,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_seconds: duration,
        sample_count: samples.length,
        sample_rate_hz: sampleRate,
        data_hash: dataHash,
        is_complete: true,
        notes: uploadRequest.session.notes || null,
      })
      .select('id')
      .single()

    if (sessionError) {
      console.error('Failed to insert session:', sessionError)
      throw sessionError
    }

    const sessionId = sessionData.id

    // 샘플 데이터 준비 및 배치 삽입
    console.log(`[Mock API] Preparing ${samples.length} samples for insertion...`)
    const sampleRecords = samples.map((sample) => ({
      session_id: sessionId,
      elapsed_time: Number(sample.elapsed_time?.toFixed(3) || 0),
      throttle_position: sample.throttle_position != null ? Number(sample.throttle_position) : null,
      brake_position: sample.brake_position != null ? Number(sample.brake_position) : null,
      steering_angle: sample.steering_angle != null ? Number(sample.steering_angle) : null,
      clutch_position: sample.clutch_position != null ? Number(sample.clutch_position) : null,
      speed_ms: sample.speed_ms != null ? Number(sample.speed_ms) : null,
      speed_kmh: sample.speed_kmh != null ? Number(sample.speed_kmh) : null,
      rpm: sample.rpm != null ? Math.floor(Number(sample.rpm)) : null, // INTEGER 타입
      gear: sample.gear != null ? Math.floor(Number(sample.gear)) : null, // INTEGER 타입
      engine_power: sample.engine_power ?? null,
      engine_torque: sample.engine_torque ?? null,
      position_x: sample.position_x != null ? Number(sample.position_x) : null,
      position_y: sample.position_y != null ? Number(sample.position_y) : null,
      position_z: sample.position_z != null ? Number(sample.position_z) : null,
      latitude: sample.latitude != null ? Number(sample.latitude) : null,
      longitude: sample.longitude != null ? Number(sample.longitude) : null,
      heading: sample.heading != null ? Number(sample.heading) : null,
      distance_lap: sample.distance_lap != null ? Number(sample.distance_lap) : null,
      tire_temp_fl: sample.tire_temp_fl != null ? Number(sample.tire_temp_fl) : null,
      tire_temp_fr: sample.tire_temp_fr != null ? Number(sample.tire_temp_fr) : null,
      tire_temp_rl: sample.tire_temp_rl != null ? Number(sample.tire_temp_rl) : null,
      tire_temp_rr: sample.tire_temp_rr != null ? Number(sample.tire_temp_rr) : null,
      tire_pressure_fl: sample.tire_pressure_fl != null ? Number(sample.tire_pressure_fl) : null,
      tire_pressure_fr: sample.tire_pressure_fr != null ? Number(sample.tire_pressure_fr) : null,
      tire_pressure_rl: sample.tire_pressure_rl != null ? Number(sample.tire_pressure_rl) : null,
      tire_pressure_rr: sample.tire_pressure_rr != null ? Number(sample.tire_pressure_rr) : null,
      tire_wear_fl: sample.tire_wear_fl != null ? Number(sample.tire_wear_fl) : null,
      tire_wear_fr: sample.tire_wear_fr != null ? Number(sample.tire_wear_fr) : null,
      tire_wear_rl: sample.tire_wear_rl != null ? Number(sample.tire_wear_rl) : null,
      tire_wear_rr: sample.tire_wear_rr != null ? Number(sample.tire_wear_rr) : null,
      suspension_travel_fl: sample.suspension_travel_fl != null ? Number(sample.suspension_travel_fl) : null,
      suspension_travel_fr: sample.suspension_travel_fr != null ? Number(sample.suspension_travel_fr) : null,
      suspension_travel_rl: sample.suspension_travel_rl != null ? Number(sample.suspension_travel_rl) : null,
      suspension_travel_rr: sample.suspension_travel_rr != null ? Number(sample.suspension_travel_rr) : null,
      ride_height_fl: sample.ride_height_fl != null ? Number(sample.ride_height_fl) : null,
      ride_height_fr: sample.ride_height_fr != null ? Number(sample.ride_height_fr) : null,
      ride_height_rl: sample.ride_height_rl != null ? Number(sample.ride_height_rl) : null,
      ride_height_rr: sample.ride_height_rr != null ? Number(sample.ride_height_rr) : null,
      g_force_lateral: sample.g_force_lateral != null ? Number(sample.g_force_lateral) : null,
      g_force_longitudinal: sample.g_force_longitudinal != null ? Number(sample.g_force_longitudinal) : null,
      g_force_vertical: sample.g_force_vertical != null ? Number(sample.g_force_vertical) : null,
      wheel_slip_fl: sample.wheel_slip_fl != null ? Number(sample.wheel_slip_fl) : null,
      wheel_slip_fr: sample.wheel_slip_fr != null ? Number(sample.wheel_slip_fr) : null,
      wheel_slip_rl: sample.wheel_slip_rl != null ? Number(sample.wheel_slip_rl) : null,
      wheel_slip_rr: sample.wheel_slip_rr != null ? Number(sample.wheel_slip_rr) : null,
      brake_temperature_fl: sample.brake_temperature_fl != null ? Number(sample.brake_temperature_fl) : null,
      brake_temperature_fr: sample.brake_temperature_fr != null ? Number(sample.brake_temperature_fr) : null,
      brake_temperature_rl: sample.brake_temperature_rl != null ? Number(sample.brake_temperature_rl) : null,
      brake_temperature_rr: sample.brake_temperature_rr != null ? Number(sample.brake_temperature_rr) : null,
      abs_active: sample.abs_active ?? null,
      traction_control_active: sample.traction_control_active ?? null,
      lap_number: sample.lap_number != null ? Math.floor(Number(sample.lap_number)) : null, // INTEGER 타입
      sector_number: sample.sector_number != null ? Math.floor(Number(sample.sector_number)) : null, // INTEGER 타입
      fuel_level: sample.fuel_level != null ? Number(sample.fuel_level) : null,
      fuel_pressure: sample.fuel_pressure != null ? Number(sample.fuel_pressure) : null,
    }))

    // 배치로 삽입 (1000개씩)
    const batchSize = 1000
    let totalInserted = 0
    const totalBatches = Math.ceil(sampleRecords.length / batchSize)

    console.log(`[Mock API] Starting to insert ${sampleRecords.length} samples in ${totalBatches} batches`)

    for (let i = 0; i < sampleRecords.length; i += batchSize) {
      const batch = sampleRecords.slice(i, i + batchSize)
      const batchNum = Math.floor(i / batchSize) + 1
      
      const { error: samplesError } = await supabase
        .from('iracing_telemetry_samples')
        .insert(batch)

      if (samplesError) {
        console.error(`[Mock API] Failed to insert samples batch ${batchNum}/${totalBatches}:`, samplesError)
        console.error(`[Mock API] Error details:`, JSON.stringify(samplesError, null, 2))
        // 첫 번째 배치에서 에러가 발생하면 전체 실패로 처리
        if (batchNum === 1) {
          throw new Error(`Failed to insert samples: ${samplesError.message || 'Unknown error'}`)
        }
        // 나머지 배치에서 에러가 발생하면 경고만 출력하고 계속 진행
        console.warn(`[Mock API] Continuing after batch ${batchNum} error...`)
      } else {
        totalInserted += batch.length
        console.log(`[Mock API] Batch ${batchNum}/${totalBatches} inserted: ${batch.length} samples (total: ${totalInserted})`)
      }
    }

    // 실제 삽입된 개수 확인
    const { count: actualCount } = await supabase
      .from('iracing_telemetry_samples')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    console.log(`[Mock API] Insertion complete. Expected: ${sampleRecords.length}, Inserted: ${totalInserted}, Actual in DB: ${actualCount || 0}`)

    // 샘플이 하나도 삽입되지 않았으면 에러 반환
    if (totalInserted === 0 && actualCount === 0) {
      return NextResponse.json({
        error: 'Failed to insert any samples. Please check database schema and console logs.',
        session_id: sessionId,
        samples_inserted: 0,
        samples_expected: sampleRecords.length,
        samples_actual: 0,
        duration_seconds: duration,
        sample_rate_hz: sampleRate,
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Mock telemetry data generated successfully',
      session_id: sessionId,
      samples_inserted: totalInserted,
      samples_expected: sampleRecords.length,
      samples_actual: actualCount || 0,
      duration_seconds: duration,
      sample_rate_hz: sampleRate,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'mock generation error'
    console.error('Mock telemetry generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * Mock 텔레메트리 샘플 생성
 * 실제 레이싱 시나리오를 시뮬레이션 (가속, 코너링, 브레이킹 등)
 */
function generateMockTelemetrySamples(duration: number, sampleRate: number) {
  const samples: any[] = []
  const totalSamples = Math.floor(duration * sampleRate)
  const dt = 1.0 / sampleRate // 샘플 간격 (초)

  // 레이싱 시나리오 시뮬레이션
  // 0-20초: 가속 (직선)
  // 20-30초: 브레이킹 + 코너 진입
  // 30-40초: 코너링
  // 40-50초: 코너 탈출 + 가속
  // 50-60초: 직선 가속

  for (let i = 0; i < totalSamples; i++) {
    const elapsedTime = i * dt
    const progress = elapsedTime / duration // 0.0 ~ 1.0
    const phase = Math.floor(progress * 5) % 5 // 0-4 단계

    let throttle = 0
    let brake = 0
    let steering = 0
    let speed = 0
    let rpm = 0
    let gear = 1
    let tireTempFL = 80
    let tireTempFR = 80
    let tireTempRL = 80
    let tireTempRR = 80
    let gForceLateral = 0
    let gForceLongitudinal = 0

    // 시나리오별 값 설정
    switch (phase) {
      case 0: // 가속 (0-20초)
        throttle = 0.8 + Math.random() * 0.2
        brake = 0
        steering = (Math.random() - 0.5) * 0.1 // 작은 스티어링 노이즈
        speed = Math.min(180, 50 + progress * 130) // 50-180 km/h
        rpm = Math.floor(4000 + Math.random() * 2000) // INTEGER
        gear = speed > 100 ? 3 : (speed > 60 ? 2 : 1) // INTEGER
        tireTempFL = 85 + Math.random() * 5
        tireTempFR = 85 + Math.random() * 5
        tireTempRL = 80 + Math.random() * 5
        tireTempRR = 80 + Math.random() * 5
        gForceLongitudinal = 0.3 + Math.random() * 0.2
        gForceLateral = (Math.random() - 0.5) * 0.1
        break

      case 1: // 브레이킹 + 코너 진입 (20-30초)
        throttle = 0
        brake = 0.7 + Math.random() * 0.3
        steering = -0.5 + Math.random() * 0.3 // 좌회전
        speed = Math.max(80, 180 - (progress % 0.2) * 500) // 감속
        rpm = Math.floor(2500 + Math.random() * 1000) // INTEGER
        gear = speed > 120 ? 3 : (speed > 80 ? 2 : 1) // INTEGER
        tireTempFL = 95 + Math.random() * 10 // 브레이킹으로 온도 상승
        tireTempFR = 95 + Math.random() * 10
        tireTempRL = 90 + Math.random() * 10
        tireTempRR = 90 + Math.random() * 10
        gForceLongitudinal = -0.6 - Math.random() * 0.3 // 감속 G
        gForceLateral = -0.3 - Math.random() * 0.2 // 좌회전 G
        break

      case 2: // 코너링 (30-40초)
        throttle = 0.3 + Math.random() * 0.3
        brake = 0.1 + Math.random() * 0.2
        steering = -0.8 + Math.random() * 0.4 // 좌회전 유지
        speed = 75 + Math.random() * 15 // 75-90 km/h
        rpm = Math.floor(3000 + Math.random() * 1500) // INTEGER
        gear = 2 // INTEGER
        tireTempFL = 100 + Math.random() * 15 // 코너링으로 온도 상승
        tireTempFR = 95 + Math.random() * 10
        tireTempRL = 95 + Math.random() * 10
        tireTempRR = 100 + Math.random() * 15
        gForceLongitudinal = 0.1 + Math.random() * 0.2
        gForceLateral = -0.8 - Math.random() * 0.3 // 강한 좌회전 G
        break

      case 3: // 코너 탈출 + 가속 (40-50초)
        throttle = 0.9 + Math.random() * 0.1
        brake = 0
        steering = -0.3 + Math.random() * 0.6 // 스티어링 복귀
        speed = Math.min(160, 85 + (progress % 0.2) * 375) // 가속
        rpm = Math.floor(4500 + Math.random() * 2000) // INTEGER
        gear = speed > 100 ? 3 : 2 // INTEGER
        tireTempFL = 90 + Math.random() * 10
        tireTempFR = 90 + Math.random() * 10
        tireTempRL = 85 + Math.random() * 10
        tireTempRR = 85 + Math.random() * 10
        gForceLongitudinal = 0.4 + Math.random() * 0.3
        gForceLateral = -0.2 + Math.random() * 0.4
        break

      case 4: // 직선 가속 (50-60초)
        throttle = 0.95 + Math.random() * 0.05
        brake = 0
        steering = (Math.random() - 0.5) * 0.1
        speed = Math.min(200, 150 + (progress % 0.2) * 250)
        rpm = Math.floor(5000 + Math.random() * 2000) // INTEGER
        gear = speed > 140 ? 4 : 3 // INTEGER
        tireTempFL = 85 + Math.random() * 5
        tireTempFR = 85 + Math.random() * 5
        tireTempRL = 82 + Math.random() * 5
        tireTempRR = 82 + Math.random() * 5
        gForceLongitudinal = 0.2 + Math.random() * 0.2
        gForceLateral = (Math.random() - 0.5) * 0.1
        break
    }

    // GPS 위치 시뮬레이션 (간단한 원형 트랙)
    const angle = (elapsedTime * 0.1) % (Math.PI * 2)
    const radius = 500 // 트랙 반경 (미터)
    const positionX = Math.cos(angle) * radius
    const positionY = Math.sin(angle) * radius
    const heading = (angle + Math.PI / 2) * (180 / Math.PI) // 도 단위

    samples.push({
      elapsed_time: elapsedTime,
      throttle_position: throttle,
      brake_position: brake,
      steering_angle: steering,
      speed_ms: speed / 3.6, // km/h → m/s
      speed_kmh: speed,
      rpm: rpm,
      gear: gear,
      position_x: positionX,
      position_y: positionY,
      position_z: 0,
      heading: heading,
      distance_lap: elapsedTime * (speed / 3.6), // 대략적인 거리
      tire_temp_fl: tireTempFL,
      tire_temp_fr: tireTempFR,
      tire_temp_rl: tireTempRL,
      tire_temp_rr: tireTempRR,
      tire_pressure_fl: 220 + Math.random() * 10,
      tire_pressure_fr: 220 + Math.random() * 10,
      tire_pressure_rl: 210 + Math.random() * 10,
      tire_pressure_rr: 210 + Math.random() * 10,
      g_force_lateral: gForceLateral,
      g_force_longitudinal: gForceLongitudinal,
      g_force_vertical: -1.0 + Math.random() * 0.2,
      lap_number: Math.floor(elapsedTime / 60) + 1,
      sector_number: Math.floor((elapsedTime % 60) / 20) + 1,
      fuel_level: 50 - (elapsedTime / 60) * 2, // 연료 감소
    })
  }

  return samples
}

