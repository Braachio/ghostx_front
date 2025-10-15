import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(req.url)
    const week_number = searchParams.get('week_number')
    const year = searchParams.get('year')

    if (!week_number || !year) {
      return NextResponse.json({ error: '주차와 연도 정보가 필요합니다.' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })

    // 투표 결과 조회
    const { data: trackResults, error: trackError } = await supabase
      .from('regular_event_vote_options')
      .select('option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', parseInt(week_number))
      .eq('year', parseInt(year))
      .eq('option_type', 'track')
      .order('votes_count', { ascending: false })

    const { data: carClassResults, error: carClassError } = await supabase
      .from('regular_event_vote_options')
      .select('option_value, votes_count')
      .eq('regular_event_id', id)
      .eq('week_number', parseInt(week_number))
      .eq('year', parseInt(year))
      .eq('option_type', 'car_class')
      .order('votes_count', { ascending: false })

    if (trackError || carClassError) {
      return NextResponse.json({ error: '투표 결과를 조회할 수 없습니다.' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      results: {
        tracks: trackResults || [],
        carClasses: carClassResults || [],
        week_number: parseInt(week_number),
        year: parseInt(year)
      }
    })

  } catch (error) {
    console.error('투표 결과 조회 API 오류:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'
    }, { status: 500 })
  }
}
