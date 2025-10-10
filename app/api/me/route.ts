import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  let { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nickname, has_uploaded_data')
    .eq('id', user.id)
    .single()

  // 프로필이 없으면 자동 생성
  if (error || !profile) {
    console.log('프로필이 없어서 자동 생성합니다:', user.id)
    
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email,
        nickname: user.email?.split('@')[0] || 'user',
        agreed_terms: true,
        agreed_privacy: true,
      })
      .select('id, nickname, has_uploaded_data')
      .single()
    
    if (insertError || !newProfile) {
      console.error('프로필 생성 실패:', insertError)
      return NextResponse.json({ error: '프로필 생성 실패' }, { status: 500 })
    }
    
    profile = newProfile
  }

  // 여기까지 왔으면 profile은 Profile 타입이 확정됨
  const { nickname, has_uploaded_data } = profile

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      nickname,
      has_uploaded_data: has_uploaded_data ?? false,
    },
  })
}
