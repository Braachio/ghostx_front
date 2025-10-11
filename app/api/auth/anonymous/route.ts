import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST() {
  try {
    console.log('=== Anonymous Login Debug ===')
    console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Anon Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // 먼저 기존 세션이 있는지 확인
    console.log('Checking for existing anonymous session...')
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData.session && sessionData.session.user) {
      console.log('Existing session found:', sessionData.session.user.id)
      return NextResponse.json({ 
        success: true, 
        user: sessionData.session.user,
        message: '기존 익명 세션이 있습니다.' 
      })
    }
    
    console.log('No existing session, creating new anonymous user...')
    // 익명 로그인 시도
    const { data, error } = await supabase.auth.signInAnonymously()

    if (error) {
      console.error('Anonymous login error:', error)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        code: error.code
      })
      return NextResponse.json({ 
        error: '익명 로그인에 실패했습니다.',
        details: error.message 
      }, { status: 400 })
    }

    if (!data.user) {
      console.error('No user returned from anonymous login')
      return NextResponse.json({ error: '사용자 생성에 실패했습니다.' }, { status: 400 })
    }

    console.log('Anonymous user created:', data.user.id)

    // 익명 사용자를 위한 기본 프로필 생성
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: `anonymous_${Date.now()}@ghostx.site`,
      nickname: `익명사용자${Math.floor(Math.random() * 10000)}`,
      agreed_terms: true,
      agreed_privacy: true,
    })

    if (profileError && !profileError.message?.includes('duplicate key')) {
      console.error('Anonymous profile creation error:', profileError)
      // 프로필 생성 실패해도 로그인은 성공으로 처리
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      message: '익명 로그인에 성공했습니다.' 
    })
  } catch (error) {
    console.error('Unexpected error in anonymous login:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
