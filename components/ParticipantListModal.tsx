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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950/95 border border-slate-900 rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,23,42,0.8)]">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-900/80">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Participant</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-100">참가자 목록</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <div className="px-6 md:px-8 py-6 overflow-y-auto max-h-[55vh]">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-900 bg-slate-950/40 px-6 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-slate-300" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">로딩 중…</span>
            </div>
          ) : participants.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-12 text-center text-sm text-slate-500">
              아직 참가자가 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {participants.map((participant) => (
                <div key={participant.id} className="rounded-2xl border border-slate-900 bg-slate-950/60 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 border border-slate-800 text-slate-200 text-base font-semibold">
                          {participant.nickname.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-slate-100 text-sm font-semibold">{participant.nickname}</p>
                          <p className="text-slate-500 text-xs font-medium">
                            Steam ID&nbsp;
                            <span className="text-slate-300">{participant.steam_id || '없음'}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                          participant.status === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-200'
                        }`}
                      >
                        {participant.status === 'confirmed' ? '확정' : '대기'}
                      </span>
                      
                      {isOwner && (
                        <div className="flex gap-2">
                          {participant.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(participant.id, 'confirmed')}
                              disabled={actionLoading === participant.id}
                              className="inline-flex items-center justify-center rounded-lg bg-slate-100/90 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-white transition-colors disabled:opacity-50"
                            >
                              {actionLoading === participant.id ? '처리중…' : '확정'}
                            </button>
                          )}
                          {participant.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(participant.id, 'pending')}
                              disabled={actionLoading === participant.id}
                              className="inline-flex items-center justify-center rounded-lg border border-slate-800 bg-transparent px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-slate-900 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === participant.id ? '처리중…' : '대기로'}
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

        <div className="flex items-center justify-between px-6 py-5 border-t border-slate-900 bg-slate-950">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            총 {participants.length}명 참가
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-transparent px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}