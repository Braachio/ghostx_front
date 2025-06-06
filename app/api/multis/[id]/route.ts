import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types' // ← 실제 경로로 수정

// 경로에서 ID 추출하는 유틸 함수
function extractIdFromUrl(req: NextRequest): string | null {
  const urlParts = req.nextUrl.pathname.split('/')
  const id = urlParts[urlParts.length - 1]
  return id || null
}

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const id = extractIdFromUrl(req)

  if (!id) return NextResponse.json({ error: 'ID가 없습니다.' }, { status: 400 })

  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const id = extractIdFromUrl(req)

  if (!id) return NextResponse.json({ error: 'ID가 없습니다.' }, { status: 400 })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: existing } = await supabase
    .from('multis')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: '데이터를 찾을 수 없습니다.' }, { status: 404 })
  if (user.id !== existing.author_id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await supabase
    .from('multis')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const id = extractIdFromUrl(req)

  if (!id) return NextResponse.json({ error: 'ID가 없습니다.' }, { status: 400 })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })

  const { data: existing } = await supabase
    .from('multis')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: '데이터를 찾을 수 없습니다.' }, { status: 404 })
  if (user.id !== existing.author_id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })

  const { error } = await supabase.from('multis').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
