import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ✅ 올바른 타입 시그니처
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id

  if (!id || id === 'undefined') {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), { status: 400 })
  }

  const { data, error } = await supabase
    .from('game_notices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('GET error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
