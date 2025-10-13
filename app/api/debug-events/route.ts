import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 1. multis 테이블에서 모든 이벤트 확인
    const { data: multisData, error: multisError } = await supabase
      .from('multis')
      .select('id, title, game, event_type, created_at')
      .order('created_at', { ascending: false })
    
    if (multisError) {
      return NextResponse.json({ error: multisError.message }, { status: 500 })
    }
    
    // 2. regular_event_schedules 테이블 확인
    const { data: schedulesData, error: schedulesError } = await supabase
      .from('regular_event_schedules')
      .select('id, regular_event_id, week_number, year, track, car_class')
      .order('created_at', { ascending: false })
    
    if (schedulesError) {
      return NextResponse.json({ error: schedulesError.message }, { status: 500 })
    }
    
    // 3. regular_event_vote_options 테이블 확인
    const { data: voteOptionsData, error: voteOptionsError } = await supabase
      .from('regular_event_vote_options')
      .select('id, regular_event_id, option_type, option_value')
      .order('created_at', { ascending: false })
    
    if (voteOptionsError) {
      return NextResponse.json({ error: voteOptionsError.message }, { status: 500 })
    }
    
    // 4. 이벤트 타입별 통계
    const eventTypeStats = multisData.reduce((acc, event) => {
      const type = event.event_type || 'null/undefined'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    return NextResponse.json({
      success: true,
      stats: {
        totalMultis: multisData.length,
        totalSchedules: schedulesData.length,
        totalVoteOptions: voteOptionsData.length,
        eventTypeStats
      },
      multis: multisData,
      schedules: schedulesData,
      voteOptions: voteOptionsData
    })
    
  } catch (error) {
    console.error('디버깅 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
