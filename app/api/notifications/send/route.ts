import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// POST /api/notifications/send - 이벤트 활성화 시 관심게임 사용자에게 알림 전송
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const { eventId, eventTitle, eventGame, eventType } = await req.json()

    if (!eventId || !eventTitle || !eventGame) {
      return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 })
    }

    console.log('알림 전송 요청:', { eventId, eventTitle, eventGame, eventType })

    // 해당 게임을 관심게임으로 등록한 사용자들 조회
    const { data: interestedUsers, error: usersError } = await supabase
      .from('user_interest_games')
      .select(`
        user_id,
        user:profiles!user_interest_games_user_id_fkey(
          id,
          nickname,
          email
        )
      `)
      .eq('game_name', eventGame)

    if (usersError) {
      console.error('관심게임 사용자 조회 실패:', usersError)
      return NextResponse.json({ error: '관심게임 사용자 조회 실패' }, { status: 500 })
    }

    console.log(`관심게임 사용자 ${interestedUsers?.length || 0}명 발견`)

    if (!interestedUsers || interestedUsers.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: '해당 게임을 관심게임으로 등록한 사용자가 없습니다.',
        notifiedCount: 0 
      })
    }

    // 각 사용자의 알림 설정 확인 및 알림 전송
    let notifiedCount = 0
    const notificationResults = []

    for (const userInterest of interestedUsers) {
      const userId = userInterest.user_id
      const user = userInterest.user

      if (!user) continue

      try {
        // 사용자의 알림 설정 조회
        const { data: notificationSettings, error: settingsError } = await supabase
          .from('user_notification_settings')
          .select('*')
          .eq('user_id', userId)
          .single()

        // 기본 설정 (설정이 없으면 기본값 사용)
        const settings = notificationSettings || {
          flash_event_notifications: true,
          regular_event_notifications: true,
          push_notifications: true
        }

        // 알림 타입에 따른 설정 확인
        const shouldNotify = eventType === 'flash_event' 
          ? settings.flash_event_notifications 
          : settings.regular_event_notifications

        if (!shouldNotify || !settings.push_notifications) {
          console.log(`사용자 ${user.nickname} 알림 설정으로 인해 제외됨`)
          continue
        }

        // 알림 메시지 생성
        const notificationMessage = eventType === 'flash_event'
          ? `⚡ 새로운 기습 갤멀이 활성화되었습니다!\n\n🎮 ${eventTitle}\n📅 ${eventGame}`
          : `📅 새로운 정기 갤멀이 활성화되었습니다!\n\n🎮 ${eventTitle}\n📅 매주 ${eventGame}`

        // 실제 푸시 알림 전송 (여기서는 로그로 대체)
        console.log(`📱 푸시 알림 전송: ${user.nickname} (${user.email})`)
        console.log(`메시지: ${notificationMessage}`)

        // TODO: 실제 푸시 알림 서비스 연동 (FCM, OneSignal 등)
        // await sendPushNotification(user.push_token, notificationMessage)

        notifiedCount++
        notificationResults.push({
          userId: user.id,
          nickname: user.nickname,
          success: true
        })

      } catch (error) {
        console.error(`사용자 ${user.nickname} 알림 전송 실패:`, error)
        notificationResults.push({
          userId: user.id,
          nickname: user.nickname,
          success: false,
          error: error instanceof Error ? error.message : '알 수 없는 오류'
        })
      }
    }

    console.log(`✅ 알림 전송 완료: ${notifiedCount}명에게 전송`)

    return NextResponse.json({
      success: true,
      message: `${notifiedCount}명의 사용자에게 알림을 전송했습니다.`,
      notifiedCount,
      totalInterestedUsers: interestedUsers.length,
      results: notificationResults
    })

  } catch (error) {
    console.error('알림 전송 오류:', error)
    return NextResponse.json({ 
      error: '알림 전송 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 })
  }
}
