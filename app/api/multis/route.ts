import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'

async function checkAdmin(access_token: string | null): Promise<{ isAdmin: boolean; userId?: string }> {
  if (!access_token) return { isAdmin: false }

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(access_token)
  if (error || !user) return { isAdmin: false }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) return { isAdmin: false }

  return { isAdmin: profile.role === 'admin', userId: user.id }
}

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const { data, error } = await supabase
    .from('multis')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const access_token = req.headers.get('authorization')?.replace('Bearer ', '') || null

  const { isAdmin, userId } = await checkAdmin(access_token)
  if (!isAdmin || !userId) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const body = await req.json()

  const { error } = await supabase.from('multis').insert({
    ...body,
    author_id: userId,
    created_at: new Date().toISOString(),
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
