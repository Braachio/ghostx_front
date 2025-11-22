'use client'

import { useState, useEffect, useCallback } from 'react'

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

  const fetchParticipants = useCallback(async () => {
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
  }, [eventId])

  useEffect(() => {
    if (isOpen && eventId) {
      fetchParticipants()
    }
  }, [isOpen, eventId, fetchParticipants])

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
        alert('상태가 변경되었습니다.')
      } else {
        // 응답이 JSON인지 확인
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json()
          alert(errorData.error || '상태 변경에 실패했습니다.')
        } else {
          const errorText = await response.text()
          console.error('API 응답 오류:', errorText)
          alert('상태 변경에 실패했습니다. 서버 오류가 발생했습니다.')
        }
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">참가자 목록</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[55vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-gray-300" />
              <span className="text-sm text-gray-400">로딩 중…</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="border border-dashed border-gray-700 bg-gray-800 px-4 py-12 text-center text-sm text-gray-400 rounded">
              아직 참가자가 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {participants.map((participant) => (
                <div key={participant.id} className="border border-gray-700 bg-gray-800 p-4 rounded">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 text-gray-200 text-sm font-semibold">
                        {participant.nickname.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{participant.nickname}</p>
                        <p className="text-gray-400 text-xs">
                          Steam ID: {participant.steam_id || '없음'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          participant.status === 'confirmed'
                            ? 'bg-green-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}
                      >
                        {participant.status === 'confirmed' ? '확정' : '대기'}
                      </span>
                      
                      {isOwner && (
                        <>
                          {participant.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(participant.id, 'confirmed')}
                              disabled={actionLoading === participant.id}
                              className="px-3 py-1 bg-white text-gray-900 text-xs font-medium rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === participant.id ? '처리중…' : '확정'}
                            </button>
                          )}
                          {participant.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(participant.id, 'pending')}
                              disabled={actionLoading === participant.id}
                              className="px-3 py-1 border border-gray-700 bg-transparent text-xs text-gray-200 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === participant.id ? '처리중…' : '대기로'}
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800">
          <div className="text-sm text-gray-400">
            총 {participants.length}명 참가
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-700 bg-transparent text-sm text-gray-200 rounded hover:bg-gray-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}