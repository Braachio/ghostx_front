'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import Footer from '@/components/Footer'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import GameInterestModal from '@/components/GameInterestModal'
import FullPageLayout from '@/components/FullPageLayout'
import type { Database } from '@/lib/database.types'

interface MeResponse {
  id: string
  nickname: string
}

type Multi = Database['public']['Tables']['multis']['Row']

export default function HomePage() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [language, setLanguage] = useState<'ko' | 'en'>('ko')
  const [views, setViews] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showGameInterestModal, setShowGameInterestModal] = useState(false)
  const [hasCheckedGameInterest, setHasCheckedGameInterest] = useState(false)
  const [events, setEvents] = useState<Multi[]>([])
  const [selectedGame, setSelectedGame] = useState('all')
  const [eventsLoading, setEventsLoading] = useState(true)
  const supabase = useSupabaseClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const loadUserAndViews = async () => {
      try {
        await fetch('/api/incrementView', { method: 'POST' })

        const viewRes = await fetch('/api/getView')
        if (viewRes.ok) {
          const { view_count } = await viewRes.json()
          setViews(view_count)
        }

        const meRes = await fetch('/api/me')
        if (meRes.ok) {
          const { user } = await meRes.json()
          setUser(user)
          
          // 스팀 로그인 사용자이고 관심게임 설정을 확인하지 않은 경우
          if (user && user.id && !hasCheckedGameInterest) {
            // 관심게임 설정 여부 확인
            const interestRes = await fetch('/api/user-interest-games')
            if (interestRes.ok) {
              const { games } = await interestRes.json()
              if (!games || games.length === 0) {
                // 관심게임이 설정되지 않은 경우 모달 표시
                setShowGameInterestModal(true)
              }
            }
            setHasCheckedGameInterest(true)
          }
        } else {
          setUser(null)
        }

        // 테스트 API 호출
        console.log('=== 테스트 API 호출 시작 ===')
        try {
          const testRes = await fetch('/api/test')
          const testData = await testRes.json()
          console.log('테스트 API 응답:', testData)
        } catch (testError) {
          console.error('테스트 API 에러:', testError)
        }
        console.log('=== 테스트 API 호출 완료 ===')

        // 이벤트 데이터 가져오기
        console.log('=== 이벤트 데이터 가져오기 시작 ===')
        console.log('fetch 시작 전')
        
        try {
          const eventsRes = await fetch('/api/multis')
          console.log('API 응답 상태:', eventsRes.status)
          console.log('API 응답 헤더:', eventsRes.headers)
        
          if (eventsRes.ok) {
            const responseData = await eventsRes.json()
            console.log('API 응답 데이터:', responseData)
            
            // 응답이 배열인지 확인
            if (Array.isArray(responseData)) {
              setEvents(responseData)
              console.log('이벤트 설정 완료:', responseData.length, '개')
            } else {
              console.log('응답이 배열이 아님:', responseData)
              setEvents([])
            }
          } else {
            console.error('API 요청 실패:', eventsRes.status, eventsRes.statusText)
            const errorText = await eventsRes.text()
            console.error('에러 응답 내용:', errorText)
            setEvents([])
          }
        } catch (fetchError) {
          console.error('fetch 에러:', fetchError)
          setEvents([])
        }
        
        setEventsLoading(false)
        console.log('=== 이벤트 데이터 가져오기 완료 ===')

      } catch (err) {
        console.error('데이터 로드 실패:', err)
      }
    }

    loadUserAndViews()
  }, [mounted, hasCheckedGameInterest, supabase])

  const handleGameInterestComplete = () => {
    setShowGameInterestModal(false)
  }

  const handleGameInterestClose = () => {
    setShowGameInterestModal(false)
  }

  const handleGameChange = (game: string) => {
    setSelectedGame(game)
  }

  return (
    <>
      <FullPageLayout
        user={user}
        language={language}
        views={views}
        events={events}
        eventsLoading={eventsLoading}
        selectedGame={selectedGame}
        onGameChange={handleGameChange}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
      />
      
      {/* Footer */}
      <Footer />

      {/* Cookie Consent Banner */}
      <CookieConsentBanner />
      
      {/* Game Interest Modal */}
      <GameInterestModal
        isOpen={showGameInterestModal}
        onClose={handleGameInterestClose}
        onComplete={handleGameInterestComplete}
      />
    </>
  )
}