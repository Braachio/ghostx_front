import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, message } = await req.json()

  if (!message || message.trim().length === 0) {
    return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 })
  }

  const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ 서비스 롤 키는 서버 전용
)

  const { error } = await supabase.from('feedback').insert({ email, message })

  if (error) {
    return NextResponse.json({ error: '저장 실패', details: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
