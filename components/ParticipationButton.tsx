'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'

interface ParticipationButtonProps {
  eventId: string
  onParticipationChange?: () => void
}

export default function ParticipationButton({ eventId, onParticipationChange }: ParticipationButtonProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [joining, setJoining] = useState(false)
  const [loading, setLoading] = useState(true)
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    const checkUserAndParticipation = async () => {
      setLoading(true)
      const supabase = createClientComponentClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        // Fetch participant count
        try {
          const response = await fetch(`/api/multis/${eventId}/participants`)
          if (response.ok) {
            const data = await response.json()
            setParticipantCount(data.total || 0)
            const userParticipant = data.participants?.find((p: { user_id: string }) => p.user_id === user.id)
            setIsParticipant(!!userParticipant)
          }
        } catch (error) {
          console.error('참가자 수 및 상태 가져오기 실패:', error)
        }
      } else {
        setParticipantCount(0)
        setIsParticipant(false)
      }
      setLoading(false)
    }
    checkUserAndParticipation()
  }, [eventId, user?.id]) // user.id를 의존성 배열에 추가하여 사용자 변경 시 재실행

  const handleJoin = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    try {
      setJoining(true)
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: user.user_metadata.nickname || user.email?.split('@')[0] || '익명' }),
      })

      if (response.ok) {
        alert('참가 신청이 완료되었습니다!')
        setIsParticipant(true)
        if (onParticipationChange) onParticipationChange()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '참가 신청에 실패했습니다.')
      }
    } catch (error) {
      console.error('참가 신청 오류:', error)
      alert(error instanceof Error ? error.message : '참가 신청 중 오류가 발생했습니다.')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user) return

    try {
      setJoining(true)
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('참가 신청이 취소되었습니다.')
        setIsParticipant(false)
        if (onParticipationChange) onParticipationChange()
      } else {
        const errorData = await response.json()
        alert(errorData.error || '참가 취소에 실패했습니다.')
      }
    } catch (error) {
      console.error('참가 취소 오류:', error)
      alert(error instanceof Error ? error.message : '참가 취소 중 오류가 발생했습니다.')
    } finally {
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        <span className="text-gray-400 text-sm">로딩 중...</span>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center gap-4">
        
        <button 
          onClick={() => window.location.href = '/login'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
        >
          <span className="text-lg">🔐</span>
          Steam 로그인하기
        </button>
        
      </div>
    )
  }

  // Steam 사용자인지 확인
  const isSteamUser = user.app_metadata?.provider === 'steam' || 
                    user.user_metadata?.provider === 'steam' ||
                    user.identities?.some(identity => identity.provider === 'steam')

  if (!isSteamUser) {
    return (
      <div className="flex items-center justify-center gap-4">

        <button 
          onClick={() => window.location.href = '/login'}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center gap-2"
        >
          <span className="text-lg">🔐</span>
          Steam 로그인하기
        </button>
        
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center gap-4">
      {isParticipant ? (
        <button 
          onClick={handleLeave}
          disabled={joining}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-semibold flex items-center gap-2"
        >
          <span className="text-lg">✅</span>
          {joining ? '처리 중...' : '참가 취소'}
        </button>
      ) : (
        <button 
          onClick={handleJoin}
          disabled={joining}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all font-semibold flex items-center gap-2"
        >
          <span className="text-lg">👥</span>
          {joining ? '참가신청 중...' : '참가신청하기'}
        </button>
      )}
      
    </div>
  )
}