// 파일 위치: app/api/getView/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🚨 노출주의: 배포 전 환경변수 보안필수
)

console.log('🔐 SERVICE ROLE:', process.env.SUPABASE_SERVICE_ROLE_KEY)

// GET 요청 처리
export async function GET() {
  const { data, error } = await supabase
    .from('page_views')
    .select('view_count')
    .eq('page_name', 'home')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message || '조회수 없음' }, { status: 500 })
  }

  return NextResponse.json({ view_count: data.view_count })
}
