import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST /api/events/[id]/increment-view - 이벤트 조회수 증가
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params
    console.log('📡 이벤트 조회수 증가 API 호출됨:', eventId)

    // 먼저 현재 조회수 조회
    const { data: currentData, error: selectError } = await supabase
      .from('multis')
      .select('view_count')
      .eq('id', eventId)
      .single()

    if (selectError) {
      console.error('❌ 이벤트 조회수 조회 실패:', selectError.message)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    const currentCount = currentData?.view_count || 0
    const newCount = currentCount + 1

    // 조회수 업데이트
    const { error: updateError } = await supabase
      .from('multis')
      .update({ view_count: newCount })
      .eq('id', eventId)

    if (updateError) {
      console.error('❌ 이벤트 조회수 업데이트 실패:', updateError.message)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('✅ 이벤트 조회수 증가 성공:', { eventId, newCount })
    return NextResponse.json({ 
      success: true, 
      view_count: newCount 
    })

  } catch (error) {
    console.error('❌ 이벤트 조회수 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}



