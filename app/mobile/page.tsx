'use client'

import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import MobileLayout from '@/components/mobile/MobileLayout'
import EventDetailModal from '@/components/EventDetailModal'
import type { Database } from '@/lib/database.types'

interface MeResponse {
  id: string
  nickname: string
  email: string
  role: string
}

type Multi = Database['public']['Tables']['multis']['Row']

export default function MobileHomePage() {
  const [user, setUser] = useState<MeResponse | null>(null)
  const [language, setLanguage] = useState<'ko' | 'en'>('ko')
  const [views, setViews] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const [events, setEvents] = useState<Multi[]>([])
  const [selectedGame, setSelectedGame] = useState('all')
  const [eventsLoading, setEventsLoading] = useState(true)
  const [showEventModal, setShowEventModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Multi | null>(null)
  const [hasManagementPermission, setHasManagementPermission] = useState(false)
  const supabase = useSupabaseClient()

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
  }, [mounted, supabase])

  const handleGameChange = (game: string) => {
    setSelectedGame(game)
  }

  return (
    <>
      <MobileLayout
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
