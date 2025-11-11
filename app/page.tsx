'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import Footer from '@/components/Footer'
import CookieConsentBanner from '@/components/CookieConsentBanner'
import GameInterestModal from '@/components/GameInterestModal'
import EventDetailModal from '@/components/EventDetailModal'
import FullPageLayout from '@/components/FullPageLayout'
import type { Database } from '@/lib/database.types'
import { useLanguage } from '@/hooks/useLanguage'

interface MeResponse {
  id: string
  nickname: string
  email: string
  role: string
}

type Multi = Database['public']['Tables']['multis']['Row']

export default function HomePage() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [views, setViews] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showGameInterestModal, setShowGameInterestModal] = useState(false)
  const [hasCheckedGameInterest, setHasCheckedGameInterest] = useState(false)
  const [events, setEvents] = useState<Multi[]>([])
  const [selectedGame, setSelectedGame] = useState('all')
  const [eventsLoading, setEventsLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Multi | null>(null)
  const [hasManagementPermission, setHasManagementPermission] = useState(false)
  const supabase = useSupabaseClient()
  const { language, setLanguage } = useLanguage()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  const handleEventClick = async (event: Multi) => {
    setSelectedEvent(event)
    setShowEventModal(true)
    
    // 관리자 권한 확인
    if (user) {
      try {
        const response = await fetch(`/api/check-management-permission?eventId=${event.id}`)
        if (response.ok) {
          const { hasPermission } = await response.json()
          setHasManagementPermission(hasPermission)
        }
      } catch (error) {
        console.error('권한 확인 실패:', error)
        setHasManagementPermission(false)
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    
    // 모바일 디바이스 감지 및 서브도메인 리다이렉트 (루트 경로만)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768
    const currentHost = window.location.hostname
    const isMainDomain = !currentHost.startsWith('m.')
    const isRootPath = window.location.pathname === '/'
    
    if (isMobile && isMainDomain && isRootPath && !currentHost.includes('localhost') && !currentHost.includes('127.0.0.1')) {
      // 루트 경로만 모바일 서브도메인으로 리다이렉트
      const protocol = window.location.protocol
      window.location.href = `${protocol}//m.${currentHost}`
      return
    }
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

        // 이벤트 데이터 가져오기
        try {
          const eventsRes = await fetch('/api/multis')
          
          if (eventsRes.ok) {
            const responseData = await eventsRes.json()
            
            if (Array.isArray(responseData)) {
              setEvents(responseData)
            } else {
              setEvents([])
            }
          } else {
            setEvents([])
          }
        } catch (error) {
          console.error('이벤트 데이터 가져오기 실패:', error)
          setEvents([])
        }
        
        setEventsLoading(false)

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
        onEventClick={handleEventClick}
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

      {/* Event Detail Modal */}
      <EventDetailModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        event={selectedEvent}
        user={user}
        hasManagementPermission={hasManagementPermission}
      />
    </>
  )
}