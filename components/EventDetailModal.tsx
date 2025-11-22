'use client'

import { useState, useEffect, useCallback } from 'react'
import ParticipationButton from '@/components/ParticipationButton'
import ParticipantListModal from '@/components/ParticipantListModal'
import TrackVotingModal from '@/components/TrackVotingModal'
import EventDescriptionModal from '@/components/EventDescriptionModal'

interface Event {
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
  views?: number
}

interface EventDetailModalProps {
  isOpen: boolean
  onClose: () => void
  event: Event | null
  user: { id: string } | null
  hasManagementPermission: boolean
}

export default function EventDetailModal({ 
  isOpen, 
  onClose, 
  event, 
  user, 
  hasManagementPermission 
}: EventDetailModalProps) {
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [showVotingModal, setShowVotingModal] = useState(false)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: '',
    game_track: '',
    multi_class: '',
    multi_time: '',
    duration_hours: 1
  })
  const [isSaving, setIsSaving] = useState(false)
  const [currentDescription, setCurrentDescription] = useState('')
  const [viewCount, setViewCount] = useState(0)

  const fetchParticipantCount = useCallback(async () => {
    if (!event) return
    
    try {
      const response = await fetch(`/api/multis/${event.id}/participants`)
      if (response.ok) {
        const data = await response.json()
        setParticipantCount(data.total || 0)
      }
    } catch (error) {
      console.error('참가자 수 가져오기 실패:', error)
    }
  }, [event])

  const incrementViewCount = useCallback(async () => {
    if (!event) return
    
    try {
      const response = await fetch(`/api/events/${event.id}/increment-view`, {
        method: 'POST'
      })
      if (response.ok) {
        const data = await response.json()
        setViewCount(data.view_count || 0)
      }
    } catch (error) {
      console.error('조회수 증가 실패:', error)
    }
  }, [event])

  useEffect(() => {
    if (isOpen && event) {
      fetchParticipantCount()
      setCurrentDescription(event.description || '')
      setViewCount(event.views || 0)
      incrementViewCount() // 조회수 증가
    }
  }, [isOpen, event, fetchParticipantCount, incrementViewCount])

  // 이벤트 편집 시작 함수
  const handleEditStart = () => {
    if (!event) return
    setEditForm({
      title: event.title,
      game_track: event.game_track || '',
      multi_class: event.multi_class || '',
      multi_time: event.multi_time || '',
      duration_hours: event.duration_hours || 1
    })
    setIsEditing(true)
  }

  // 이벤트 편집 취소 함수
  const handleEditCancel = () => {
    setIsEditing(false)
    setEditForm({
      title: '',
      game_track: '',
      multi_class: '',
      multi_time: '',
      duration_hours: 1
    })
  }

  // 이벤트 저장 함수
  const handleEditSave = async () => {
    if (!event) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/multis/${event.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm)
      })

      if (response.ok) {
        alert('이벤트가 성공적으로 수정되었습니다.')
        setIsEditing(false)
        // 모달을 닫고 새로고침하여 변경사항 반영
        onClose()
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(`수정 실패: ${errorData.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      console.error('이벤트 수정 오류:', error)
      alert('이벤트 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  // 이벤트 삭제 함수
  const handleDelete = async () => {
    if (!event) return
    
    const confirmed = confirm(`"${event.title}" 이벤트를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)
    if (!confirmed) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/multis/${event.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        alert('이벤트가 성공적으로 삭제되었습니다.')
        onClose() // 모달 닫기
        // 페이지 새로고침 또는 이벤트 목록 업데이트
        window.location.reload()
      } else {
        const errorData = await response.json()
        alert(`삭제 실패: ${errorData.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      console.error('이벤트 삭제 오류:', error)
      alert('이벤트 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!isOpen || !event) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{event.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[70vh]">
          <div className="space-y-4">
            {!user && (
              <div className="border border-amber-600 bg-amber-900/20 px-4 py-2 text-center rounded">
                <p className="text-amber-200 text-sm">
                  참가 신청과 트랙 투표를 하려면 Steam 로그인이 필요합니다.
                </p>
              </div>
            )}

            {/* 기본 정보 */}
            <div className="border border-gray-700 bg-gray-800 rounded p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-300">⏱️ {event.duration_hours ? `${event.duration_hours}시간` : '미정'}</span>
                  <span className="text-sm text-gray-300">👥 {participantCount}명</span>
                </div>
                <span className={`px-3 py-1 rounded text-sm font-medium ${event.is_open ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                  {event.is_open ? '모집중' : '마감'}
                </span>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">{event.game}</p>
                <h3 className="text-xl font-semibold text-white mb-1">{event.title}</h3>
                <p className="text-sm text-gray-400">{event.multi_day?.join(', ') || '날짜 미정'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-300">
                  <span className="text-gray-500">🏎️ 클래스:</span> {event.multi_class || '미정'}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">📍 트랙:</span> {event.game_track || '미정'}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">🕒 시간:</span> {event.multi_time || '미정'}
                </div>
                <div className="text-gray-300">
                  <span className="text-gray-500">👁️ 조회수:</span> {viewCount.toLocaleString()}
                </div>
              </div>

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">트랙</span>
                    <input
                      type="text"
                      value={editForm.game_track}
                      onChange={(e) => setEditForm(prev => ({ ...prev, game_track: e.target.value }))}
                      className="border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-gray-600"
                      placeholder="트랙명 입력"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">클래스</span>
                    <input
                      type="text"
                      value={editForm.multi_class}
                      onChange={(e) => setEditForm(prev => ({ ...prev, multi_class: e.target.value }))}
                      className="border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-gray-600"
                      placeholder="클래스 입력"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">시작 시간</span>
                    <input
                      type="time"
                      value={editForm.multi_time}
                      onChange={(e) => setEditForm(prev => ({ ...prev, multi_time: e.target.value }))}
                      className="border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-gray-600"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm text-gray-400">지속시간 (시간)</span>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={editForm.duration_hours}
                      onChange={(e) => setEditForm(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 1 }))}
                      className="border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white rounded focus:outline-none focus:border-gray-600"
                    />
                  </label>
                </div>
              ) : (
                <div className="border border-gray-700 bg-gray-800 p-4 rounded text-sm leading-relaxed text-gray-200 mt-4">
                  {currentDescription
                    ? currentDescription
                    : '설명이 아직 등록되지 않았습니다. 아래 상세 정보 버튼을 통해 내용을 추가해 보세요.'}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-4">
                {!((user && event.author_id === user.id) || hasManagementPermission) && (
                  <ParticipationButton
                    eventId={event.id}
                    onParticipationChange={fetchParticipantCount}
                  />
                )}

                {event.voting_enabled && (
                  <button
                    onClick={() => setShowVotingModal(true)}
                    className="px-4 py-2 border border-gray-700 bg-gray-800 text-sm text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    🏁 트랙 투표
                  </button>
                )}

                {!((user && event.author_id === user.id) || hasManagementPermission) ? (
                  <div className="px-4 py-2 border border-gray-700 bg-gray-800 text-sm text-gray-300 rounded">
                    👥 참가자 {participantCount}명
                  </div>
                ) : (
                  <button
                    onClick={() => setShowParticipantModal(true)}
                    className="px-4 py-2 border border-gray-700 bg-gray-800 text-sm text-white rounded hover:bg-gray-700 transition-colors"
                  >
                    👥 참가자 목록 ({participantCount}명)
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800 gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {isSaving ? '저장 중…' : '저장'}
                </button>
                <button
                  onClick={handleEditCancel}
                  disabled={isSaving}
                  className="px-4 py-2 border border-gray-700 bg-transparent text-sm text-gray-200 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                {event.description && (
                  <button
                    onClick={() => setShowDescriptionModal(true)}
                    className="px-4 py-2 border border-gray-700 bg-transparent text-sm text-gray-200 rounded hover:bg-gray-800 transition-colors"
                  >
                    상세 정보
                  </button>
                )}
                {((user && event.author_id === user.id) || hasManagementPermission) && (
                  <>
                    <button
                      onClick={handleEditStart}
                      className="px-4 py-2 border border-gray-700 bg-transparent text-sm text-gray-200 rounded hover:bg-gray-800 transition-colors"
                    >
                      수정
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-500 transition-colors disabled:opacity-60"
                    >
                      {isDeleting ? '삭제 중…' : '삭제'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-700 bg-transparent text-sm text-gray-200 rounded hover:bg-gray-800 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 서브 모달들 */}
      {showParticipantModal && (
        <ParticipantListModal
          isOpen={showParticipantModal}
          onClose={() => setShowParticipantModal(false)}
          eventId={event.id}
          isOwner={(user && event.author_id === user.id) || hasManagementPermission}
        />
      )}

      {showVotingModal && (
        <TrackVotingModal
          isOpen={showVotingModal}
          onClose={() => setShowVotingModal(false)}
          regularEventId={event.id}
          isOwner={hasManagementPermission}
          game={event.game}
        />
      )}

      {showDescriptionModal && (
        <EventDescriptionModal
          isOpen={showDescriptionModal}
          onClose={() => setShowDescriptionModal(false)}
          title={event.title}
          description={currentDescription}
          eventId={event.id}
          isEditable={((user && event.author_id === user.id) || hasManagementPermission)}
          onUpdate={(newDescription) => {
            setCurrentDescription(newDescription)
            // 페이지 새로고침으로 변경사항 반영
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

