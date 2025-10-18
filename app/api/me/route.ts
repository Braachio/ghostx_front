import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookieStore,
  })

  // 개발 환경에서 관리자 쿠키 확인
  if (process.env.NODE_ENV !== 'production') {
    const adminToken = cookieStore.get('sb-access-token')?.value
    if (adminToken === 'mock_admin_token') {
      // 하드코딩된 관리자 정보 사용
      const adminUid = 'ea8c7783-ac7d-4c4e-95ca-676bc06c1b73' // vlees
      
      return NextResponse.json({
        user: {
          id: adminUid,
          email: 'admin@ghostx.com',
          email_confirmed_at: new Date().toISOString(),
          nickname: '관리자',
          has_uploaded_data: false,
          role: 'admin',
        },
      })
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, nickname, has_uploaded_data, steam_id, role')
    .eq('id', user.id)
    .single()

  // 프로필이 없으면 자동 생성
  let finalProfile = profile
  
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
      .select('id, nickname, has_uploaded_data, role')
      .single()
    
    if (insertError || !newProfile) {
      console.error('프로필 생성 실패:', insertError)
      return NextResponse.json({ error: '프로필 생성 실패' }, { status: 500 })
    }
    
    finalProfile = newProfile
  }

  // 여기까지 왔으면 finalProfile은 Profile 타입이 확정됨
  const { nickname, has_uploaded_data, steam_id, role } = finalProfile

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      email_confirmed_at: user.email_confirmed_at,
      nickname,
      has_uploaded_data: has_uploaded_data ?? false,
      steam_id: steam_id || null,
      role: role || 'user',
      is_steam_user: !!steam_id, // Steam 사용자인지 여부
    },
  })
}
