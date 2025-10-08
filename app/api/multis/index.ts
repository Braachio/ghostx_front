import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'

type Multi = {
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

type Data = { error?: string; success?: boolean; data?: Multi[] }

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

export async function GET(): Promise<NextResponse<Data>> {
  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] }, { status: 200 })
}

export async function POST(req: NextRequest): Promise<NextResponse<Data>> {
  // 쿠키에서 세션 정보 읽기
  const cookieStore = req.cookies
  const accessToken = cookieStore.get('sb-access-token')?.value
  
  if (!accessToken) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  // 사용자 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken)
  
  if (authError || !user) {
    return NextResponse.json({ error: '인증에 실패했습니다.' }, { status: 401 })
  }

  const body = await req.json()

  const now = new Date()
  const oneJan = new Date(now.getFullYear(), 0, 1)
  const currentWeek = Math.ceil((((+now - +oneJan) / 86400000) + oneJan.getDay() + 1) / 7)

  const year = body.year ?? now.getFullYear()
  const week = body.week ?? currentWeek

  // 일반 사용자는 비활성 상태로만 등록 가능, 관리자는 활성 상태로도 등록 가능
  const isAdmin = await checkAdmin(accessToken)
  const isOpen = isAdmin ? (body.is_open ?? false) : false

  const { error } = await supabaseAdmin.from('multis').insert({
    ...body,
    author_id: user.id,
    year,
    week,
    is_open: isOpen,
    created_at: now.toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ 
    success: true, 
    message: isAdmin ? '이벤트가 등록되었습니다.' : '이벤트가 등록되었습니다. 운영자 승인 후 활성화됩니다.'
  }, { status: 201 })
}
