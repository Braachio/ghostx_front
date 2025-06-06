// /app/api/me/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET() {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ user: null }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ user: profile })
}
