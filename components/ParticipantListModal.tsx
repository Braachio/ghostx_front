'use client'

import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'

interface Participant {
  id: string
  user_id: string
  nickname: string
  status: 'pending' | 'confirmed' | 'cancelled'
  steam_id: string | null
  joined_at: string
}

interface ParticipantListModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  isOwner?: boolean
}

export default function ParticipantListModal({ 
  isOpen, 
  onClose, 
  eventId, 
  isOwner = false 
}: ParticipantListModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && eventId) {
      fetchParticipants()
    }
  }, [isOpen, eventId])

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/multis/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
      } else {
        setError('참가자 목록을 불러올 수 없습니다.')
      }
    } catch (error) {
      console.error('참가자 목록 가져오기 실패:', error)
      setError('참가자 목록을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (participantId: string) => {
    try {
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, status: 'confirmed' }),
      })

      if (response.ok) {
        await fetchParticipants()
        alert('참가자가 승인되었습니다.')
      } else {
        const errorData = await response.json()
        alert(`참가자 승인 실패: ${errorData.error}`)
      }
    } catch (error) {
      console.error('참가자 승인 실패:', error)
      alert('참가자 승인 중 오류가 발생했습니다.')
    }
  }

  const handleReject = async (participantId: string) => {
    try {
      const response = await fetch(`/api/multis/${eventId}/participants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, status: 'cancelled' }),
      })

      if (response.ok) {
        await fetchParticipants()
        alert('참가자가 거절되었습니다.')
      } else {
        const errorData = await response.json()
        alert(`참가자 거절 실패: ${errorData.error}`)
      }
    } catch (error) {
      console.error('참가자 거절 실패:', error)
      alert('참가자 거절 중 오류가 발생했습니다.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-600 shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* 헤더 */}
        <div className="bg-gray-800 border-b border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-3xl">👥</span>
              참가자 목록
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-gray-400 mt-2">
            총 {participants.length}명의 참가자가 있습니다.
          </p>
        </div>

        {/* 내용 */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">참가자 목록을 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchParticipants}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                다시 시도
              </button>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">아직 참가자가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div 
                  key={participant.id} 
                  className="flex items-center justify-between bg-gray-800/50 p-4 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">
                      {participant.status === 'confirmed' ? '✅' : 
                       participant.status === 'cancelled' ? '❌' : '⏳'}
                    </span>
                    <div>
                      <div className="text-white font-semibold">{participant.steam_id || participant.nickname}</div>
                      <div className="text-gray-500 text-xs">
                        {new Date(participant.joined_at).toLocaleString('ko-KR', { 
                          dateStyle: 'short', 
                          timeStyle: 'short' 
                        })}
                      </div>
                      {participant.steam_id && (
                        <a 
                          href={`https://steamcommunity.com/profiles/${participant.steam_id}`} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-400 hover:underline text-sm"
                        >
                          Steam 프로필 보기
                        </a>
                      )}
                    </div>
                  </div>
                  
                  {isOwner && participant.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(participant.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(participant.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                      >
                        거절
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="bg-gray-800 border-t border-gray-600 p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              ✅ 승인됨: {participants.filter(p => p.status === 'confirmed').length}명
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
