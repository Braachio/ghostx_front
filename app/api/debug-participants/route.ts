import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // 1. multi_participants 테이블 확인
    const { data: participantsData, error: participantsError } = await supabase
      .from('multi_participants')
      .select('*')
      .limit(5)
    
    console.log('multi_participants 테이블 확인:', {
      data: participantsData,
      error: participantsError?.message
    })
    
    // 2. multis 테이블 확인 (참조 테이블)
    const { data: multisData, error: multisError } = await supabase
      .from('multis')
      .select('id, title, event_type')
      .eq('event_type', 'regular_schedule')
      .limit(5)
    
    console.log('multis 테이블 확인:', {
      data: multisData,
      error: multisError?.message
    })
    
    return NextResponse.json({
      success: true,
      multi_participants: {
        exists: !participantsError,
        error: participantsError?.message,
        count: participantsData?.length || 0,
        sample: participantsData
      },
      multis: {
        exists: !multisError,
        error: multisError?.message,
        count: multisData?.length || 0,
        sample: multisData
      }
    })
    
  } catch (error) {
    console.error('디버깅 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
