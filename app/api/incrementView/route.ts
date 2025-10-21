import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  try {
    console.log('📡 조회수 증가 API 호출됨')

    // 먼저 현재 조회수 조회
    const { data: currentData, error: selectError } = await supabase
      .from('page_views')
      .select('view_count')
      .eq('page_name', 'home')
      .single()

    if (selectError && selectError.code !== 'PGRST116') {
      console.error('❌ 조회수 조회 실패:', selectError.message)
      return NextResponse.json({ error: selectError.message }, { status: 500 })
    }

    const currentCount = currentData?.view_count || 0
    const newCount = currentCount + 1

    // 조회수 업데이트 또는 삽입
    const { error: upsertError } = await supabase
      .from('page_views')
      .upsert(
        { 
          page_name: 'home', 
          view_count: newCount,
          updated_at: new Date().toISOString()
        }, 
        { onConflict: 'page_name' }
      )

    if (upsertError) {
      console.error('❌ 조회수 업데이트 실패:', upsertError.message)
      return NextResponse.json({ error: upsertError.message }, { status: 500 })
    }

    console.log('✅ 조회수 증가 성공:', newCount)
    return NextResponse.json({ success: true, view_count: newCount })
  } catch (error) {
    console.error('❌ 조회수 증가 오류:', error)
    return NextResponse.json({ error: '조회수 증가 실패' }, { status: 500 })
  }
}
