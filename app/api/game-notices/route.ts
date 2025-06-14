import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ 서비스 롤 키는 서버 전용
)

export async function GET() {
  const { data, error } = await supabase
    .from('game_notices')
    .select('id, game, title, content, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ GET error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function POST(req: Request) {
  try {
    const { game, title, content } = await req.json()

    if (!game || !title || !content) {
      return new Response(JSON.stringify({ success: false, error: '모든 필드를 입력하세요.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { error } = await supabase.from('game_notices').insert([
      { game, title, content },
    ])

    if (error) {
      console.error('❌ INSERT error:', error)
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('❌ POST JSON parse error:', err)
    return new Response(JSON.stringify({ success: false, error: '요청 형식이 잘못되었습니다.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
