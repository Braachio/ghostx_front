import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })
    
    // 사용자 인증 확인
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json()
    const { week_number, year, voting_closed } = body

    // 현재 주차 정보 확인 (요청에서 받지 않은 경우)
    const currentYear = year || new Date().getFullYear()
    const currentWeek = week_number || Math.ceil((((+new Date() - +new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)

    // 1. 이벤트 작성자인지 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 작성자만 투표를 종료/재개할 수 있습니다.' }, { status: 403 })
    }

    // 2. 투표 옵션이 존재하는지 확인
    const { data: voteOptions, error: optionsError } = await supabase
      .from('regular_event_vote_options')
      .select('id')
      .eq('regular_event_id', id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .limit(1)

    if (optionsError || !voteOptions || voteOptions.length === 0) {
      return NextResponse.json({ error: '해당 주차의 투표 옵션이 존재하지 않습니다.' }, { status: 404 })
    }

    // 3. 투표 상태 업데이트 (voting_closed 필드가 있는지 확인)
    try {
      const { error: updateError } = await supabase
        .from('regular_event_vote_options')
        .update({ voting_closed: voting_closed })
        .eq('regular_event_id', id)
        .eq('week_number', currentWeek)
        .eq('year', currentYear)

      if (updateError) {
        console.error('투표 상태 업데이트 실패:', updateError)
        // voting_closed 필드가 없을 수 있으므로 경고만 출력하고 계속 진행
        console.warn('voting_closed 필드가 없습니다. 데이터베이스 마이그레이션이 필요합니다.')
        return NextResponse.json({ 
          success: true, 
          message: voting_closed ? '투표가 종료되었습니다.' : '투표가 재개되었습니다.',
          warning: 'voting_closed 필드가 없습니다. 데이터베이스 마이그레이션을 실행하세요.',
          voting_closed: voting_closed
        })
      }
    } catch (error) {
      console.error('투표 상태 업데이트 중 오류:', error)
      return NextResponse.json({ 
        success: true, 
        message: voting_closed ? '투표가 종료되었습니다.' : '투표가 재개되었습니다.',
        warning: 'voting_closed 필드가 없습니다. 데이터베이스 마이그레이션을 실행하세요.',
        voting_closed: voting_closed
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: voting_closed ? '투표가 종료되었습니다.' : '투표가 재개되었습니다.',
      voting_closed: voting_closed
    })

  } catch (error) {
    console.error('투표 종료/재개 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })
    
    const { searchParams } = new URL(req.url)
    const week_number = parseInt(searchParams.get('week_number') || '0')
    const year = parseInt(searchParams.get('year') || '0')

    // 현재 주차 정보
    const currentYear = year || new Date().getFullYear()
    const currentWeek = week_number || Math.ceil((((+new Date() - +new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)

    // 투표 종료 상태 확인
    const { data: votingStatus, error } = await supabase
      .from('regular_event_vote_options')
      .select('voting_closed')
      .eq('regular_event_id', id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .limit(1)

    if (error || !votingStatus || votingStatus.length === 0) {
      return NextResponse.json({ 
        voting_closed: false,
        exists: false 
      })
    }

    return NextResponse.json({ 
      voting_closed: votingStatus[0].voting_closed,
      exists: true 
    })

  } catch (error) {
    console.error('투표 상태 조회 API 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}
