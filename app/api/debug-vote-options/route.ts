import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET /api/debug-vote-options - 투표 옵션 디버깅
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    const { searchParams } = new URL(req.url)
    const regularEventId = searchParams.get('regularEventId')
    
    console.log('=== 투표 옵션 디버깅 시작 ===')
    console.log('Regular Event ID:', regularEventId)
    
    // 1. 테이블 존재 여부 확인
    const { data: tableInfo, error: tableError } = await supabase
      .from('regular_event_vote_options')
      .select('*')
      .limit(1)
    
    console.log('테이블 존재 확인:', { 
      hasData: !!tableInfo, 
      error: tableError,
      tableExists: !tableError || !tableError.message.includes('does not exist')
    })
    
    if (tableError) {
      return NextResponse.json({
        error: '테이블 오류',
        details: tableError.message,
        tableExists: false
      }, { status: 500 })
    }
    
    // 2. 특정 이벤트의 투표 옵션 확인
    if (regularEventId) {
      const { data: options, error: optionsError } = await supabase
        .from('regular_event_vote_options')
        .select('*')
        .eq('regular_event_id', regularEventId)
      
      console.log('특정 이벤트 투표 옵션:', {
        regularEventId,
        optionsCount: options?.length || 0,
        options: options,
        error: optionsError
      })
      
      return NextResponse.json({
        tableExists: true,
        regularEventId,
        optionsCount: options?.length || 0,
        options: options || [],
        error: optionsError
      })
    }
    
    // 3. 전체 투표 옵션 확인
    const { data: allOptions, error: allOptionsError } = await supabase
      .from('regular_event_vote_options')
      .select('*')
      .limit(10)
    
    console.log('전체 투표 옵션 샘플:', {
      totalCount: allOptions?.length || 0,
      sample: allOptions,
      error: allOptionsError
    })
    
    return NextResponse.json({
      tableExists: true,
      totalOptionsCount: allOptions?.length || 0,
      sampleOptions: allOptions || [],
      error: allOptionsError
    })
    
  } catch (error) {
    console.error('투표 옵션 디버깅 오류:', error)
    return NextResponse.json({ 
      error: '디버깅 오류',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
