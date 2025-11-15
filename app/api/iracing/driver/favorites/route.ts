import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/iracing/driver/favorites - 즐겨찾기 목록 조회
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { data: favorites, error } = await supabase
      .from('iracing_favorite_drivers')
      .select('id, cust_id, driver_name, notes, created_at, updated_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[Favorites] Failed to fetch:', error)
      return NextResponse.json({ error: '즐겨찾기 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({
      favorites: (favorites || []).map(fav => ({
        id: fav.id,
        custId: String(fav.cust_id),
        driverName: fav.driver_name,
        notes: fav.notes,
        createdAt: fav.created_at,
        updatedAt: fav.updated_at,
      })),
    })
  } catch (error) {
    console.error('[Favorites] Error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/iracing/driver/favorites - 즐겨찾기 추가
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { custId, driverName, notes } = await req.json()
    if (!custId) {
      return NextResponse.json({ error: 'custId가 필요합니다.' }, { status: 400 })
    }

    const custIdNum = parseInt(String(custId), 10)
    if (isNaN(custIdNum) || custIdNum <= 0) {
      return NextResponse.json({ error: '유효하지 않은 custId입니다.' }, { status: 400 })
    }

    const { data: favorite, error } = await supabase
      .from('iracing_favorite_drivers')
      .upsert({
        user_id: user.id,
        cust_id: custIdNum,
        driver_name: driverName || null,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      console.error('[Favorites] Failed to add:', error)
      return NextResponse.json({ error: '즐겨찾기 추가 실패' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      favorite: {
        id: favorite.id,
        custId: String(favorite.cust_id),
        driverName: favorite.driver_name,
        notes: favorite.notes,
        createdAt: favorite.created_at,
        updatedAt: favorite.updated_at,
      },
    })
  } catch (error) {
    console.error('[Favorites] Error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

