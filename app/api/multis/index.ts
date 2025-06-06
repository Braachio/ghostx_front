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
  const access_token = req.headers.get('authorization')?.replace('Bearer ', '') ?? null

  if (!(await checkAdmin(access_token))) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const body = await req.json()

  const now = new Date()
  const oneJan = new Date(now.getFullYear(), 0, 1)
  const currentWeek = Math.ceil((((+now - +oneJan) / 86400000) + oneJan.getDay() + 1) / 7)

  const year = body.year ?? now.getFullYear()
  const week = body.week ?? currentWeek

  const { error } = await supabase.from('multis').insert({
    ...body,
    year,
    week,
    created_at: now.toISOString(),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true }, { status: 201 })
}
