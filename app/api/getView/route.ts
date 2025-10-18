// 파일 위치: app/api/getView/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 캐시 설정
export const revalidate = 60 // 60초 캐시

// GET 요청 처리
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('page_views')
      .select('view_count')
      .eq('page_name', 'home')
      .single()

    if (error || !data) {
      console.error('조회수 조회 실패:', error?.message)
      return NextResponse.json({ error: '조회수 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ view_count: data.view_count })
  } catch (error) {
    console.error('조회수 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
