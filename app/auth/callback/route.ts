import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    try {
      // 이메일 인증 코드를 사용하여 세션 교환
      await supabase.auth.exchangeCodeForSession(code)
      
      // 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 프로필이 없으면 자동 생성
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()
        
        if (!existingProfile) {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            nickname: user.email?.split('@')[0] || 'user',
            agreed_terms: true,
            agreed_privacy: true,
          })
        }
      }
    } catch (error) {
      console.error('Auth callback error:', error)
    }
  }

  // 인증 완료 후 온보딩 페이지로 리다이렉트
  return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
}

