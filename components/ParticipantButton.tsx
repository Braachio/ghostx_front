'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'

interface ParticipantButtonProps {
  eventId: string
}

export default function ParticipantButton({ eventId }: ParticipantButtonProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userInfo, setUserInfo] = useState<{ is_steam_user: boolean } | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // 사용자 정보 가져오기 (Steam 사용자 여부 확인)
      if (user) {
        try {
          const response = await fetch('/api/me')
          if (response.ok) {
            const data = await response.json()
            setUserInfo(data.user)
          }
        } catch (error) {
          console.error('사용자 정보 가져오기 실패:', error)
        }
        
        try {
          const { data, error } = await supabase
            .from('multi_participants')
            .select('id')
            .eq('multi_id', eventId)
            .eq('user_id', user.id)
            .single()

          setIsParticipant(!!data && !error)
        } catch (error) {
          console.error('참가 상태 확인 실패:', error)
          setIsParticipant(false)
        }
      }
      
      setLoading(false)
    }
    
    checkUser()
  }, [eventId])

  const handleJoin = async () => {
    if (!user) return

    try {
      setJoining(true)
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('multi_participants')
        .insert({
          multi_id: eventId,
          user_id: user.id,
          joined_at: new Date().toISOString()
        })

      if (error) {
        console.error('참가신청 실패:', error)
        alert(`참가신청 실패: ${error.message}`)
      } else {
        setIsParticipant(true)
        alert('참가신청이 완료되었습니다! 이제 투표할 수 있습니다.')
      }
    } catch (error) {
      console.error('참가신청 오류:', error)
      alert('참가신청 중 오류가 발생했습니다.')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user) return

    try {
      setJoining(true)
      const supabase = createClientComponentClient()
      
      const { error } = await supabase
        .from('multi_participants')
        .delete()
        .eq('multi_id', eventId)
        .eq('user_id', user.id)

      if (error) {
        console.error('참가취소 실패:', error)
        alert(`참가취소 실패: ${error.message}`)
      } else {
        setIsParticipant(false)
        alert('참가가 취소되었습니다.')
      }
    } catch (error) {
      console.error('참가취소 오류:', error)
      alert('참가취소 중 오류가 발생했습니다.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-400 text-sm">참가 상태 확인 중...</p>
      </div>
    )
  }

  if (!user || (userInfo && !userInfo.is_steam_user)) {
    return (
      <div className="text-center">
        <p className="text-gray-400 mb-4">Steam 로그인이 필요합니다.</p>
        <button 
          onClick={() => window.location.href = '/login'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Steam 로그인
        </button>
      </div>
    )
  }

  return (
    <div className="text-center">
      {isParticipant ? (
        <div>
          <p className="text-green-400 mb-4">✅ 참가신청 완료</p>
          <button 
            onClick={handleLeave}
            disabled={joining}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {joining ? '처리 중...' : '참가 취소'}
          </button>
        </div>
      ) : (
        <div>
          <p className="text-gray-400 mb-4">아직 참가신청하지 않았습니다.</p>
          <button 
            onClick={handleJoin}
            disabled={joining}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
          >
            {joining ? '참가신청 중...' : '참가 하기'}
          </button>
        </div>
      )}
    </div>
  )
}
