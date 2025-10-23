'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { User } from '@supabase/supabase-js'

interface ParticipationButtonProps {
  eventId: string
  isOwner?: boolean
  onParticipationChange?: () => void
}

export default function ParticipationButton({ 
  eventId, 
  isOwner = false, 
  onParticipationChange 
}: ParticipationButtonProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [joining, setJoining] = useState(false)
  const [loading, setLoading] = useState(true)
  const [participantCount, setParticipantCount] = useState(0)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClientComponentClient<Database>()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    checkUser()
  }, [])

  useEffect(() => {
    if (eventId && user) {
      fetchParticipantCount()
      checkParticipationStatus()
    } else if (!user && !loading) {
      setParticipantCount(0)
      setIsParticipant(false)
    }
  }, [eventId, user, loading])

  const fetchParticipantCount = async () => {
    try {
      const response = await fetch(`/api/multis/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipantCount(data.total || 0)
      }
    } catch (error) {
      console.error('참가자 수 가져오기 실패:', error)
    }
  }

  const checkParticipationStatus = async () => {
    if (!user) return false
    
    try {
      const response = await fetch(`/api/multis/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        const userParticipant = data.participants?.find((p: { user_id: string }) => p.user_id === user.id)
        const isParticipant = !!userParticipant
        setIsParticipant(isParticipant)
        return isParticipant
      }
      return false
    } catch (error) {
      console.error('참가 상태 확인 실패:', error)
      return false
    }
  }

  const handleJoin = async () => {
    if (!user) return

    try {
      setJoining(true)
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: user.user_metadata.nickname || user.email?.split('@')[0] || '익명' }),
      })

      if (response.ok) {
        setIsParticipant(true)
        await fetchParticipantCount()
        alert('참가신청이 완료되었습니다! 이제 투표할 수 있습니다.')
        onParticipationChange?.()
      } else {
        const errorData = await response.json()
        if (errorData.error === '이미 참가 신청하셨습니다.') {
          setIsParticipant(true)
          await fetchParticipantCount()
          alert('이미 참가신청이 완료되어 있습니다.')
          onParticipationChange?.()
        } else {
          alert(`참가신청 실패: ${errorData.error}`)
        }
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
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setIsParticipant(false)
        await fetchParticipantCount()
        alert('참가가 취소되었습니다.')
        onParticipationChange?.()
      } else {
        const errorData = await response.json()
        alert(`참가취소 실패: ${errorData.error}`)
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
      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-xl p-6 border border-gray-600 shadow-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">참가 상태 확인 중...</p>
        </div>
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
        
        <div className="text-sm text-gray-400">
          참가자: {participantCount}명
        </div>
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
        
        <div className="text-sm text-gray-400">
          참가자: {participantCount}명
        </div>
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
      
      <div className="text-sm text-gray-400">
        참가자: {participantCount}명
      </div>
    </div>
  )
}
