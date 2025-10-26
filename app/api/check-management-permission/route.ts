import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient<Database>({ cookies })
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ hasPermission: false })
    }

    // 이벤트 작성자 확인
    const { data: event, error: eventError } = await supabase
      .from('multis')
      .select('author_id')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
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

    const isAdmin = profile?.role === 'admin' || profile?.role === 'moderator' || profile?.role === 'event_manager'
    
    return NextResponse.json({ 
      hasPermission: isOwner || isAdmin 
    })

  } catch (error) {
    console.error('권한 확인 오류:', error)
    return NextResponse.json({ hasPermission: false })
  }
}
