import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ game: string }> }
) {
  try {
    const { game } = await params
    const supabase = createRouteHandlerClient({ cookies })

    // URL 디코딩
    const gameName = decodeURIComponent(game)

    // 해당 게임의 트랙 히스토리 조회
    const { data: trackHistory, error } = await supabase
      .from('regular_multi_track_history')
      .select(`
        *,
        multis!inner(
          id,
          title,
          game,
          multi_day
        )
      `)
      .eq('game_name', gameName)
      .order('year DESC, week_number DESC')
      .limit(50) // 최근 50개 기록

    if (error) {
      console.error('트랙 히스토리 조회 실패:', error)
      
      // 테이블이 존재하지 않는 경우 빈 데이터 반환
      if (error.code === 'PGRST116' || error.message.includes('relation "regular_multi_track_history" does not exist')) {
        return NextResponse.json({
          trackHistory: [],
          recommendations: [],
          summary: {
            totalTracks: 0,
            totalPlays: 0,
            mostPlayedTrack: null
          }
        })
      }
      
      throw error
    }

    // 트랙별 마지막 진행일 계산
    const trackLastPlayed = new Map()
    const trackPlayCount = new Map()
    const trackDetails = new Map()
    
    trackHistory?.forEach(record => {
      const track = record.standardized_track_name
      const date = `${record.year}-W${record.week_number}`
      
      if (!trackLastPlayed.has(track) || trackLastPlayed.get(track) < date) {
        trackLastPlayed.set(track, date)
      }
      
      trackPlayCount.set(track, (trackPlayCount.get(track) || 0) + 1)
      
      // 트랙별 상세 정보 저장
      if (!trackDetails.has(track)) {
        trackDetails.set(track, {
          carClass: record.selected_car_class,
          game: record.multis.game,
          dayOfWeek: record.multis.multi_day
        })
      }
    })

    // 추천 트랙 로직
    const recommendations = Array.from(trackLastPlayed.entries())
      .map(([track, lastPlayed]) => {
        const playCount = trackPlayCount.get(track) || 0
        const weeksSinceLastPlay = getWeeksSinceLastPlay(lastPlayed)
        const details = trackDetails.get(track)
        
        return {
          track,
          carClass: details?.carClass || '',
          game: details?.game || '',
          dayOfWeek: details?.dayOfWeek || [],
          lastPlayed,
          playCount,
          weeksSinceLastPlay,
          recommendation: getRecommendation(weeksSinceLastPlay, playCount)
        }
      })
      .sort((a, b) => b.weeksSinceLastPlay - a.weeksSinceLastPlay)

    // 가장 많이 플레이된 트랙
    const mostPlayedTrack = Array.from(trackPlayCount.entries())
      .sort((a, b) => b[1] - a[1])[0]

    return NextResponse.json({
      gameName,
      trackHistory: trackHistory || [],
      recommendations: recommendations.slice(0, 10), // 상위 10개
      summary: {
        totalTracks: trackLastPlayed.size,
        totalPlays: trackHistory?.length || 0,
        mostPlayedTrack: mostPlayedTrack ? {
          track: mostPlayedTrack[0],
          count: mostPlayedTrack[1]
        } : null
      }
    })

  } catch (error) {
    console.error('트랙 히스토리 API 오류:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

function getWeeksSinceLastPlay(lastPlayed: string): number {
  const [year, week] = lastPlayed.split('-W').map(Number)
  
  // ISO 주차를 날짜로 변환
  const jan4 = new Date(year, 0, 4) // 1월 4일
  const jan4Day = jan4.getDay() || 7 // 월요일 = 1, 일요일 = 7
  const firstMonday = new Date(jan4.getTime() - (jan4Day - 1) * 24 * 60 * 60 * 1000)
  const lastPlayDate = new Date(firstMonday.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)
  
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - lastPlayDate.getTime())
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
  
  return diffWeeks
}

function getRecommendation(weeksSinceLastPlay: number, playCount: number): string {
  if (weeksSinceLastPlay >= 4) return '오랫만에 해볼 만한 트랙'
  if (weeksSinceLastPlay >= 2) return '적당한 간격의 트랙'
  if (playCount >= 3) return '인기 트랙'
  return '밸런스 추천'
}
