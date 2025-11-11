'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import TopNavigation from '@/components/TopNavigation'
import TelemetryUpload from '@/components/TelemetryUpload'
import { TELEMETRY_ENABLED, TELEMETRY_DISABLED_MESSAGE } from '@/lib/featureFlags'
import { useLanguage } from '@/hooks/useLanguage'

interface User {
  id: string
  email: string
  nickname: string
  role: string
}

export default function TelemetryPage() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = useSupabaseClient()
  const { language, setLanguage } = useLanguage()

  // 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/me')
        if (res.ok) {
          const { user } = await res.json()
          setUser(user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
        setUser(null)
      }
    }
    loadUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    location.reload()
  }

  if (!TELEMETRY_ENABLED) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
        <TopNavigation
          user={user}
          language={language}
          onLanguageChange={setLanguage}
          onLogout={handleLogout}
        />
        <div className="pt-24 px-4 sm:px-6 lg:px-12 xl:px-16 pb-20">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-2xl border border-dashed border-cyan-500/40 bg-cyan-500/10 p-10 text-center text-cyan-200">
              <p className="text-lg font-medium">{TELEMETRY_DISABLED_MESSAGE}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* 상단 네비게이션 */}
      <TopNavigation
        user={user}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
      />

      {/* 메인 컨텐츠 */}
      <div className="pt-24 px-4 sm:px-6 lg:px-12 xl:px-16 pb-20">
        <div className="w-full mx-auto space-y-6">
          {/* 상단 설명 섹션 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                주행 데이터 분석
              </span>
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-white">
              텔레메트리 데이터 수집 및 시각화
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              iRacing SDK를 통해 실시간으로 주행 데이터를 수집하고<br />
              페달 입력, 타이어 온도, G-Force 등을 분석하여 랩타임을 개선하세요
            </p>
            <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>

          {/* 텔레메트리 컴포넌트 */}
          <TelemetryUpload />
        </div>
      </div>
    </div>
  )
}

