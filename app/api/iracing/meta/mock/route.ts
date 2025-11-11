import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { IpRateLimiter, getClientIp } from '@/lib/rateLimit'

const limiter = new IpRateLimiter(5) // mock 데이터 생성은 더 낮은 rate limit

interface MockCar {
  car_id: number
  car_name: string
  winRate: number // 0-100
  pickRate: number // 0-100
  avgLapTime: number // seconds
}

interface MockSeries {
  series_id: number
  series_name: string
  tracks: Array<{
    track_id: number
    track_name: string
  }>
  cars: MockCar[]
}

/**
 * POST /api/iracing/meta/mock
 * Mock 데이터를 생성하여 DB에 저장
 * 
 * Query params:
 * - count: 생성할 세션 수 (기본값 10)
 * - series_id: 특정 시리즈만 생성 (선택)
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

    const { searchParams } = new URL(req.url)
    const count = parseInt(searchParams.get('count') || '10')
    const seriesIdParam = searchParams.get('series_id')

    // Mock 시리즈 데이터 정의
    const mockSeries: MockSeries[] = [
      {
        series_id: 123,
        series_name: 'GT3 Challenge',
        tracks: [
          { track_id: 1, track_name: 'Watkins Glen International' },
          { track_id: 2, track_name: 'Silverstone Grand Prix' },
          { track_id: 3, track_name: 'Nürburgring Grand Prix' },
        ],
        cars: [
          { car_id: 101, car_name: 'Ferrari 488 GT3', winRate: 35, pickRate: 30, avgLapTime: 125.5 },
          { car_id: 102, car_name: 'Mercedes-AMG GT3', winRate: 28, pickRate: 25, avgLapTime: 126.2 },
          { car_id: 103, car_name: 'BMW M4 GT3', winRate: 20, pickRate: 20, avgLapTime: 127.1 },
          { car_id: 104, car_name: 'Audi R8 LMS GT3', winRate: 17, pickRate: 15, avgLapTime: 128.3 },
          { car_id: 105, car_name: 'McLaren 720S GT3', winRate: 0, pickRate: 10, avgLapTime: 129.5 },
        ],
      },
      {
        series_id: 456,
        series_name: 'Formula 3 Championship',
        tracks: [
          { track_id: 10, track_name: 'Spa-Francorchamps' },
          { track_id: 11, track_name: 'Monza' },
        ],
        cars: [
          { car_id: 201, car_name: 'F3 Dallara', winRate: 40, pickRate: 50, avgLapTime: 145.8 },
          { car_id: 202, car_name: 'F3 Tatuus', winRate: 30, pickRate: 30, avgLapTime: 147.2 },
          { car_id: 203, car_name: 'F3 Mygale', winRate: 30, pickRate: 20, avgLapTime: 148.1 },
        ],
      },
    ]

    const targetSeries = seriesIdParam
      ? mockSeries.filter(s => s.series_id === parseInt(seriesIdParam))
      : mockSeries

    if (targetSeries.length === 0) {
      return NextResponse.json({ error: 'Series not found' }, { status: 400 })
    }

    let totalCollected = 0
    // INTEGER 범위 내의 mock subsession_id 생성 (1,000,000,000 ~ 2,100,000,000)
    // 실제 iRacing subsession_id는 큰 숫자일 수 있지만, mock 데이터는 작은 범위 사용
    // PostgreSQL INTEGER 최대값: 2,147,483,647
    const baseSubsessionId = 1000000000 + Math.floor((Date.now() / 1000) % 1000000000) // 초 단위로 나누어 범위 축소

    for (const series of targetSeries) {
      for (let i = 0; i < Math.ceil(count / targetSeries.length); i++) {
        const track = series.tracks[i % series.tracks.length]
        // 각 세션마다 1000씩 증가 (INTEGER 범위 내, 최대 2,147,483,647)
        const subsessionId = baseSubsessionId + totalCollected * 1000
        
        // INTEGER 범위 초과 방지
        if (subsessionId > 2147483647) {
          console.warn(`Subsession ID ${subsessionId} exceeds INTEGER range, skipping`)
          continue
        }
        
        // 이미 존재하는지 확인
        const { data: existing } = await supabase
          .from('iracing_subsession_results')
          .select('subsession_id')
          .eq('subsession_id', subsessionId)
          .single()

        if (existing) {
          continue
        }

        // 세션 생성 시간 (최근 N일 내 랜덤)
        const daysAgo = Math.floor(Math.random() * 7)
        const startTime = new Date()
        startTime.setDate(startTime.getDate() - daysAgo)
        startTime.setHours(Math.floor(Math.random() * 24))

        // 세션 메타데이터 저장
        const { error: sessionError } = await supabase
          .from('iracing_subsession_results')
          .insert({
            subsession_id: subsessionId,
            series_id: series.series_id,
            season_id: 2024,
            session_name: `${series.series_name} - Race`,
            start_time: startTime.toISOString(),
            track_id: track.track_id,
            track_name: track.track_name,
          })

        if (sessionError) {
          console.error('Failed to insert subsession:', sessionError)
          continue
        }

        // 참여자 데이터 생성 (각 차량별로 다양한 수의 참여자)
        const participantRecords: any[] = []
        let totalParticipants = 0

        series.cars.forEach((car) => {
          // 각 차량의 참여자 수 결정 (픽률 기반)
          const participantsForCar = Math.floor(Math.random() * 10) + Math.floor(car.pickRate / 10)
          
          for (let j = 0; j < participantsForCar; j++) {
            const custId = Math.floor(Math.random() * 100000) + 100000
            const iRating = Math.floor(Math.random() * 2000) + 1500 // 1500-3500
            const finishPosition = Math.floor(Math.random() * 20) + 1
            
            // 승률에 따라 우승 확률 조정
            const isWinner = finishPosition === 1 && Math.random() * 100 < car.winRate
            
            // 랩타임은 차량 평균 + iRating 보정 + 랜덤 노이즈
            const iratingAdjustment = (3500 - iRating) / 1000 // 높은 iRating일수록 빠름
            const lapTimeNoise = (Math.random() - 0.5) * 3
            const bestLapTime = car.avgLapTime - iratingAdjustment * 2 + lapTimeNoise

            participantRecords.push({
              subsession_id: subsessionId,
              cust_id: custId + j,
              display_name: `Driver_${custId + j}`,
              finish_position: isWinner ? 1 : finishPosition,
              starting_position: Math.floor(Math.random() * 20) + 1,
              i_rating: iRating,
              best_lap_time: Math.max(100, bestLapTime), // 최소 100초
              laps_complete: Math.floor(Math.random() * 5) + 20,
              car_id: car.car_id,
              car_name: car.car_name,
            })
          }
          totalParticipants += participantsForCar
        })

        // finish_position을 정렬하여 재할당 (중복 제거)
        participantRecords.sort((a, b) => {
          // 우승자는 우선, 나머지는 랜덤
          if (a.finish_position === 1) return -1
          if (b.finish_position === 1) return 1
          return a.finish_position - b.finish_position
        })

        // finish_position 재할당 (1부터 순서대로)
        participantRecords.forEach((p, idx) => {
          p.finish_position = idx + 1
        })

        // 배치로 저장
        const batchSize = 1000
        for (let i = 0; i < participantRecords.length; i += batchSize) {
          const batch = participantRecords.slice(i, i + batchSize)
          const { error: participantError } = await supabase
            .from('iracing_participant_results')
            .insert(batch)

          if (participantError) {
            console.error('Failed to insert participants:', participantError)
            continue
          }
        }

        totalCollected++
      }
    }

    return NextResponse.json({
      message: 'Mock data generated successfully',
      collected: totalCollected,
      series: targetSeries.map(s => ({ id: s.series_id, name: s.series_name })),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'mock generation error'
    console.error('Mock data generation error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
