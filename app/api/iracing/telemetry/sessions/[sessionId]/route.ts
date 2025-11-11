import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'
import { TELEMETRY_ENABLED, TELEMETRY_DISABLED_MESSAGE } from '@/lib/featureFlags'

const limiter = new IpRateLimiter(10)

/**
 * GET /api/iracing/telemetry/sessions/[sessionId]
 * 특정 세션의 텔레메트리 샘플 데이터 조회
 * 
 * Query params:
 * - limit: 최대 샘플 수 (기본값 3600, 최대 10000)
 * - downsample: 다운샘플링 비율 (기본값 1, 1이면 모든 샘플)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
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

    const { sessionId } = await params
    const { searchParams } = new URL(req.url)
    // limit를 더 크게 설정 (최대 100000개까지 허용, 기본값은 전체 데이터)
    const requestedLimit = searchParams.get('limit')
    const limit = requestedLimit ? Math.min(parseInt(requestedLimit), 100000) : 100000
    const downsample = parseInt(searchParams.get('downsample') || '1')
    const includeAdvanced = searchParams.get('include_advanced') === 'true'  // 타이어/G-Force 차트용

    // 세션 소유권 확인
    const { data: session, error: sessionError } = await supabase
      .from('iracing_telemetry_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // 분리된 테이블에서 데이터 가져오기 (lap_controls/lap_vehicle_status 패턴)
    // 1. 먼저 각 테이블의 샘플 개수 확인 (controls 기준으로 개수 확인)
    const { count: totalCount, error: countError } = await supabase
      .from('iracing_telemetry_controls')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)

    console.log(`[Telemetry API] Session ${sessionId}: Found ${totalCount || 0} samples in controls table`)

    // 실제로 가져올 샘플 수 결정 (limit가 지정되지 않았으면 전체 데이터)
    const actualLimit = requestedLimit 
      ? Math.min(parseInt(requestedLimit), totalCount || 100000)
      : (totalCount || 100000)  // limit가 지정되지 않았으면 전체 데이터

    console.log(`[Telemetry API] Fetching samples: requestedLimit=${requestedLimit}, actualLimit=${actualLimit}, totalCount=${totalCount}`)

    // 2. 각 테이블에서 데이터 가져오기 (페이지네이션)
    const pageSize = 1000  // Supabase의 기본 limit (1000개)
    
    async function fetchTableData(tableName: string, limit: number) {
      let allData: any[] = []
      let offset = 0
      let hasMore = true
      let pageNum = 0
      
      while (hasMore && allData.length < limit) {
        pageNum++
        const remaining = limit - allData.length
        const currentPageSize = Math.min(pageSize, remaining)
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('session_id', sessionId)
          .order('elapsed_time', { ascending: true })
          .range(offset, offset + currentPageSize - 1)
        
        if (error) {
          console.error(`[Telemetry API] Failed to fetch ${tableName} page ${pageNum}:`, error)
          break
        }
        
        if (!data || data.length === 0) {
          hasMore = false
        } else {
          allData.push(...data)
          offset += currentPageSize
          hasMore = data.length === currentPageSize && allData.length < limit
        }
      }
      
      return allData
    }
    
    // 병렬로 데이터 가져오기 (controls, vehicle는 기본, advanced는 선택적)
    const fetchPromises = [
      fetchTableData('iracing_telemetry_controls', actualLimit),
      fetchTableData('iracing_telemetry_vehicle', actualLimit),
    ]
    
    if (includeAdvanced) {
      fetchPromises.push(fetchTableData('iracing_telemetry_advanced', actualLimit))
    }
    
    const results = await Promise.all(fetchPromises)
    const controlsData = results[0]
    const vehicleData = results[1]
    const advancedData = includeAdvanced ? results[2] : []
    
    console.log(`[Telemetry API] Fetched ${controlsData.length} controls, ${vehicleData.length} vehicle${includeAdvanced ? `, ${advancedData.length} advanced` : ''} samples`)
    
    // 3. elapsed_time 기준으로 병합
    const mergedMap = new Map<number, any>()
    
    // Controls 데이터 추가
    controlsData.forEach((item: any) => {
      const time = parseFloat(item.elapsed_time)
      mergedMap.set(time, {
        elapsed_time: time,
        throttle_position: item.throttle_position,
        brake_position: item.brake_position,
        steering_angle: item.steering_angle,
        clutch_position: item.clutch_position,
      })
    })
    
    // Vehicle 데이터 병합
    vehicleData.forEach((item: any) => {
      const time = parseFloat(item.elapsed_time)
      const existing = mergedMap.get(time) || { elapsed_time: time }
      mergedMap.set(time, {
        ...existing,
        speed_ms: item.speed_ms,
        speed_kmh: item.speed_kmh,
        rpm: item.rpm,
        gear: item.gear,
        engine_power: item.engine_power,
        engine_torque: item.engine_torque,
        position_x: item.position_x,
        position_y: item.position_y,
        position_z: item.position_z,
        latitude: item.latitude,
        longitude: item.longitude,
        heading: item.heading,
        distance_lap: item.distance_lap,
      })
    })
    
    // Advanced 데이터 병합 (타이어/G-Force 등)
    if (includeAdvanced && advancedData.length > 0) {
      advancedData.forEach((item: any) => {
        const time = parseFloat(item.elapsed_time)
        const existing = mergedMap.get(time) || { elapsed_time: time }
        mergedMap.set(time, {
          ...existing,
          // 타이어 데이터
          tire_temp_fl: item.tire_temp_fl,
          tire_temp_fr: item.tire_temp_fr,
          tire_temp_rl: item.tire_temp_rl,
          tire_temp_rr: item.tire_temp_rr,
          tire_pressure_fl: item.tire_pressure_fl,
          tire_pressure_fr: item.tire_pressure_fr,
          tire_pressure_rl: item.tire_pressure_rl,
          tire_pressure_rr: item.tire_pressure_rr,
          tire_wear_fl: item.tire_wear_fl,
          tire_wear_fr: item.tire_wear_fr,
          tire_wear_rl: item.tire_wear_rl,
          tire_wear_rr: item.tire_wear_rr,
          // 동역학 데이터
          g_force_lateral: item.g_force_lateral,
          g_force_longitudinal: item.g_force_longitudinal,
          g_force_vertical: item.g_force_vertical,
          wheel_slip_fl: item.wheel_slip_fl,
          wheel_slip_fr: item.wheel_slip_fr,
          wheel_slip_rl: item.wheel_slip_rl,
          wheel_slip_rr: item.wheel_slip_rr,
          // 서스펜션
          suspension_travel_fl: item.suspension_travel_fl,
          suspension_travel_fr: item.suspension_travel_fr,
          suspension_travel_rl: item.suspension_travel_rl,
          suspension_travel_rr: item.suspension_travel_rr,
          ride_height_fl: item.ride_height_fl,
          ride_height_fr: item.ride_height_fr,
          ride_height_rl: item.ride_height_rl,
          ride_height_rr: item.ride_height_rr,
          // 브레이크/ABS
          brake_temperature_fl: item.brake_temperature_fl,
          brake_temperature_fr: item.brake_temperature_fr,
          brake_temperature_rl: item.brake_temperature_rl,
          brake_temperature_rr: item.brake_temperature_rr,
          abs_active: item.abs_active,
          traction_control_active: item.traction_control_active,
          // 메타데이터
          lap_number: item.lap_number,
          sector_number: item.sector_number,
          fuel_level: item.fuel_level,
          fuel_pressure: item.fuel_pressure,
        })
      })
    }
    
    // Map을 배열로 변환하고 시간순 정렬
    let allSamples = Array.from(mergedMap.values()).sort((a, b) => a.elapsed_time - b.elapsed_time)
    
    console.log(`[Telemetry API] Merged ${allSamples.length} samples (controls: ${controlsData.length}, vehicle: ${vehicleData.length})`)
    
    // 시간 범위 확인
    if (allSamples.length > 0) {
      const times = allSamples.map(s => s.elapsed_time || 0).filter(t => t != null)
      const minTime = Math.min(...times)
      const maxTime = Math.max(...times)
      console.log(`[Telemetry API] Time range: ${minTime.toFixed(3)}s to ${maxTime.toFixed(3)}s`)
    }

    // 다운샘플링 적용 (서버에서 필터링)
    const samples = downsample > 1 && allSamples && allSamples.length > 0
      ? allSamples.filter((_, index) => index % downsample === 0)
      : allSamples || []

    return NextResponse.json({
      session,
      samples,
      count: samples.length,
      total_count: totalCount || 0,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'fetch error'
    console.error('Telemetry session fetch error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/**
 * DELETE /api/iracing/telemetry/sessions/[sessionId]
 * 텔레메트리 세션 삭제 (CASCADE로 관련 데이터 자동 삭제)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
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

    const { sessionId } = await params

    // 세션 소유권 확인
    const { data: session, error: sessionError } = await supabase
      .from('iracing_telemetry_sessions')
      .select('id, session_name, track_name, car_name')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // 세션 삭제 (CASCADE로 관련 데이터 자동 삭제)
    // - iracing_telemetry_controls
    // - iracing_telemetry_vehicle
    // - iracing_telemetry_advanced
    // - iracing_telemetry_samples (기존 테이블이 있다면)
    const { error: deleteError } = await supabase
      .from('iracing_telemetry_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Failed to delete session:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
      deleted_session: {
        id: sessionId,
        session_name: session.session_name,
        track_name: session.track_name,
        car_name: session.car_name,
      },
    })
  } catch (error) {
    console.error('Failed to delete session:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete session' },
      { status: 500 }
    )
  }
}

