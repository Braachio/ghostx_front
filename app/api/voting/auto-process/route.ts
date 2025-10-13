import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabaseServerClient'

export async function POST() {
  try {
    const supabase = createClient()
    
    // 자동 투표 스케줄 처리 함수 호출
    const { data, error } = await supabase.rpc('process_voting_schedules')
    
    if (error) {
      console.error('자동 투표 처리 실패:', error)
      return NextResponse.json({ 
        error: '자동 투표 처리에 실패했습니다.',
        details: error.message 
      }, { status: 500 })
    }
    
    const result = data[0] // 함수 결과는 배열로 반환됨
    
    return NextResponse.json({
      success: true,
      message: '자동 투표 처리가 완료되었습니다.',
      processed: {
        total: result.processed_count || 0,
        opened: result.opened_count || 0,
        closed: result.closed_count || 0,
        appliedResults: result.applied_results || 0
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('자동 투표 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    
    // 현재 투표 스케줄 상태 조회
    const { data: schedules, error } = await supabase
      .from('voting_schedules')
      .select(`
        id,
        regular_event_id,
        week_number,
        year,
        voting_start_time,
        voting_end_time,
        is_processed,
        created_at,
        multis!inner(
          title,
          game,
          multi_day,
          auto_voting_enabled
        )
      `)
      .order('voting_start_time', { ascending: true })
      .limit(20)
    
    if (error) {
      console.error('투표 스케줄 조회 실패:', error)
      return NextResponse.json({ 
        error: '투표 스케줄 조회에 실패했습니다.',
        details: error.message 
      }, { status: 500 })
    }
    
    const currentTime = new Date()
    
    // 각 스케줄의 현재 상태 계산
    const schedulesWithStatus = schedules?.map(schedule => ({
      ...schedule,
      status: {
        isActive: currentTime >= new Date(schedule.voting_start_time) && currentTime <= new Date(schedule.voting_end_time),
        shouldOpen: currentTime >= new Date(schedule.voting_start_time) && !schedule.is_processed,
        shouldClose: currentTime > new Date(schedule.voting_end_time) && schedule.is_processed,
        timeToStart: new Date(schedule.voting_start_time).getTime() - currentTime.getTime(),
        timeToEnd: new Date(schedule.voting_end_time).getTime() - currentTime.getTime()
      }
    })) || []
    
    return NextResponse.json({
      success: true,
      schedules: schedulesWithStatus,
      currentTime: currentTime.toISOString(),
      summary: {
        total: schedulesWithStatus.length,
        active: schedulesWithStatus.filter(s => s.status.isActive).length,
        pendingOpen: schedulesWithStatus.filter(s => s.status.shouldOpen).length,
        pendingClose: schedulesWithStatus.filter(s => s.status.shouldClose).length
      }
    })
    
  } catch (error) {
    console.error('투표 스케줄 조회 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
