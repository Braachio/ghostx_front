import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

interface Multi {
  id: string
  title: string
  game_category: string
  game: string
  multi_name: string
  multi_day: string[]
  multi_time: string | null
  is_open: boolean
  description: string | null
  author_id: string | null
  created_at: string
  updated_at: string
  year?: number
  week?: number
}

type Params = {
  params: { id: string }
}

// ✅ GET - 단일 공지 조회
export async function GET(
  _req: NextRequest,
  context: Params
): Promise<NextResponse<{ data?: Multi; error?: string }>> {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = context.params

  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json({ data }, { status: 200 })
}

// ✅ PATCH - 공지 수정
export async function PATCH(
  req: NextRequest,
  context: Params
): Promise<NextResponse<{ data?: Multi; error?: string }>> {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: existing } = await supabase
    .from('multis')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: '데이터를 찾을 수 없습니다.' }, { status: 404 })
  }

  if (user.id !== existing.author_id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const body = await req.json()

  const { data, error } = await supabase
    .from('multis')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 200 })
}

// ✅ DELETE - 공지 삭제
export async function DELETE(
  _req: NextRequest,
  context: Params
): Promise<NextResponse<{ success?: boolean; error?: string }>> {
  const supabase = createRouteHandlerClient({ cookies })
  const { id } = context.params

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: existing } = await supabase
    .from('multis')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json({ error: '데이터를 찾을 수 없습니다.' }, { status: 404 })
  }

  if (user.id !== existing.author_id) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { error } = await supabase.from('multis').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 200 })
}
