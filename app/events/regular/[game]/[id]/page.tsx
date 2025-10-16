'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import ParticipationSection from '@/components/ParticipationSection'
import TrackVotingPanel from '@/components/TrackVotingPanel'

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
  const [event, setEvent] = useState<{
    id: string
    title: string
    description?: string
    game: string
    game_track?: string
    multi_class?: string
    multi_day?: string[]
    multi_time?: string
    duration_hours?: number
    is_open: boolean
    author_id: string
    link?: string
    voting_enabled?: boolean
  } | null>(null)
  const [eventLoading, setEventLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    multi_time: '',
    duration_hours: 1,
    link: '',
    game_track: '',
    multi_class: ''
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
        console.log('이벤트 로드 시작 - ID:', eventId)
        setEventLoading(true)
        const response = await fetch('/api/multis')
        console.log('이벤트 목록 응답 상태:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('이벤트 목록 데이터:', data)
          const eventData = data.find((e: { id: string }) => e.id === eventId)
          console.log('찾은 이벤트 데이터:', eventData)
          
          if (eventData) {
            setEvent(eventData)
          } else {
            console.log('해당 ID의 이벤트를 찾을 수 없음:', eventId)
          }
        } else {
          console.error('이벤트 목록 로드 실패:', response.status)
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
        multi_time: event.multi_time || '',
        duration_hours: event.duration_hours || 1,
        link: event.link || '',
        game_track: event.game_track || '',
        multi_class: event.multi_class || ''
      })
      setIsEditing(true)
    }
  }

  const handleEditSave = async () => {
    try {
      console.log('이벤트 수정 요청:', { eventId, editForm })
      
      const response = await fetch(`/api/regular-events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      console.log('수정 응답 상태:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('수정 성공 데이터:', data)
        setEvent(data.event)
        setIsEditing(false)
        alert('이벤트 정보가 수정되었습니다.')
      } else {
        const errorData = await response.json()
        console.error('수정 실패:', errorData)
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

  const handleDelete = async () => {
    if (!event) return

    const confirmMessage = `"${event.title}" 이벤트를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 관련된 모든 데이터(투표, 참가자 등)가 함께 삭제됩니다.`
    
    if (!confirm(confirmMessage)) {
      return
    }

    try {
      console.log('이벤트 삭제 요청:', eventId)
      
      const response = await fetch(`/api/regular-events/${eventId}`, {
        method: 'DELETE'
      })

      console.log('삭제 응답 상태:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('삭제 성공 데이터:', data)
        alert(data.message || '이벤트가 삭제되었습니다.')
        // 이벤트 목록 페이지로 리다이렉트
        window.location.href = `/events/regular/${game}`
      } else {
        const errorData = await response.json()
        console.error('삭제 실패:', errorData)
        alert(errorData.error || '삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('이벤트 삭제 실패:', error)
      alert('이벤트 삭제 중 오류가 발생했습니다.')
    }
  }

  // 참가 상태 변경 시 투표 컴포넌트 새로고침

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
          <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-8 shadow-2xl border border-gray-600 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {event.title}
                </h2>
                <div className="flex items-center gap-4 text-gray-400">
                  <span>{event.game}</span>
                  <span>•</span>
                  <span>{event.multi_day?.join(', ') || 'TBD'}</span>
                </div>
              </div>
              {user && event.author_id === user.id && (
                <div className="flex gap-3">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={handleEditStart}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        수정
                      </button>
                      <button
                        onClick={handleDelete}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                      >
                        삭제
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleEditSave}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isEditing ? (
              // 읽기 모드 - 단순한 정보 표시
              <div className="space-y-6">
                {/* 기본 정보 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">트랙</p>
                    <p className="text-white font-medium">{event.game_track || 'TBD'}</p>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">클래스</p>
                    <p className="text-white font-medium">{event.multi_class || 'TBD'}</p>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">시작 시간</p>
                    <p className="text-white font-medium">{event.multi_time || 'TBD'}</p>
                  </div>
                  
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-1">지속시간</p>
                    <p className="text-white font-medium">{event.duration_hours ? `${event.duration_hours}시간` : 'TBD'}</p>
                  </div>
                </div>
                
                {/* 설명 섹션 */}
                {event.description && (
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm mb-2">설명</p>
                    {event.link ? (
                      <a 
                        href={event.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline leading-relaxed transition-colors"
                      >
                        {event.description}
                      </a>
                    ) : (
                      <p className="text-gray-200 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // 편집 모드 - 단순한 입력 폼
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">트랙</label>
                    <input
                      type="text"
                      value={editForm.game_track || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, game_track: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="트랙명을 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">클래스</label>
                    <input
                      type="text"
                      value={editForm.multi_class || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, multi_class: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                      placeholder="차량 클래스를 입력하세요"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">시작 시간</label>
                    <input
                      type="time"
                      value={editForm.multi_time}
                      onChange={(e) => setEditForm(prev => ({ ...prev, multi_time: e.target.value }))}
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
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">설명</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                    placeholder="이벤트에 대한 상세 설명을 입력하세요"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">링크 (참여/원문)</label>
                  <input
                    type="url"
                    value={editForm.link}
                    onChange={(e) => setEditForm(prev => ({ ...prev, link: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                    placeholder="https://gall.dcinside.com/..."
                  />
                  <p className="text-gray-400 text-sm mt-1">
                    링크가 있으면 설명이 클릭 가능한 링크로 표시됩니다.
                  </p>
                </div>
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

        {/* 기능 섹션들 */}
        <div className="space-y-6">

          {/* 참가신청 섹션 */}
          <ParticipationSection 
            eventId={eventId} 
            isOwner={user && event && event.author_id === user.id || false}
          />

          {/* 투표 섹션 */}
          {event && (
            <div className="space-y-4">
              {event.voting_enabled && (
                <TrackVotingPanel 
                  regularEventId={eventId}
                  isOwner={user && event && event.author_id === user.id || false}
                />
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}