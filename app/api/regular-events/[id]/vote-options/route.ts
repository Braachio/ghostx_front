import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// 투표 후보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createRouteHandlerClient({ cookies })

    // 투표 옵션들 조회
    const { data: voteOptions, error } = await supabase
      .from('regular_event_vote_options')
      .select('*')
      .eq('regular_event_id', id)
      .order('option_type, created_at')

    if (error) throw error

    return NextResponse.json({
      success: true,
      voteOptions: voteOptions || []
    })

  } catch (error) {
    console.error('투표 후보 조회 실패:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 투표 후보 추가
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
    const { optionType, optionValue, weekNumber, year } = body

    if (!optionType || !optionValue || !weekNumber || !year) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    // 이벤트 작성자인지 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id, event_type')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 작성자만 투표 후보를 관리할 수 있습니다.' }, { status: 403 })
    }

    if (event.event_type !== 'regular_schedule') {
      return NextResponse.json({ error: '정기 이벤트만 투표 후보를 관리할 수 있습니다.' }, { status: 400 })
    }

    // 중복 확인
    const { data: existingOption } = await supabase
      .from('regular_event_vote_options')
      .select('id')
      .eq('regular_event_id', id)
      .eq('option_type', optionType)
      .eq('option_value', optionValue)
      .eq('week_number', weekNumber)
      .eq('year', year)
      .single()

    if (existingOption) {
      return NextResponse.json({ error: '이미 존재하는 투표 후보입니다.' }, { status: 400 })
    }

    // 투표 후보 추가
    const { data: newOption, error: insertError } = await supabase
      .from('regular_event_vote_options')
      .insert({
        regular_event_id: id,
        option_type: optionType,
        option_value: optionValue,
        week_number: weekNumber,
        year: year,
        votes_count: 0,
        voting_closed: false
      })
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({
      success: true,
      message: '투표 후보가 추가되었습니다.',
      voteOption: newOption
    })

  } catch (error) {
    console.error('투표 후보 추가 실패:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}

// 투표 후보 삭제
export async function DELETE(
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

    const { searchParams } = new URL(req.url)
    const voteOptionId = searchParams.get('voteOptionId')

    if (!voteOptionId) {
      return NextResponse.json({ error: '투표 후보 ID가 필요합니다.' }, { status: 400 })
    }

    // 이벤트 작성자인지 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id, event_type')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: '이벤트를 찾을 수 없습니다.' }, { status: 404 })
    }

    if (event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 작성자만 투표 후보를 관리할 수 있습니다.' }, { status: 403 })
    }

    // 투표 후보 삭제
    const { error: deleteError } = await supabase
      .from('regular_event_vote_options')
      .delete()
      .eq('id', voteOptionId)
      .eq('regular_event_id', id)

    if (deleteError) throw deleteError

    return NextResponse.json({
      success: true,
      message: '투표 후보가 삭제되었습니다.'
    })

  } catch (error) {
    console.error('투표 후보 삭제 실패:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
