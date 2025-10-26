import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET - 내가 관리하는 이벤트 목록 조회
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('사용자 인증 확인:', { 
      user: user?.id, 
      email: user?.email,
      error: authError 
    })
    
    if (authError || !user) {
      console.log('인증 실패:', authError)
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    console.log('내가 관리하는 이벤트 조회:', { userId: user.id })

    // 사용자 프로필에서 역할 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('프로필 조회 실패:', profileError)
      return NextResponse.json({ error: '프로필 조회에 실패했습니다.' }, { status: 500 })
    }

    const isAdmin = profile?.role === 'admin' || profile?.role === 'event_manager'

    // 내가 관리하는 이벤트 조회
    let query = supabase
      .from('multis')
      .select(`
        id,
        title,
        game,
        event_type,
        event_date,
        start_time,
        end_time,
        day_of_week,
        multi_day,
        is_active,
        created_at,
        updated_at,
        author_id
      `)
      .order('created_at', { ascending: false })

    // 관리자가 아닌 경우 자신이 작성한 이벤트만 조회
    if (!isAdmin) {
      query = query.eq('author_id', user.id)
    }

    const { data: events, error } = await query

    if (error) {
      console.error('이벤트 조회 실패:', error)
      return NextResponse.json({ error: '이벤트 조회에 실패했습니다.' }, { status: 500 })
    }

    // 각 이벤트의 투표 상태 및 작성자 정보 확인
    const eventsWithVoteStatus = await Promise.all(
      (events || []).map(async (event) => {
        // 작성자 정보 조회
        const { data: authorProfile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', event.author_id)
          .single()

        // 투표 옵션 개수 조회
        const { data: voteOptions, error: voteOptionsError } = await supabase
          .from('regular_event_vote_options')
          .select('id, option_value, votes_count, voting_closed')
          .eq('regular_event_id', event.id)
          .eq('option_type', 'track')

        // 투표 상태 확인 (voting_closed가 true인 옵션이 있는지)
        const hasClosedVoting = voteOptions?.some(option => option.voting_closed === true) || false
        const totalVotes = voteOptions?.reduce((sum, option) => sum + (option.votes_count || 0), 0) || 0

        return {
          ...event,
          author: {
            nickname: authorProfile?.nickname || '알 수 없음'
          },
          voteOptions: voteOptions || [],
          voteOptionsCount: voteOptions?.length || 0,
          totalVotes,
          votingClosed: hasClosedVoting,
          canManage: isAdmin || event.author_id === user.id
        }
      })
    )

    console.log('관리 이벤트 조회 성공:', { 
      userId: user.id, 
      userRole: profile?.role,
      eventsCount: eventsWithVoteStatus.length 
    })

    return NextResponse.json({
      events: eventsWithVoteStatus,
      userRole: profile?.role,
      isAdmin
    })

  } catch (error) {
    console.error('내가 관리하는 이벤트 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
