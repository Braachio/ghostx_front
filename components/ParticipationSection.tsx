'use client'

import { useEffect, useState, useCallback } from 'react'
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
  onParticipationChange?: () => void // 참가 상태 변경 시 콜백
}

export default function ParticipationSection({ eventId, isOwner = false, onParticipationChange }: ParticipationSectionProps) {
  const [user, setUser] = useState<User | null>(null)
  const [userInfo, setUserInfo] = useState<{ is_steam_user: boolean } | null>(null)
  const [isParticipant, setIsParticipant] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  // 참가자 목록 가져오기
  const fetchParticipants = useCallback(async () => {
    try {
      console.log('참가자 목록 가져오기 시작:', eventId)
      const response = await fetch(`/api/multis/${eventId}/participants`)
      console.log('참가자 목록 API 응답:', { status: response.status, ok: response.ok })
      
      if (response.ok) {
        const data = await response.json()
        console.log('참가자 목록 데이터:', data)
        setParticipants(data.participants || [])
        setParticipantCount(data.total || 0)
        console.log('참가자 수 업데이트:', data.total)
      } else {
        console.error('참가자 목록 API 오류:', response.status, response.statusText)
        // API 오류 시 빈 배열로 설정하여 UI가 깨지지 않도록 함
        setParticipants([])
        setParticipantCount(0)
        console.log('API 오류로 인해 참가자 목록을 빈 배열로 설정')
      }
    } catch (error) {
      console.error('참가자 목록 가져오기 실패:', error)
    }
  }, [eventId])

  // 현재 사용자의 참가 상태 확인 (API를 통해서만)
  const checkParticipationStatus = useCallback(async () => {
    if (!user) return false
    
    try {
      const response = await fetch(`/api/multis/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        const userParticipant = data.participants?.find((p: { user_id: string }) => p.user_id === user.id)
        const isParticipant = !!userParticipant
        console.log('API를 통한 참가 상태 확인:', isParticipant)
        return isParticipant
      } else {
        console.log('참가 상태 확인 API 실패:', response.status)
        return false
      }
    } catch (error) {
      console.error('참가 상태 확인 실패:', error)
      return false
    }
  }, [user, eventId])

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
      }
      
      // 참가자 목록 가져오기 (직접 정의)
      try {
        console.log('참가자 목록 가져오기 시작:', eventId)
        const response = await fetch(`/api/multis/${eventId}/participants`)
        console.log('참가자 목록 API 응답:', { status: response.status, ok: response.ok })
        
        if (response.ok) {
          const data = await response.json()
          console.log('참가자 목록 데이터:', data)
          setParticipants(data.participants || [])
          setParticipantCount(data.total || 0)
          console.log('참가자 수 업데이트:', data.total)
        } else {
          console.error('참가자 목록 API 오류:', response.status, response.statusText)
        }
      } catch (error) {
        console.error('참가자 목록 가져오기 실패:', error)
      }
      
      // 참가 상태 확인 (직접 정의)
      if (user) {
        try {
          const supabase = createClientComponentClient()
          
          const { data: participant, error } = await supabase
            .from('participants')
            .select('id, user_id, status')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .single()

          console.log('Supabase 참가 상태 확인:', { 
            eventId, 
            userId: user.id, 
            participant, 
            error: error?.message,
            errorCode: error?.code 
          })
          
          if (error && error.code !== 'PGRST116') {
            console.error('참가 상태 확인 오류:', error)
          } else {
            const isParticipant = !!participant
            setIsParticipant(isParticipant)
            console.log('초기 참가 상태 확인 완료:', isParticipant)
          }
        } catch (error) {
          console.error('참가 상태 확인 실패:', error)
        }
      }
      
      setLoading(false)
    }
    
    checkUser()
  }, [eventId])

  const handleJoin = async () => {
    if (!user) return

    console.log('참가신청 시작:', { eventId, userId: user.id, nickname: userInfo?.nickname })

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

      console.log('참가신청 응답:', { status: response.status, ok: response.ok })

      if (response.ok) {
        console.log('참가신청 성공, 상태 업데이트 시작')
        // 참가자 목록을 먼저 새로고침
        try {
          const response = await fetch(`/api/multis/${eventId}/participants`)
          if (response.ok) {
            const data = await response.json()
            setParticipants(data.participants || [])
            setParticipantCount(data.total || 0)
          }
        } catch (error) {
          console.error('참가자 목록 새로고침 실패:', error)
        }
        
        // 참가 상태를 다시 확인
        try {
          const supabase = createClientComponentClient()
          const { data: participant } = await supabase
            .from('participants')
            .select('id, user_id, status')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .single()
          
          const isParticipant = !!participant
          setIsParticipant(isParticipant)
          console.log('참가 상태 업데이트 완료:', isParticipant)
        } catch (error) {
          console.error('참가 상태 확인 실패:', error)
        }
        
        alert('참가신청이 완료되었습니다! 이제 투표할 수 있습니다.')
        // 참가 상태 변경 알림
        if (onParticipationChange) {
          onParticipationChange()
        }
      } else {
        const errorData = await response.json()
        console.error('참가신청 실패:', errorData)
        
        // 이미 참가신청이 되어 있다면 상태를 업데이트
        if (errorData.error === '이미 참가 신청하셨습니다.') {
          console.log('이미 참가신청됨, 상태 업데이트')
          // 참가자 목록과 상태를 모두 업데이트
          await fetchParticipants()
          const isParticipant = await checkParticipationStatus()
          setIsParticipant(isParticipant)
          console.log('참가 상태 업데이트 완료:', isParticipant)
          alert('이미 참가신청이 완료되어 있습니다.')
          // 참가 상태 변경 알림
          if (onParticipationChange) {
            onParticipationChange()
          }
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
        console.log('참가 취소 성공, 상태 업데이트 시작')
        // 참가자 목록을 먼저 새로고침
        try {
          const response = await fetch(`/api/multis/${eventId}/participants`)
          if (response.ok) {
            const data = await response.json()
            setParticipants(data.participants || [])
            setParticipantCount(data.total || 0)
          }
        } catch (error) {
          console.error('참가자 목록 새로고침 실패:', error)
        }
        
        // 참가 상태를 다시 확인
        try {
          const supabase = createClientComponentClient()
          const { data: participant } = await supabase
            .from('participants')
            .select('id, user_id, status')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .single()
          
          const isParticipant = !!participant
          setIsParticipant(isParticipant)
          console.log('참가 취소 후 상태 업데이트 완료:', isParticipant)
        } catch (error) {
          console.error('참가 상태 확인 실패:', error)
        }
        alert('참가가 취소되었습니다.')
        // 참가 상태 변경 알림
        if (onParticipationChange) {
          onParticipationChange()
        }
      } else {
        const errorData = await response.json()
        console.error('참가 취소 실패:', errorData)
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
    <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 rounded-xl p-6 border border-gray-600 shadow-lg">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
        <span className="text-2xl">👥</span>
        참가신청
        <div className="ml-auto text-sm text-gray-300 bg-gray-700 px-3 py-1 rounded-full">
          {participantCount}명
        </div>
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        참가신청을 완료한 사용자만 투표할 수 있습니다.
      </p>

      {/* 참가자 수 표시 */}
      <div className="mb-6 p-4 bg-gray-700/30 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold flex items-center gap-2">
            <span className="text-lg">👥</span>
            현재 참가자
          </span>
          <span className="text-xl font-bold text-blue-400">{participantCount}명</span>
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

      {/* 디버그 버튼 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-2 bg-yellow-900/30 border border-yellow-600 rounded">
          <button
            onClick={async () => {
              try {
                const response = await fetch(`/api/debug-participants?eventId=${eventId}`)
                const data = await response.json()
                console.log('디버그 정보:', data)
                alert(`디버그 정보가 콘솔에 출력되었습니다.\n참가 상태: ${data.isParticipant ? '참가함' : '참가 안함'}\n총 참가자: ${data.totalParticipants}명`)
              } catch (error) {
                console.error('디버그 정보 가져오기 실패:', error)
              }
            }}
            className="text-xs text-yellow-400 hover:text-yellow-300 underline"
          >
            🔍 디버그 정보 확인
          </button>
        </div>
      )}

      {/* 참가신청/취소 버튼 */}
      <div className="text-center">
        {isParticipant ? (
          <div className="p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
            <p className="text-green-400 mb-4 flex items-center justify-center gap-2">
              <span className="text-lg">✅</span>
              참가신청 완료
            </p>
            <button 
              onClick={handleLeave}
              disabled={joining}
              className="px-8 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-all font-semibold shadow-lg hover:shadow-red-500/25"
            >
              {joining ? '처리 중...' : '참가 취소'}
            </button>
          </div>
        ) : (
          <div className="p-4 bg-gray-700/20 border border-gray-600/30 rounded-lg">
            <p className="text-gray-400 mb-4 flex items-center justify-center gap-2">
              <span className="text-lg">⏳</span>
              아직 참가신청하지 않았습니다
            </p>
            <button 
              onClick={handleJoin}
              disabled={joining}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all font-semibold shadow-lg hover:shadow-green-500/25"
            >
              {joining ? '참가신청 중...' : '참가 하기'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
