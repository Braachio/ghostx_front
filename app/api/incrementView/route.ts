import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST() {
  // 확인용 로그
  console.log('📡 API 호출됨')

  // 없으면 삽입
  const { error: upsertError } = await supabase
    .from('page_views')
    .upsert({ page_name: 'home' }, { onConflict: 'page_name' })

  if (upsertError) {
    console.error('❌ Upsert 실패:', upsertError.message)
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // 조회수 증가
  const { data, error: rpcError } = await supabase.rpc('increment_home_views')

  if (rpcError) {
    console.error('❌ 함수 실행 실패:', rpcError.message)
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, view_count: data })
}
