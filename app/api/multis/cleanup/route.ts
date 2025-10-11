import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDateFromWeekAndDay } from '@/app/utils/weekUtils'

export async function POST() {
  try {
    console.log('🧹 이벤트 상태 정리 작업 시작')
    
    // Service Role Key를 사용하여 관리자 권한으로 연결
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // 현재 시간
    const now = new Date()
    console.log(`현재 시간: ${now.toISOString()}`)
    
    // 모든 활성 이벤트 조회
    const { data: activeEvents, error: fetchError } = await supabase
      .from('multis')
      .select('id, title, event_date, year, week, multi_day, multi_time, is_open')
      .eq('is_open', true)
    
    if (fetchError) {
      console.error('활성 이벤트 조회 실패:', fetchError)
      return NextResponse.json({ error: '활성 이벤트 조회 실패' }, { status: 500 })
    }
    
    console.log(`활성 이벤트 ${activeEvents?.length || 0}개 조회됨`)
    
    if (!activeEvents || activeEvents.length === 0) {
      return NextResponse.json({ 
        message: '정리할 활성 이벤트가 없습니다',
        updatedCount: 0 
      })
    }
    
    const eventsToClose: string[] = []
    
    // 각 이벤트의 종료 시간 계산
    for (const event of activeEvents) {
      let eventEndTime: Date | null = null
      
      if (event.event_date) {
        // event_date가 있는 경우 (정확한 날짜)
        const eventDate = new Date(event.event_date)
        
        if (event.multi_time) {
          // 시간 정보가 있는 경우
          const [hours, minutes] = event.multi_time.split(':').map(Number)
          eventDate.setHours(hours, minutes, 0, 0)
          
          // 이벤트 종료 시간 (시작 시간 + 2시간으로 가정)
          eventEndTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)
        } else {
          // 시간 정보가 없는 경우, 해당 날짜의 23:59로 설정
          eventDate.setHours(23, 59, 59, 999)
          eventEndTime = eventDate
        }
      } else if (event.year && event.week && event.multi_day && event.multi_day.length > 0) {
        // week/year 기반 계산
        const eventDate = getDateFromWeekAndDay(event.year, event.week, event.multi_day[0])
        
        if (event.multi_time) {
          // 시간 정보가 있는 경우
          const [hours, minutes] = event.multi_time.split(':').map(Number)
          eventDate.setHours(hours, minutes, 0, 0)
          
          // 이벤트 종료 시간 (시작 시간 + 2시간으로 가정)
          eventEndTime = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)
        } else {
          // 시간 정보가 없는 경우, 해당 날짜의 23:59로 설정
          eventDate.setHours(23, 59, 59, 999)
          eventEndTime = eventDate
        }
      }
      
      // 이벤트 종료 시간이 현재 시간보다 이전이면 닫기 대상
      if (eventEndTime && eventEndTime < now) {
        eventsToClose.push(event.id)
        console.log(`이벤트 종료됨: ${event.title} (종료시간: ${eventEndTime.toISOString()})`)
      }
    }
    
    console.log(`닫을 이벤트 ${eventsToClose.length}개 발견`)
    
    if (eventsToClose.length === 0) {
      return NextResponse.json({ 
        message: '종료된 이벤트가 없습니다',
        updatedCount: 0 
      })
    }
    
    // 이벤트 상태를 false로 업데이트
    console.log(`업데이트할 이벤트 ID들:`, eventsToClose)
    
    const { data: updateData, error: updateError } = await supabase
      .from('multis')
      .update({ is_open: false })
      .in('id', eventsToClose)
      .select('id, title, is_open')
    
    if (updateError) {
      console.error('이벤트 상태 업데이트 실패:', updateError)
      return NextResponse.json({ error: '이벤트 상태 업데이트 실패', details: updateError }, { status: 500 })
    }
    
    console.log(`업데이트 결과:`, updateData)
    console.log(`✅ ${eventsToClose.length}개 이벤트 상태 업데이트 완료`)
    
    return NextResponse.json({
      message: `정리 작업 완료`,
      updatedCount: eventsToClose.length,
      updatedEvents: eventsToClose
    })
    
  } catch (error) {
    console.error('이벤트 정리 작업 중 오류:', error)
    return NextResponse.json(
      { error: '이벤트 정리 작업 중 오류 발생' }, 
      { status: 500 }
    )
  }
}
