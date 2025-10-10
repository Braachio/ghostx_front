'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

type Participant = {
  id: string
  user_id: string
  nickname: string
  joined_at: string
  status: 'confirmed' | 'pending'
}

type ParticipantsData = {
  participants: Participant[]
  total: number
  confirmed: number
  pending: number
}

interface ParticipantsListProps {
  eventId: string
}

export default function ParticipantsList({ eventId }: ParticipantsListProps) {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { nickname?: string; full_name?: string } } | null>(null)
  const [participantsData, setParticipantsData] = useState<ParticipantsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [isJoined, setIsJoined] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [customNickname, setCustomNickname] = useState('')

  // 4자리 랜덤 태그 생성 함수
  const generateTag = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  // 사용자 기본 닉네임 가져오기
  const getUserDisplayName = () => {
    // 사용자가 입력한 닉네임이 있으면 사용, 없으면 'ㅇㅇ'으로 시작
    return customNickname.trim() || `ㅇㅇ#${generateTag()}`
  }

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      console.log(`참가자 목록 조회 시작 - Event ID: ${eventId}`)
      
      const response = await fetch(`/api/multis/${eventId}/participants`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '참가자 목록을 불러올 수 없습니다.')
      }
      
      const data = await response.json()
      console.log('참가자 목록 데이터:', data)
      setParticipantsData(data)
      
      // 현재 사용자가 참가자인지 확인
      if (user && data.participants) {
        const userParticipant = data.participants.find((p: Participant) => p.user_id === user.id)
        setIsJoined(!!userParticipant)
        console.log('사용자 참가 상태:', !!userParticipant, 'User ID:', user.id)
      }
    } catch (error) {
      console.error('참가자 목록 조회 실패:', error)
      setError(error instanceof Error ? error.message : '참가자 목록을 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }, [eventId, user])

  // Supabase 클라이언트로 사용자 정보 가져오기
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClientComponentClient<Database>()
        const { data: { user }, error } = await supabase.auth.getUser()
        if (!error && user) {
          setUser(user)
        }
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error)
      }
    }
    getUser()
  }, [])

  useEffect(() => {
    if (eventId) {
      fetchParticipants()
    }
  }, [eventId, fetchParticipants])

  const handleJoin = async () => {
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    if (isJoined) {
      await handleLeave()
      return
    }

    try {
      setJoining(true)
      const displayName = getUserDisplayName()
      console.log(`참가 신청 시작 - Event ID: ${eventId}, Nickname: ${displayName}`)
      
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: displayName }),
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '참가 신청에 실패했습니다.')
      }

      console.log('참가 신청 성공:', result)
      alert('참가 신청이 완료되었습니다!')
      fetchParticipants() // 목록 새로고침
    } catch (error) {
      console.error('참가 신청 실패:', error)
      alert(error instanceof Error ? error.message : '참가 신청에 실패했습니다.')
    } finally {
      setJoining(false)
    }
  }

  const handleLeave = async () => {
    try {
      setJoining(true)
      console.log(`참가 취소 시작 - Event ID: ${eventId}`)
      
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'DELETE',
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '참가 취소에 실패했습니다.')
      }

      console.log('참가 취소 성공:', result)
      alert('참가가 취소되었습니다.')
      fetchParticipants() // 목록 새로고침
    } catch (error) {
      console.error('참가 취소 실패:', error)
      alert(error instanceof Error ? error.message : '참가 취소에 실패했습니다.')
    } finally {
      setJoining(false)
    }
  }

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '오늘'
    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    return date.toLocaleDateString('ko-KR')
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">👥</div>
          <h3 className="text-lg font-semibold text-white">참가자</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black border border-red-500/30 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-2xl">👥</div>
          <h3 className="text-lg font-semibold text-white">참가자</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-red-400 mb-2">⚠️ 오류 발생</div>
          <p className="text-gray-300 text-sm">{error}</p>
          <button 
            onClick={fetchParticipants}
            className="mt-4 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="text-2xl">👥</div>
        <h3 className="text-lg font-semibold text-white">참가자</h3>
        <div className="flex items-center gap-2 ml-auto">
          <span className="px-2 py-1 bg-green-600/20 text-green-300 rounded-full text-xs font-medium">
            확정 {participantsData?.confirmed || 0}명
          </span>
          {participantsData && participantsData.pending > 0 && (
            <span className="px-2 py-1 bg-yellow-600/20 text-yellow-300 rounded-full text-xs font-medium">
              대기 {participantsData.pending}명
            </span>
          )}
        </div>
      </div>

      {/* 참가 신청/취소 */}
      {user && (
        <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600">
          {isJoined ? (
            <div className="flex items-center justify-between">
              <span className="text-green-400 font-medium">✅ 참가 신청 완료</span>
              <button
                onClick={handleLeave}
                disabled={joining}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all text-sm"
              >
                {joining ? '취소 중...' : '참가 취소'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  참가 닉네임
                </label>
                <input
                  type="text"
                  value={customNickname}
                  onChange={(e) => setCustomNickname(e.target.value)}
                  placeholder="닉네임 입력 (미입력시 ㅇㅇ#1234)"
                  maxLength={20}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">
                  💡 F1 25의 경우 인게임 닉네임과 동일하게 입력하세요
                </p>
              </div>
              <button
                onClick={handleJoin}
                disabled={joining}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {joining ? '신청 중...' : '🏁 참가 신청'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* 참가자 목록 */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {participantsData?.participants && participantsData.participants.length > 0 ? (
          participantsData.participants.map((participant) => (
            <div
              key={participant.id}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                participant.status === 'confirmed' 
                  ? 'bg-green-600/10 border-green-600/30' 
                  : 'bg-yellow-600/10 border-yellow-600/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  participant.status === 'confirmed'
                    ? 'bg-green-600 text-white'
                    : 'bg-yellow-600 text-white'
                }`}>
                  {participant.nickname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium text-white">{participant.nickname}</div>
                  <div className="text-xs text-gray-400">
                    {formatJoinDate(participant.joined_at)}
                  </div>
                </div>
              </div>
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                participant.status === 'confirmed'
                  ? 'bg-green-600/20 text-green-300'
                  : 'bg-yellow-600/20 text-yellow-300'
              }`}>
                {participant.status === 'confirmed' ? '확정' : '대기'}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🚗</div>
            <p>아직 참가자가 없습니다</p>
            <p className="text-sm">첫 번째 참가자가 되어보세요!</p>
          </div>
        )}
      </div>

      {/* 참가자 통계 */}
      {participantsData && participantsData.total > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>총 참가자</span>
            <span className="font-medium text-white">{participantsData.total}명</span>
          </div>
        </div>
      )}
    </div>
  )
}
