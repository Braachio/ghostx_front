// /app/api/multis/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  })

  const start = req.nextUrl.searchParams.get('start')
  const end = req.nextUrl.searchParams.get('end')

  let query = supabase.from('multis').select('*')

  if (start && end) {
    query = query.gte('created_at', start).lte('created_at', end)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await req.json()

  const now = new Date()
  const oneJan = new Date(now.getFullYear(), 0, 1)
  const currentWeek = Math.ceil((((+now - +oneJan) / 86400000) + oneJan.getDay() + 1) / 7)

  const { error: insertError } = await supabase.from('multis').insert({
    ...body,
    year: now.getFullYear(),
    week: currentWeek,
    author_id: user.id,
    created_at: now.toISOString(),
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
