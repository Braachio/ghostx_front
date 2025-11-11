'use client'

import { useState, useEffect } from 'react'
import Cookies from 'js-cookie'
import BrandMark from '@/components/BrandMark'

export default function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const consent = Cookies.get('cookie_consent')
    setIsVisible(!consent)
  }, [])

  const handleAccept = (type: 'essential' | 'all') => {
    Cookies.set('cookie_consent', type, { expires: 365 })
    setIsVisible(false)
  }

  const handleSettings = () => {
    // 쿠키 설정 모달이나 페이지로 이동
    console.log('쿠키 설정 열기')
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-gray-900 via-black to-gray-900 border-t border-cyan-500/30 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* 메시지 */}
          <div className="flex items-center gap-3 text-sm text-gray-300">
            <BrandMark size={36} textClassName="text-[13px]" />
            <p className="text-xs text-gray-400 leading-relaxed">
              본 웹사이트 사용 시 GPX의 서비스 약관 및 정책에 동의하는 것으로 간주됩니다.
            </p>
          </div>

          {/* 버튼들 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSettings}
              className="px-4 py-2 text-xs text-gray-400 hover:text-cyan-400 transition-colors underline"
            >
              내 쿠키 설정 보기/수정
            </button>
            <button
              onClick={() => handleAccept('essential')}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              필수만 허용
            </button>
            <button
              onClick={() => handleAccept('all')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white text-sm rounded-lg transition-colors shadow-lg"
            >
              전체 허용
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}