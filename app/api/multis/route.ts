// app/api/multis/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/lib/database.types'

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const body = await req.json()

  const {
    title,
    game_category,
    game,
    multi_name,
    multi_day,
    multi_time,
    is_open,
    description,
  } = body

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { data, error } = await supabase
    .from('multis')
    .insert({
      title,
      game_category,
      game,
      multi_name,
      multi_day,
      multi_time,
      is_open,
      description,
      author_id: session?.user.id || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}
