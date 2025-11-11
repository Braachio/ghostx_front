'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import TopNavigation from '@/components/TopNavigation'
import BrakingPointTrainer from '@/components/training/BrakingPointTrainer'
import { useLanguage } from '@/hooks/useLanguage'

interface User {
  id: string
  email: string
  nickname: string
  role: string
}

export default function TrainingPage() {
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
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    location.reload()
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
                AI 교정 훈련
              </span>
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-white">
              브레이킹 포인트 집중 훈련
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              실제 레이싱 장비(액셀, 브레이크, 스티어링)로<br />
              브레이킹 포인트를 정확히 맞추는 근육 기억을 훈련하세요
            </p>
            <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>

          {/* 훈련 모듈 */}
          <BrakingPointTrainer />
        </div>
      </div>
    </div>
  )
}

