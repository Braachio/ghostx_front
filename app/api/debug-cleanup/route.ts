import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    // 환경 변수 확인
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 환경 변수 확인:')
    console.log('- SUPABASE_URL:', supabaseUrl ? '설정됨' : '누락')
    console.log('- SERVICE_ROLE_KEY:', serviceRoleKey ? '설정됨' : '누락')
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: '환경 변수 누락',
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      }, { status: 500 })
    }
    
    // Service Role Key로 Supabase 연결 테스트
    const supabase = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    // 간단한 쿼리 테스트
    const { data, error } = await supabase
      .from('multis')
      .select('id, title, is_open')
      .limit(3)
    
    if (error) {
      console.error('Supabase 연결 테스트 실패:', error)
      return NextResponse.json({
        error: 'Supabase 연결 실패',
        details: error
      }, { status: 500 })
    }
    
    console.log('✅ Supabase 연결 성공:', data)
    
    return NextResponse.json({
      message: '환경 변수 및 연결 테스트 성공',
      environment: {
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      },
      testData: data
    })
    
  } catch (error) {
    console.error('디버그 테스트 중 오류:', error)
    return NextResponse.json({
      error: '디버그 테스트 실패',
      details: error
    }, { status: 500 })
  }
}
