import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

export async function GET() {
  try {
    console.log('=== Auth Test Debug ===')
    
    // 환경 변수 확인
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      steamApiKey: !!process.env.STEAM_WEB_API_KEY,
    }
    
    console.log('Environment variables:', envCheck)
    
    // Supabase 클라이언트 생성 테스트
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 기본 연결 테스트
    const { data: authData, error: authError } = await supabase.auth.getSession()
    console.log('Auth session check:', { hasSession: !!authData.session, error: authError })
    
    // 데이터베이스 연결 테스트
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)
    
    console.log('Database connection check:', { 
      hasData: !!profileData, 
      error: profileError?.message 
    })
    
    return NextResponse.json({
      success: true,
      environment: envCheck,
      auth: { hasSession: !!authData.session, error: authError?.message },
      database: { connected: !profileError, error: profileError?.message }
    })
  } catch (error) {
    console.error('Auth test error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
