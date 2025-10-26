import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

interface UseEventToggleProps {
  eventId: string
  eventTitle: string
  eventGame: string
  eventType: 'flash_event' | 'regular_schedule'
  onToggle?: (isOpen: boolean) => void
}

export function useEventToggle({ 
  eventId, 
  eventTitle, 
  eventGame, 
  eventType, 
  onToggle 
}: UseEventToggleProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient<Database>()

  const toggleEvent = async (currentIsOpen: boolean) => {
    if (isLoading) return

    setIsLoading(true)

    try {
      // 이벤트 상태 업데이트
      const { error } = await supabase
        .from('multis')
        .update({ is_open: !currentIsOpen })
        .eq('id', eventId)

      if (error) {
        throw new Error(error.message)
      }

      // 이벤트가 활성화된 경우에만 알림 전송
      if (!currentIsOpen) {
        try {
          console.log('이벤트 활성화 - 알림 전송 시작:', { eventId, eventTitle, eventGame, eventType })
          
          const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventId,
              eventTitle,
              eventGame,
              eventType
            })
          })

          if (response.ok) {
            const result = await response.json()
            console.log('알림 전송 성공:', result)
            
            // 성공 메시지 표시 (선택사항)
            if (result.notifiedCount > 0) {
              console.log(`✅ ${result.notifiedCount}명의 사용자에게 알림을 전송했습니다.`)
            }
          } else {
            const errorData = await response.json()
            console.error('알림 전송 실패:', errorData)
            // 알림 전송 실패해도 이벤트 토글은 성공으로 처리
          }
        } catch (notificationError) {
          console.error('알림 전송 중 오류:', notificationError)
          // 알림 전송 실패해도 이벤트 토글은 성공으로 처리
        }
      }

      // 성공 콜백 호출
      onToggle?.(!currentIsOpen)

    } catch (error) {
      console.error('이벤트 토글 실패:', error)
      alert(`상태 변경 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    toggleEvent,
    isLoading
  }
}
