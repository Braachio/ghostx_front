'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/supabase-js'

interface Participant {
  id: string
  user_id: string
  nickname: string
  status: string
  joined_at: string
  steam_id?: string
}

interface ParticipationSectionProps {
  eventId: string
  isOwner?: boolean
}

export default function ParticipationSection({ eventId, isOwner = false }: ParticipationSectionProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userInfo, setUserInfo] = useState<{ is_steam_user: boolean } | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // 참가자 목록 가져오기
  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/multis/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
        setParticipantCount(data.total || 0)
      }
    } catch (error) {
      console.error('참가자 목록 가져오기 실패:', error)
    }
  }

  // 현재 사용자의 참가 상태 확인
  const checkParticipationStatus = async () => {
    if (!user) return false
    
    try {
      const response = await fetch(`/api/multis/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        const participants = data.participants || []
        console.log('참가자 목록:', participants)
        console.log('현재 사용자 ID:', user.id)
        const isParticipant = participants.some((p: Participant) => p.user_id === user.id)
        console.log('참가 상태:', isParticipant)
        return isParticipant
      }
    } catch (error) {
      console.error('참가 상태 확인 실패:', error)
    }
    return false
  }

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
        
        // 참가 상태 확인
        const isParticipant = await checkParticipationStatus()
        setIsParticipant(isParticipant)
      }
      
      // 참가자 목록 가져오기
      await fetchParticipants()
      setLoading(false)
    }
    
    checkUser()
  }, [eventId])

  const handleJoin = async () => {
    if (!user) return

    try {
      setJoining(true)
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname: userInfo?.nickname || '익명'
        }),
      })

      if (response.ok) {
        // 참가자 목록을 먼저 새로고침
        await fetchParticipants()
        // 참가 상태를 다시 확인
        const isParticipant = await checkParticipationStatus()
        setIsParticipant(isParticipant)
        alert('참가신청이 완료되었습니다! 이제 투표할 수 있습니다.')
      } else {
        const errorData = await response.json()
        alert(`참가신청 실패: ${errorData.error}`)
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
        // 참가자 목록을 먼저 새로고침
        await fetchParticipants()
        // 참가 상태를 다시 확인
        const isParticipant = await checkParticipationStatus()
        setIsParticipant(isParticipant)
        alert('참가가 취소되었습니다.')
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
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">참가신청</h3>
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">참가 상태 확인 중...</p>
        </div>
      </div>
    )
  }

  if (!user || (userInfo && !userInfo.is_steam_user)) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">참가신청</h3>
        <p className="text-gray-400 text-sm mb-4">
          참가신청을 완료한 사용자만 투표할 수 있습니다.
        </p>
        <div className="text-center">
          <p className="text-gray-400 mb-4">Steam 로그인이 필요합니다.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Steam 로그인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
      <h3 className="text-lg font-semibold text-white mb-4">참가신청</h3>
      <p className="text-gray-400 text-sm mb-4">
        참가신청을 완료한 사용자만 투표할 수 있습니다.
      </p>

      {/* 참가자 수 표시 */}
      <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">현재 참가자</span>
          <span className="text-lg font-bold text-blue-400">{participantCount}명</span>
        </div>
        
        {/* 관리자에게만 Steam ID 목록 표시 */}
        {isOwner && participants.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
            >
              {showDetails ? '숨기기' : 'Steam ID 목록 보기'}
              <span className="text-xs">{showDetails ? '▲' : '▼'}</span>
            </button>
            
            {showDetails && (
              <div className="mt-2 space-y-1">
                {participants.map((participant) => (
                  <div key={participant.id} className="text-xs text-gray-400 flex items-center justify-between">
                    <span>{participant.nickname}</span>
                    <span className="text-gray-500">
                      {participant.steam_id || 'Steam ID 없음'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 참가신청/취소 버튼 */}
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
              {joining ? '참가신청 중...' : '참가신청하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
