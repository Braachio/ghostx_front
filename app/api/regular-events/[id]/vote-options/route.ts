import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

    const { data: voteOptions, error } = await supabase
      .from('vote_options')
      .select('id, option_type, option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', currentWeek)
      .eq('year', currentYear)
      .order('option_type, option_value')

    if (error) {
      return NextResponse.json({ error: '투표 옵션을 불러오는데 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      voteOptions: voteOptions || []
    })

  } catch (error) {
    console.error('투표 옵션 조회 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

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
    const { option_type, option_value, week_number, year } = body

    // 현재 주차 정보
    const currentYear = year || new Date().getFullYear()
    const currentWeek = week_number || Math.ceil((((+new Date() - +new Date(new Date().getFullYear(), 0, 1)) / 86400000) + new Date(new Date().getFullYear(), 0, 1).getDay() + 1) / 7)

    // 이벤트 소유자 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id')
      .eq('id', id)
      .single()

    if (eventError || !event || event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 소유자만 투표 옵션을 관리할 수 있습니다.' }, { status: 403 })
    }

    const { data: newOption, error } = await supabase
      .from('vote_options')
      .insert({
        regular_event_id: id,
        option_type,
        option_value,
        week_number: currentWeek,
        year: currentYear
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '투표 옵션 생성에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      voteOption: newOption
    })

  } catch (error) {
    console.error('투표 옵션 생성 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

export async function PATCH(
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
    const { option_id, option_value } = body

    // 이벤트 소유자 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id')
      .eq('id', id)
      .single()

    if (eventError || !event || event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 소유자만 투표 옵션을 관리할 수 있습니다.' }, { status: 403 })
    }

    const { data: updatedOption, error } = await supabase
      .from('vote_options')
      .update({ option_value })
      .eq('id', option_id)
      .eq('regular_event_id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: '투표 옵션 수정에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      voteOption: updatedOption
    })

  } catch (error) {
    console.error('투표 옵션 수정 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}

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
    const option_id = searchParams.get('option_id')

    if (!option_id) {
      return NextResponse.json({ error: '옵션 ID가 필요합니다.' }, { status: 400 })
    }

    // 이벤트 소유자 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id')
      .eq('id', id)
      .single()

    if (eventError || !event || event.author_id !== user.id) {
      return NextResponse.json({ error: '이벤트 소유자만 투표 옵션을 관리할 수 있습니다.' }, { status: 403 })
    }

    const { error } = await supabase
      .from('vote_options')
      .delete()
      .eq('id', option_id)
      .eq('regular_event_id', id)

    if (error) {
      return NextResponse.json({ error: '투표 옵션 삭제에 실패했습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: '투표 옵션이 삭제되었습니다.'
    })

  } catch (error) {
    console.error('투표 옵션 삭제 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 })
  }
}