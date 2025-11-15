import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// DELETE /api/iracing/driver/favorites/[custId] - 즐겨찾기 제거
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    const { custId } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const custIdNum = parseInt(custId, 10)
    if (isNaN(custIdNum) || custIdNum <= 0) {
      return NextResponse.json({ error: '유효하지 않은 custId입니다.' }, { status: 400 })
    }

    const { error } = await supabase
      .from('iracing_favorite_drivers')
      .delete()
      .eq('user_id', user.id)
      .eq('cust_id', custIdNum)

    if (error) {
      console.error('[Favorites] Failed to remove:', error)
      return NextResponse.json({ error: '즐겨찾기 제거 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Favorites] Error:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// PUT /api/iracing/driver/favorites/[custId] - 즐겨찾기 메모 업데이트
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ custId: string }> }
) {
  try {
    const { custId } = await params
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { driverName, notes } = await req.json()
    const custIdNum = parseInt(custId, 10)
    if (isNaN(custIdNum) || custIdNum <= 0) {
      return NextResponse.json({ error: '유효하지 않은 custId입니다.' }, { status: 400 })
    }

    const { data: favorite, error } = await supabase
      .from('iracing_favorite_drivers')
      .update({
        driver_name: driverName || null,
        notes: notes || null,
      })
      .eq('user_id', user.id)
      .eq('cust_id', custIdNum)
      .select()
      .single()

    if (error) {
      console.error('[Favorites] Failed to update:', error)
      return NextResponse.json({ error: '즐겨찾기 업데이트 실패' }, { status: 500 })
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

