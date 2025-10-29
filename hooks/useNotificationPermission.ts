import { useState, useEffect } from 'react'

export function useNotificationPermission() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // 브라우저 알림 지원 여부 확인
    const supported = 'Notification' in window
    const currentPermission = supported ? Notification.permission : 'denied'
    
    setPermission(currentPermission)
    setIsSupported(supported)
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      return false
    }

    if (permission === 'granted') {
      return true
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      
      if (result === 'granted') {
        return true
      } else if (result === 'denied') {
        return false
      } else {
        return false
      }
    } catch (error) {
      console.error('알림 권한 요청 중 오류:', error)
      return false
    }
  }

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('테스트 알림', {
        body: '알림이 정상적으로 작동합니다! 🎉',
        icon: '/favicon.ico',
        tag: 'test-notification'
      })
    }
  }

  return {
    permission,
    isSupported,
    requestPermission,
    sendTestNotification
  }
}
