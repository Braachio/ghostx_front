import { useState, useEffect } from 'react'

interface NotificationPermission {
  permission: NotificationPermission
  isSupported: boolean
}

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>({
    permission: 'default',
    isSupported: false
  })

  useEffect(() => {
    // 브라우저 알림 지원 여부 확인
    const isSupported = 'Notification' in window
    const currentPermission = isSupported ? Notification.permission : 'denied'
    
    setPermission({
      permission: currentPermission,
      isSupported
    })
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!permission.isSupported) {
      console.log('이 브라우저는 알림을 지원하지 않습니다.')
      return false
    }

    if (permission.permission === 'granted') {
      return true
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(prev => ({ ...prev, permission: result }))
      
      if (result === 'granted') {
        console.log('✅ 알림 권한이 허용되었습니다!')
        return true
      } else if (result === 'denied') {
        console.log('❌ 알림 권한이 거부되었습니다.')
        return false
      } else {
        console.log('⏳ 알림 권한 요청이 취소되었습니다.')
        return false
      }
    } catch (error) {
      console.error('알림 권한 요청 중 오류:', error)
      return false
    }
  }

  const sendTestNotification = () => {
    if (permission.permission === 'granted') {
      new Notification('테스트 알림', {
        body: '알림이 정상적으로 작동합니다! 🎉',
        icon: '/favicon.ico',
        tag: 'test-notification'
      })
    }
  }

  return {
    ...permission,
    requestPermission,
    sendTestNotification
  }
}
