'use client'

import { useState, useEffect } from 'react'

interface Participant {
  id: string
  user_id: string
  nickname: string
  steam_id: string | null
  status: string
  created_at: string
}

interface ParticipantListModalProps {
  isOpen: boolean
  onClose: () => void
  eventId: string
  isOwner: boolean
}

export default function ParticipantListModal({ isOpen, onClose, eventId, isOwner }: ParticipantListModalProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && eventId) {
      fetchParticipants()
    }
  }, [isOpen, eventId, fetchParticipants])

  const fetchParticipants = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/multis/${eventId}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipants(data.participants || [])
      }
    } catch (error) {
      console.error('참가자 목록 가져오기 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (participantId: string, newStatus: string) => {
    setActionLoading(participantId)
    try {
      const response = await fetch(`/api/multis/${eventId}/participants/${participantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        setParticipants(prev => 
          prev.map(p => 
            p.id === participantId ? { ...p, status: newStatus } : p
          )
        )
      } else {
        const errorData = await response.json()
        alert(errorData.error || '상태 변경에 실패했습니다.')
      }
    } catch (error) {
      console.error('상태 변경 오류:', error)
      alert('상태 변경 중 오류가 발생했습니다.')
    } finally {
      setActionLoading(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">참가자 목록</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-400">로딩 중...</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              아직 참가자가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {participant.nickname.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{participant.nickname}</p>
                          <p className="text-gray-400 text-sm">
                            Steam ID: {participant.steam_id || '없음'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        participant.status === 'confirmed' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-yellow-600 text-white'
                      }`}>
                        {participant.status === 'confirmed' ? '확정' : '대기'}
                      </span>
                      
                      {isOwner && (
                        <div className="flex gap-2">
                          {participant.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(participant.id, 'confirmed')}
                              disabled={actionLoading === participant.id}
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                            >
                              {actionLoading === participant.id ? '처리중...' : '확정'}
                            </button>
                          )}
                          {participant.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(participant.id, 'pending')}
                              disabled={actionLoading === participant.id}
                              className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700 disabled:opacity-50"
                            >
                              {actionLoading === participant.id ? '처리중...' : '대기로'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="text-gray-400 text-sm">
            총 {participants.length}명 참가
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
  )
}