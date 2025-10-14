import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(req.url)
    const gameName = searchParams.get('game')

    if (!gameName) {
      return NextResponse.json({ error: '게임 이름이 필요합니다.' }, { status: 400 })
    }

    console.log('트랙 히스토리 조회 시작:', { gameName })

    // 정기 멀티 트랙 히스토리 조회
    const { data: trackHistory, error } = await supabase
      .from('regular_multi_track_history')
      .select(`
        standardized_track_name,
        selected_car_class,
        week_number,
        year,
        created_at
      `)
      .eq('game_name', gameName)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('트랙 히스토리 조회 실패:', error)
      return NextResponse.json({ error: '트랙 히스토리를 불러올 수 없습니다.' }, { status: 500 })
    }

    console.log('트랙 히스토리 조회 성공:', { count: trackHistory?.length || 0 })

    // 트랙별 마지막 사용 정보 계산
    const trackLastUsed = new Map<string, { week: number; year: number; carClass: string }>()
    
    trackHistory?.forEach(history => {
      const trackName = history.standardized_track_name
      if (!trackLastUsed.has(trackName)) {
        trackLastUsed.set(trackName, {
          week: history.week_number,
          year: history.year,
          carClass: history.selected_car_class
        })
      }
    })

    // 결과 변환
    const result = Array.from(trackLastUsed.entries()).map(([trackName, info]) => ({
      trackName,
      lastUsed: {
        week: info.week,
        year: info.year,
        carClass: info.carClass
      }
    }))

    console.log('트랙 히스토리 처리 완료:', { trackCount: result.length })

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('트랙 히스토리 API 에러:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
