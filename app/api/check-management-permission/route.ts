import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    console.log('권한 확인 API 호출:', { eventId })

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    console.log('사용자 인증 확인:', { user: user?.id, error: userError })
    
    if (userError || !user) {
      console.log('권한 확인 실패 - 인증 오류')
      return NextResponse.json({ hasPermission: false })
    }

    // 이벤트 작성자 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id')
      .eq('id', eventId)
      .single()

    console.log('이벤트 정보 확인:', { event, error: eventError })

    if (eventError || !event) {
      console.log('권한 확인 실패 - 이벤트 없음')
      return NextResponse.json({ hasPermission: false })
    }

    // 관리자 권한 또는 작성자 권한 확인
    const isOwner = event.author_id === user.id
    
    // 관리자 권한 확인 (role이 'admin', 'moderator', 또는 'event_manager'인 경우)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    console.log('프로필 정보 확인:', { profile, isOwner })

    const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'event_manager'
    
    const hasPermission = isOwner || isAdmin
    
    console.log('최종 권한 확인 결과:', { 
      isOwner, 
      isAdmin, 
      hasPermission, 
      userRole: profile?.role,
      userId: user.id,
      eventAuthorId: event.author_id
    })
    
    return NextResponse.json({ 
      hasPermission: hasPermission 
    })

  } catch (error) {
    console.error('권한 확인 오류:', error)
    return NextResponse.json({ hasPermission: false })
  }
}
