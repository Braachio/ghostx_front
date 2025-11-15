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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950/95 border border-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,23,42,0.8)]">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-900/80">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">Event Detail</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-100">{event.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <div className="px-6 md:px-8 py-6 overflow-y-auto max-h-[70vh]">
          <div className="space-y-6">
            {!user && (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-center">
                <p className="text-amber-100 text-xs font-medium">
                  참가 신청과 트랙 투표를 하려면 Steam 로그인이 필요합니다.
                </p>
              </div>
            )}

            <div className="rounded-3xl border border-slate-900 bg-slate-950/60 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.9)] overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_#38bdf8_0%,_rgba(15,23,42,0)_55%)]" />
                <div className="relative flex h-full flex-col justify-between p-6">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-3 py-1 text-[11px]">
                        ⏱️ {event.duration_hours ? `${event.duration_hours}h` : 'TBD'}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/60 px-3 py-1 text-[11px]">
                        👥 {participantCount}명 참여
                      </span>
                    </div>
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] ${event.is_open ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-900/70 text-slate-300'}`}>
                      {event.is_open ? '모집중' : '마감'}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.32em] text-slate-300">
                      {event.game}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">
                      {event.title}
                    </h3>
                    <p className="mt-2 text-xs text-slate-300 uppercase tracking-widest">
                      {event.multi_day?.join(', ') || '날짜 미정'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1">
                    🏎️ {event.multi_class || '클래스 미정'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1">
                    📍 {event.game_track || '트랙 미정'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1">
                    🕒 {event.multi_time || '시간 미정'}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/80 px-3 py-1">
                    👁️ 조회수 {viewCount.toLocaleString()}
                  </span>
                </div>

                {isEditing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-2 rounded-2xl border border-slate-900 bg-slate-950/70 p-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        트랙
                      </span>
                      <input
                        type="text"
                        value={editForm.game_track}
                        onChange={(e) => setEditForm(prev => ({ ...prev, game_track: e.target.value }))}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        placeholder="트랙명 입력"
                      />
                    </label>
                    <label className="flex flex-col gap-2 rounded-2xl border border-slate-900 bg-slate-950/70 p-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        클래스
                      </span>
                      <input
                        type="text"
                        value={editForm.multi_class}
                        onChange={(e) => setEditForm(prev => ({ ...prev, multi_class: e.target.value }))}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                        placeholder="클래스 입력"
                      />
                    </label>
                    <label className="flex flex-col gap-2 rounded-2xl border border-slate-900 bg-slate-950/70 p-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        시작 시간
                      </span>
                      <input
                        type="time"
                        value={editForm.multi_time}
                        onChange={(e) => setEditForm(prev => ({ ...prev, multi_time: e.target.value }))}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </label>
                    <label className="flex flex-col gap-2 rounded-2xl border border-slate-900 bg-slate-950/70 p-4">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                        지속시간 (시간)
                      </span>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={editForm.duration_hours}
                        onChange={(e) => setEditForm(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 1 }))}
                        className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                      />
                    </label>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-900 bg-slate-950/70 p-5 text-sm leading-relaxed text-slate-200">
                    {currentDescription
                      ? currentDescription
                      : '설명이 아직 등록되지 않았습니다. 아래 상세 정보 버튼을 통해 내용을 추가해 보세요.'}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                  {!((user && event.author_id === user.id) || hasManagementPermission) && (
                    <ParticipationButton
                      eventId={event.id}
                      onParticipationChange={fetchParticipantCount}
                    />
                  )}

                  {event.voting_enabled && (
                    <button
                      onClick={() => setShowVotingModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 hover:bg-slate-900 transition-colors"
                    >
                      <span className="text-base">🏁</span>
                      트랙 투표
                    </button>
                  )}

                  {!((user && event.author_id === user.id) || hasManagementPermission) ? (
                    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-300">
                      <span className="text-base">👥</span>
                      참가자 {participantCount}명
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowParticipantModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200 hover:bg-slate-900 transition-colors"
                    >
                      <span className="text-base">👥</span>
                      참가자 목록 ({participantCount}명)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-5 border-t border-slate-900 bg-slate-950 gap-3 sm:gap-0">
          {/* 왼쪽 버튼들 - 모바일 최적화 */}
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {isEditing ? (
              /* 편집 모드 버튼들 */
              <>
                <button
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-base">💾</span>
                  {isSaving ? '저장 중…' : '저장'}
                </button>
                
                <button
                  onClick={handleEditCancel}
                  disabled={isSaving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-base">✖</span>
                  취소
                </button>
              </>
            ) : (
              /* 일반 모드 버튼들 */
              <>
                {/* 상세정보 버튼 */}
                {event.description && (
                  <button
                    onClick={() => setShowDescriptionModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
                  >
                    <span className="text-base">📋</span>
                    상세 정보
                  </button>
                )}
                
                {/* 수정/삭제 버튼 (작성자나 관리자만) */}
                {((user && event.author_id === user.id) || hasManagementPermission) && (
                  <>
                    <button
                      onClick={handleEditStart}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
                    >
                      <span className="text-base">✏️</span>
                      수정
                    </button>
                    
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-red-600/90 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      <span className="text-base">🗑️</span>
                      {isDeleting ? '삭제 중…' : '삭제'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
          
          {/* 닫기 버튼 (오른쪽) - 모바일 최적화 */}
          <button
            onClick={onClose}
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-slate-800 bg-transparent px-5 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
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

