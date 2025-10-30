'use client'

import { useEffect } from 'react'
import MobileChat from '@/components/mobile/MobileChat'

export default function MobileChatPage() {
  // 전체 페이지 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [])

  // MobileChat handles auth and presence internally; user can be null
  return (
    <div 
      className="fixed inset-0 bg-gray-900 overflow-hidden" 
      style={{ 
        height: '100vh', 
        height: '100dvh',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
    >
      <MobileChat user={null} language="ko" />
    </div>
  )
}
