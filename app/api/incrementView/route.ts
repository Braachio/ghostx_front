import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 서비스 키 필요 (보안 주의)
)

export async function POST() {
  // 🔹 page_name: 'home'이 없으면 생성
  const { error: upsertError } = await supabase
    .from('page_views')
    .upsert({ page_name: 'home' }, { onConflict: 'page_name' })

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  // 🔹 조회수 증가 함수 호출
  const { data: result, error: rpcError } = await supabase.rpc('increment_home_views')

  if (rpcError) {
    return NextResponse.json({ error: rpcError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, view_count: result })
}
