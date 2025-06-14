import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const id = pathname.split('/').pop() // URL에서 id 추출

  if (!id || id === 'undefined') {
    return new Response(JSON.stringify({ error: 'Invalid ID' }), { status: 400 })
  }

  const { data, error } = await supabase
    .from('game_notices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
