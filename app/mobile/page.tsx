'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import MobileHeader from '../../components/mobile/MobileHeader'
import MobileCalendar from '../../components/mobile/MobileCalendar'
import MobileEventList from '../../components/mobile/MobileEventList'
import MobileNavigation from '../../components/mobile/MobileNavigation'
import { createClient } from '../utils/supabase'

export default function MobileHomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'calendar' | 'events'>('calendar')
  const [events, setEvents] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    
    // 사용자 정보 가져오기
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    // 이벤트 데이터 가져오기
    const getEvents = async () => {
      try {
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data = await response.json()
          setEvents(data || [])
        }
      } catch (error) {
        console.error('이벤트 로딩 실패:', error)
      }
    }

    getUser()
    getEvents()
  }, [])

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="mobile-loading">
          <div className="mobile-spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <MobileHeader user={user} />
      
      <main className="flex-1 overflow-hidden">
        {activeTab === 'calendar' ? (
          <MobileCalendar 
            events={events}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
          />
        ) : (
          <MobileEventList 
            events={events}
            selectedDate={selectedDate}
          />
        )}
      </main>

      <MobileNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
