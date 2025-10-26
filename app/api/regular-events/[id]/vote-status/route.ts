import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET /api/regular-events/[id]/vote-status - 투표 상태 확인
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params

    console.log('투표 상태 확인:', { regularEventId: id })

    // 현재 주차와 연도 계산
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentWeek = Math.ceil((((+now - +new Date(now.getFullYear(), 0, 1)) / 86400000) + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7)

    // 투표 상태 확인 (voting_closed 필드가 있는지 확인)
    const { data: voteOptions, error } = await supabase
      .from('regular_event_vote_options')
      .select('voting_closed')
      .eq('regular_event_id', id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .limit(1)

    console.log('투표 상태 조회 결과:', { 
      regularEventId: id, 
      currentWeek,
      currentYear,
      voteOptions,
      error 
    })

    if (error) {
      console.error('투표 상태 조회 실패:', error)
      return NextResponse.json({ error: '투표 상태를 확인할 수 없습니다.' }, { status: 500 })
    }

    // voting_closed 필드가 없으면 기본적으로 투표 활성화 상태
    const isVotingClosed = voteOptions && voteOptions.length > 0 ? voteOptions[0].voting_closed : false

    return NextResponse.json({
      isVotingClosed,
      currentWeek,
      currentYear,
      hasVoteOptions: voteOptions && voteOptions.length > 0
    })

  } catch (error) {
    console.error('투표 상태 확인 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
