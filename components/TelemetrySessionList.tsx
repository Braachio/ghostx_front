'use client'

import { useState, useEffect } from 'react'
import type { TelemetrySession } from '@/lib/iracingTypes'

interface TelemetrySessionListProps {
  onSessionSelect: (sessionId: string) => void
  selectedSessionId?: string | null
}

export default function TelemetrySessionList({ onSessionSelect, selectedSessionId }: TelemetrySessionListProps) {
  const [sessions, setSessions] = useState<(TelemetrySession & { actual_sample_count?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)

  const fetchSessions = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/iracing/telemetry/sessions?limit=50')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '세션 목록 조회 실패')
      }

      setSessions(data.sessions || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation() // 세션 선택 이벤트 방지
    
    if (!confirm('정말 이 세션을 삭제하시겠습니까? 관련된 모든 데이터가 영구적으로 삭제됩니다.')) {
      return
    }

    setDeletingSessionId(sessionId)
    try {
      const res = await fetch(`/api/iracing/telemetry/sessions/${sessionId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || '세션 삭제 실패')
      }

      // 삭제된 세션이 선택된 세션이면 선택 해제
      if (selectedSessionId === sessionId) {
        onSessionSelect(null)
      }

      // 세션 목록 새로고침
      await fetchSessions()
    } catch (e) {
      alert(e instanceof Error ? e.message : '세션 삭제 중 오류가 발생했습니다.')
    } finally {
      setDeletingSessionId(null)
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-300">
        {error}
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 text-center">
        <div className="text-6xl mb-4 opacity-50">📊</div>
        <h3 className="text-xl font-semibold text-gray-300 mb-2">텔레메트리 세션이 없습니다</h3>
        <p className="text-gray-500">Mock 데이터를 생성하거나 iRacing SDK로 데이터를 수집해보세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {sessions.map((session) => (
        <div
          key={session.id}
          className={`group relative w-full rounded-lg border transition-all ${
            selectedSessionId === session.id
              ? 'bg-cyan-900/40 border-cyan-600 shadow-lg shadow-cyan-900/20'
              : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800/60'
          }`}
        >
          <button
            onClick={() => onSessionSelect(session.id!)}
            className="w-full text-left p-3 pr-10"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold text-white text-sm">
                {session.session_name || '이름 없는 세션'}
              </div>
              <div className="text-xs text-gray-400">
                {session.start_time ? new Date(session.start_time).toLocaleDateString('ko-KR') : 'N/A'}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
              <div>
                <span className="text-gray-500">트랙:</span> {session.track_name || 'N/A'}
              </div>
              <div>
                <span className="text-gray-500">차량:</span> {session.car_name || 'N/A'}
              </div>
              <div>
                <span className="text-gray-500">지속:</span>{' '}
                {session.duration_seconds ? `${session.duration_seconds.toFixed(1)}초` : 'N/A'}
              </div>
              <div>
                <span className="text-gray-500">샘플:</span> {(session.actual_sample_count || session.sample_count || 0).toLocaleString()}개
              </div>
            </div>
          </button>
          <button
            onClick={(e) => handleDelete(session.id!, e)}
            disabled={deletingSessionId === session.id}
            className="absolute top-3 right-3 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="세션 삭제"
          >
            {deletingSessionId === session.id ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      ))}
    </div>
  )
}

