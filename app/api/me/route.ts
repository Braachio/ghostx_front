import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createServerComponentClient<Database>({ cookies })

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    console.warn('🚫 [WARN] 로그인된 유저 없음')
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ user })
}
