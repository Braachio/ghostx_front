import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// 단일 공지 가져오기
export async function GET(
  _req: NextRequest,
  context: { params: { id: string } }
): Promise<Response> {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = context.params

  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .eq('id', id)
    .single()

  if (error)
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })

  if (!data)
    return new NextResponse(JSON.stringify({ error: '찾을 수 없습니다.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })

  return new NextResponse(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// 공지 수정
export async function PATCH(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<Response> {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: '로그인이 필요합니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: existing } = await supabase
    .from('multis')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return new NextResponse(JSON.stringify({ error: '데이터를 찾을 수 없습니다.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (user.id !== existing.author_id) {
    return new NextResponse(JSON.stringify({ error: '권한이 없습니다.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.json()
  const { data, error } = await supabase
    .from('multis')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error)
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })

  return new NextResponse(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// 공지 삭제
export async function DELETE(
  req: NextRequest,
  context: { params: { id: string } }
): Promise<Response> {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse(JSON.stringify({ error: '로그인이 필요합니다.' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { data: existing } = await supabase
    .from('multis')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return new NextResponse(JSON.stringify({ error: '데이터를 찾을 수 없습니다.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (user.id !== existing.author_id) {
    return new NextResponse(JSON.stringify({ error: '권한이 없습니다.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { error } = await supabase.from('multis').delete().eq('id', id)

  if (error)
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })

  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
