import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'

// 타입 정의
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
}

// 관리자 확인 함수
async function checkAdmin(access_token: string | null): Promise<boolean> {
  if (!access_token) return false

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token)
  if (error || !user) return false

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return false
  return profile.role === 'admin'
}

// 단일 공지 가져오기
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ error?: string; data?: Multi }>> {
  const { id } = await params

  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })

  return NextResponse.json({ data }, { status: 200 })
}

// 공지 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ error?: string; data?: Multi }>> {
  const { id } = await params
  const access_token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!(await checkAdmin(access_token))) {
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

// 공지 삭제
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ success?: boolean; error?: string }>> {
  const { id } = await params
  const access_token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null
  if (!(await checkAdmin(access_token))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const { error } = await supabase.from('multis').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 200 })
}

// 공지 생성
export async function POST(req: NextRequest): Promise<NextResponse<{ success?: boolean; error?: string }>> {
  const access_token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null

  if (!access_token) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token)
  if (error || !user) {
    return NextResponse.json({ error: '사용자 인증 실패' }, { status: 401 })
  }

  const body = await req.json()

  const { error: insertError } = await supabase
    .from('multis')
    .insert({ ...body, author_id: user.id, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 200 })
}
