'use client'

import { useEffect } from 'react'
import MobileChat from '@/components/mobile/MobileChat'

export default function MobileChatPage() {
  // 전체 페이지 스크롤 강제 차단 (모바일 브라우저 주소창 변형 대응)
  useEffect(() => {
    const y = window.scrollY || 0
    const html = document.documentElement
    const body = document.body

    // 스크롤 체이닝 및 바운스 방지
    html.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'

    // 뷰포트 높이 고정 시도
    html.style.height = '100%'
    body.style.height = '100%'

    // 스크롤 완전 차단 (주소창 수축/확장에도 유지)
    body.style.position = 'fixed'
    body.style.top = `-${y}px`
    body.style.left = '0'
    body.style.right = '0'
    body.style.width = '100%'
    body.style.overflow = 'hidden'

    return () => {
      // 원복
      html.style.overscrollBehavior = ''
      body.style.overscrollBehavior = ''
      html.style.height = ''
      body.style.height = ''
      body.style.position = ''
      body.style.top = ''
      body.style.left = ''
      body.style.right = ''
      body.style.width = ''
      body.style.overflow = ''
      window.scrollTo(0, y)
    }
  }, [])

  // MobileChat handles auth and presence internally; user can be null
  return (
    <div
      className="fixed inset-0 bg-gray-900 overflow-hidden"
      style={{
        height: '100dvh', // 최신 모바일 브라우저 대응
        minHeight: '100dvh',
        maxHeight: '100dvh'
      }}
    >
      <MobileChat user={null} language="ko" />
    </div>
  )
}
