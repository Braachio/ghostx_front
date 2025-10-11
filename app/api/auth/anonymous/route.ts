import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function POST(request: Request) {
  try {
    console.log('=== Anonymous Login Debug ===')
    console.log('Supabase URL configured:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Supabase Anon Key configured:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // 요청에서 저장된 익명 사용자 ID 확인
    const body = await request.json().catch(() => ({}))
    const savedAnonymousId = body.savedAnonymousId

    // 먼저 기존 세션이 있는지 확인
    console.log('Checking for existing session...')
    const { data: sessionData } = await supabase.auth.getSession()
    
    if (sessionData.session && sessionData.session.user) {
      console.log('Existing session found:', sessionData.session.user.id)
      console.log('User email:', sessionData.session.user.email)
      console.log('Is anonymous:', sessionData.session.user.is_anonymous)
      
      // 이미 로그인된 사용자가 있으면 (Steam 또는 익명) 그대로 사용
      return NextResponse.json({ 
        success: true, 
        user: sessionData.session.user,
        message: '이미 로그인된 사용자가 있습니다.' 
      })
    }
    
    // 저장된 익명 사용자 ID가 있으면 해당 사용자로 로그인 시도
    if (savedAnonymousId) {
      console.log('Attempting to restore saved anonymous user:', savedAnonymousId)
      
      // 저장된 익명 사용자 정보로 로그인 시도
      try {
        const { data: restoreData, error: restoreError } = await supabase.auth.signInWithPassword({
          email: `anonymous_${savedAnonymousId}@ghostx.site`,
          password: savedAnonymousId,
        })
        
        if (!restoreError && restoreData.user) {
          console.log('Successfully restored anonymous user:', restoreData.user.id)
          return NextResponse.json({ 
            success: true, 
            user: restoreData.user,
            message: '기존 익명 사용자가 복원되었습니다.' 
          })
        }
      } catch (err) {
        console.log('Failed to restore anonymous user, creating new one:', err)
      }
    }
    
    console.log('No existing session or saved user, creating new anonymous user...')
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

    // 익명 사용자를 위한 고유 ID 생성 (브라우저에 저장할 용도)
    const anonymousId = data.user.id.substring(0, 8) // UUID의 앞 8자리 사용

    // 익명 사용자를 위한 기본 프로필 생성
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      email: `anonymous_${anonymousId}@ghostx.site`,
      nickname: `ㅇㅇ #${anonymousId}`,
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
      anonymousId: anonymousId, // 브라우저에 저장할 고유 ID
      message: '익명 로그인에 성공했습니다.' 
    })
  } catch (error) {
    console.error('Unexpected error in anonymous login:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
