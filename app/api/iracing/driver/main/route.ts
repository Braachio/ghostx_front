import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/iracing/driver/main - 주요 드라이버 조회
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('main_driver_cust_id')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('[Main Driver] Failed to fetch:', error)
      return NextResponse.json({ error: '주요 드라이버 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({
      mainDriverCustId: profile?.main_driver_cust_id ? String(profile.main_driver_cust_id) : null,
    })
  } catch (error) {
    console.error('[Main Driver] Error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/iracing/driver/main - 주요 드라이버 설정
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { custId } = await req.json()
    if (!custId) {
      return NextResponse.json({ error: 'custId가 필요합니다.' }, { status: 400 })
    }

    const custIdNum = parseInt(String(custId), 10)
    if (isNaN(custIdNum) || custIdNum <= 0) {
      return NextResponse.json({ error: '유효하지 않은 custId입니다.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ main_driver_cust_id: custIdNum })
      .eq('id', user.id)

    if (error) {
      console.error('[Main Driver] Failed to update:', error)
      return NextResponse.json({ error: '주요 드라이버 설정 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      mainDriverCustId: String(custIdNum),
    })
  } catch (error) {
    console.error('[Main Driver] Error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// DELETE /api/iracing/driver/main - 주요 드라이버 제거
export async function DELETE() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { error } = await supabase
      .from('profiles')
      .update({ main_driver_cust_id: null })
      .eq('id', user.id)

    if (error) {
      console.error('[Main Driver] Failed to remove:', error)
      return NextResponse.json({ error: '주요 드라이버 제거 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Main Driver] Error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

