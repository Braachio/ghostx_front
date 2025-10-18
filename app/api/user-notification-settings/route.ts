import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET /api/user-notification-settings - 사용자 알림 설정 조회
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 사용자 알림 설정 조회
    const { data: settings, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때
      console.error('알림 설정 조회 실패:', error)
      return NextResponse.json({ error: '알림 설정 조회 실패' }, { status: 500 })
    }

    // 기본 설정 반환 (설정이 없을 경우)
    const defaultSettings = {
      flash_event_notifications: true,
      regular_event_notifications: true,
      email_notifications: false,
      push_notifications: false
    }

    return NextResponse.json({ 
      settings: settings || defaultSettings,
      isDefault: !settings
    })
  } catch (error) {
    console.error('알림 설정 API 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

// POST /api/user-notification-settings - 사용자 알림 설정 저장/업데이트
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { 
      flash_event_notifications, 
      regular_event_notifications, 
      email_notifications, 
      push_notifications 
    } = await req.json()

    // upsert를 사용하여 중복 키 오류 방지
    const { data: settings, error } = await supabase
      .from('user_notification_settings')
      .upsert({
        user_id: user.id,
        flash_event_notifications: flash_event_notifications ?? true,
        regular_event_notifications: regular_event_notifications ?? true,
        email_notifications: email_notifications ?? false,
        push_notifications: push_notifications ?? false
      })
      .select()
      .single()

    if (error) {
      console.error('알림 설정 저장 실패:', error)
      return NextResponse.json({ error: '알림 설정 저장 실패' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      settings,
      message: '알림 설정이 저장되었습니다.'
    })
  } catch (error) {
    console.error('알림 설정 저장 오류:', error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
