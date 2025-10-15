'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ParticipantButton from '@/components/ParticipantButton'
import VotingPanel from '@/components/VotingPanel'
import VotingResultsPanel from '@/components/VotingResultsPanel'

interface RegularEventDetailPageProps {
  params: Promise<{ game: string; id: string }>
}

// 게임 이름 매핑
const gameNames: Record<string, string> = {
  'iracing': '아이레이싱',
  'assettocorsa': '아세토코르사',
  'gran-turismo7': '그란투리스모7',
  'automobilista2': '오토모빌리스타2',
  'competizione': '컴페티치오네',
  'lemans': '르망얼티밋',
  'f1-25': 'F1 25',
  'ea-wrc': 'EA WRC'
}

export default function RegularEventDetailPage({ params }: RegularEventDetailPageProps) {
  const [game, setGame] = useState<string>('')
  const [eventId, setEventId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [event, setEvent] = useState<any>(null)
  const [eventLoading, setEventLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    start_time: '',
    duration_hours: 1,
    max_participants: 20
  })

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params
        setGame(resolvedParams.game)
        setEventId(resolvedParams.id)
        setLoading(false)
      } catch (error) {
        console.error('Params loading error:', error)
        setLoading(false)
      }
    }
    loadParams()
  }, [params])

  // 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await fetch('/api/me')
        if (response.ok) {
          const data = await response.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
      }
    }
    loadUser()
  }, [])

  // 이벤트 데이터 로드
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return

      try {
        setEventLoading(true)
        const response = await fetch('/api/multis')
        if (response.ok) {
          const data = await response.json()
          const eventData = data.find((e: any) => e.id === eventId)
          if (eventData) {
            setEvent(eventData)
          }
        }
      } catch (error) {
        console.error('이벤트 로드 실패:', error)
      } finally {
        setEventLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  // 이벤트 수정 함수들
  const handleEditStart = () => {
    if (event) {
      setEditForm({
        title: event.title || '',
        description: event.description || '',
        start_time: event.start_time || '',
        duration_hours: event.duration_hours || 1,
        max_participants: event.max_participants || 20
      })
      setIsEditing(true)
    }
  }

  const handleEditSave = async () => {
    try {
      const response = await fetch(`/api/regular-events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        const data = await response.json()
        setEvent(data.event)
        setIsEditing(false)
        alert('이벤트 정보가 수정되었습니다.')
      } else {
        const errorData = await response.json()
        alert(errorData.error || '수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('이벤트 수정 실패:', error)
      alert('이벤트 수정 중 오류가 발생했습니다.')
    }
  }

  const handleEditCancel = () => {
    setIsEditing(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  const gameName = gameNames[game] || game

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-10">
        {/* 헤더 */}
        <div className="text-center">
          <Link 
            href={`/events/regular/${game}`}
            className="inline-flex items-center text-cyan-400 hover:text-cyan-300 mb-4"
          >
            ← {gameName} 정기 이벤트로 돌아가기
          </Link>
          <h1 className="text-4xl font-bold mb-2">정기 이벤트 상세</h1>
          <p className="text-gray-400">{gameName}</p>
        </div>

        {/* 이벤트 정보 */}
        {event ? (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">{event.title}</h2>
              {user && event.author_id === user.id && (
                <div className="flex gap-2">
                  {!isEditing ? (
                    <button
                      onClick={handleEditStart}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
                    >
                      ✏️ 수정
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSave}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-all"
                      >
                        💾 저장
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-all"
                      >
                        ❌ 취소
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isEditing ? (
              // 읽기 모드
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>게임:</strong> {event.game}</p>
                  <p><strong>트랙:</strong> {event.game_track || 'TBD'}</p>
                  <p><strong>클래스:</strong> {event.multi_class || 'TBD'}</p>
                  <p><strong>요일:</strong> {event.multi_day?.join(', ') || 'TBD'}</p>
                </div>
                <div>
                  <p><strong>시작 시간:</strong> {event.start_time || 'TBD'}</p>
                  <p><strong>지속시간:</strong> {event.duration_hours || 'TBD'}시간</p>
                  <p><strong>최대 참가자:</strong> {event.max_participants || 'TBD'}명</p>
                  <p><strong>상태:</strong> {event.is_open ? '활성화' : '비활성화'}</p>
                </div>
              </div>
            ) : (
              // 편집 모드
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">제목</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">시작 시간</label>
                    <input
                      type="time"
                      value={editForm.start_time}
                      onChange={(e) => setEditForm(prev => ({ ...prev, start_time: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">지속시간 (시간)</label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={editForm.duration_hours}
                      onChange={(e) => setEditForm(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">최대 참가자 수</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={editForm.max_participants}
                      onChange={(e) => setEditForm(prev => ({ ...prev, max_participants: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {!isEditing && event.description && (
              <div className="mt-4">
                <p><strong>설명:</strong></p>
                <p className="text-gray-300">{event.description}</p>
              </div>
            )}
          </div>
        ) : eventLoading ? (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
            <p className="text-gray-400">이벤트 정보를 불러오는 중...</p>
          </div>
        ) : (
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 text-center">
            <p className="text-red-400">이벤트를 찾을 수 없습니다.</p>
          </div>
        )}

        {/* 기능 섹션들 - 임시 비활성화 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-4">👥 참가신청</h3>
            <p className="text-gray-400 mb-4 text-sm">
              참가신청을 완료한 사용자만 투표할 수 있습니다.
            </p>
            <ParticipantButton eventId={eventId} />
          </div>
          
          <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
            <VotingPanel 
              regularEventId={eventId}
              weekNumber={undefined} // 현재 주차 자동 계산
              year={undefined} // 현재 연도 자동 계산
            />
          </div>
          
          {user && event && event.author_id === user.id && (
            <VotingResultsPanel eventId={eventId} />
          )}
        </div>

        {/* 디버그 정보 */}
        <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700">
          <h4 className="text-sm font-bold text-gray-300 mb-2">디버그 정보</h4>
          <p className="text-xs text-gray-500">게임: {game}</p>
          <p className="text-xs text-gray-500">이벤트 ID: {eventId}</p>
          <p className="text-xs text-gray-500">사용자: {user ? user.id : '로그인되지 않음'}</p>
          <p className="text-xs text-gray-500">이벤트 로딩: {eventLoading ? '로딩 중...' : '완료'}</p>
          <p className="text-xs text-gray-500">이벤트 데이터: {event ? '있음' : '없음'}</p>
        </div>
      </div>
    </div>
  )
}