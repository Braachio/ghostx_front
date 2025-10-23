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
      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-lg p-4 border border-gray-600 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-xl">👥</span>
          참가신청
        </h3>
        <div className="text-center">
          <p className="text-gray-400 mb-3 text-sm">참가신청을 하려면 Steam 로그인이 필요합니다.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            Steam 로그인하기
          </button>
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
      <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-lg p-4 border border-gray-600 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span className="text-xl">👥</span>
          참가신청
        </h3>
        <div className="text-center">
          <p className="text-gray-400 mb-2 text-sm">참가신청을 하려면 Steam 로그인이 필요합니다.</p>
          <p className="text-gray-500 text-xs mb-3">현재 익명으로 로그인되어 있습니다.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
          >
            Steam 로그인하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-lg p-4 border border-gray-600 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <span className="text-xl">👥</span>
        참가신청
        <div className="ml-auto text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded-full">
          {participantCount}명
        </div>
      </h3>

      <div className="text-center">
        {isParticipant ? (
          <div className="p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
            <p className="text-green-400 mb-3 flex items-center justify-center gap-2 text-sm">
              <span className="text-base">✅</span>
              참가신청 완료
            </p>
            <button 
              onClick={handleLeave}
              disabled={joining}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-semibold text-sm"
            >
              {joining ? '처리 중...' : '참가 취소'}
            </button>
          </div>
        ) : (
          <div className="p-3 bg-gray-700/20 border border-gray-600/30 rounded-lg">
            <p className="text-gray-400 mb-3 flex items-center justify-center gap-2 text-sm">
              <span className="text-base">⏳</span>
              아직 참가신청하지 않았습니다
            </p>
            <button 
              onClick={handleJoin}
              disabled={joining}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all font-semibold text-sm"
            >
              {joining ? '참가신청 중...' : '참가신청하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
