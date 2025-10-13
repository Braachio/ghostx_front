// /app/api/regular-events/[eventId]/vote/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const resolvedParams = await params
  const { eventId } = resolvedParams
  const body = await req.json()
  const { week_number, year, track_option, car_class_option } = body

  try {
    // 기존 투표 확인
    const { data: existingVote } = await supabase
      .from('regular_event_votes')
      .select('*')
      .eq('regular_event_id', eventId)
      .eq('week_number', week_number)
      .eq('year', year)
      .eq('voter_id', user.id)
      .single()

    if (existingVote) {
      // 기존 투표 수정
      const { error: updateError } = await supabase
        .from('regular_event_votes')
        .update({
          track_option,
          car_class_option,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingVote.id)

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    } else {
      // 새 투표 생성
      const { error: insertError } = await supabase
        .from('regular_event_votes')
        .insert({
          regular_event_id: eventId,
          week_number,
          year,
          voter_id: user.id,
          track_option,
          car_class_option
        })

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('투표 처리 오류:', error)
    return NextResponse.json({ error: '투표 처리 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const supabase = createRouteHandlerClient<Database>({
    cookies: () => cookies(),
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const resolvedParams = await params
  const { eventId } = resolvedParams
  const { searchParams } = new URL(req.url)
  const week_number = searchParams.get('week_number')
  const year = searchParams.get('year')

  if (!week_number || !year) {
    return NextResponse.json({ error: '주차와 연도가 필요합니다.' }, { status: 400 })
  }

  try {
    // 사용자의 투표 조회
    const { data: userVote } = await supabase
      .from('regular_event_votes')
      .select('*')
      .eq('regular_event_id', eventId)
      .eq('week_number', parseInt(week_number))
      .eq('year', parseInt(year))
      .eq('voter_id', user.id)
      .single()

    // 투표 옵션과 결과 조회
    const { data: voteOptions } = await supabase
      .from('regular_event_vote_options')
      .select('*')
      .eq('regular_event_id', eventId)
      .eq('week_number', parseInt(week_number))
      .eq('year', parseInt(year))
      .order('votes_count', { ascending: false })

    return NextResponse.json({
      userVote: userVote || null,
      voteOptions: voteOptions || []
    })
  } catch (error) {
    console.error('투표 조회 오류:', error)
    return NextResponse.json({ error: '투표 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
