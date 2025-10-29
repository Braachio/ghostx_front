import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'

// GET - 사용자의 알림 설정 조회
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 기본 설정 반환 (설정이 없는 경우)
    const defaultSettings = {
      flash_event_notifications: true,
      regular_event_notifications: true,
      email_notifications: false,
      push_notifications: true
    }

    return NextResponse.json({ settings: data || defaultSettings })
  } catch (error) {
    console.error('알림 설정 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 })
  }
}

// PUT - 알림 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { flash_event_notifications, regular_event_notifications, email_notifications, push_notifications } = body

    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
    }

    const settingsData = {
      user_id: user.id,
      flash_event_notifications: flash_event_notifications ?? true,
      regular_event_notifications: regular_event_notifications ?? true,
      email_notifications: email_notifications ?? false,
      push_notifications: push_notifications ?? true
    }

    const { data, error } = await supabase
      .from('user_notification_settings')
      .upsert(settingsData, { onConflict: 'user_id' })
      .select()
      .single()

    if (error) {
      console.error('알림 설정 업데이트 DB 오류:', error)
      return NextResponse.json({ error: error.message || '알림 설정 업데이트 실패' }, { status: 500 })
    }

    return NextResponse.json({ success: true, settings: data })
  } catch (error) {
    console.error('알림 설정 업데이트 오류:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : '서버 오류가 발생했습니다' 
    }, { status: 500 })
  }
}
