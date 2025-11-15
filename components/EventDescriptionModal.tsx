'use client'

import { useState, useEffect } from 'react'

interface EventDescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
  eventId?: string
  isEditable?: boolean
  onUpdate?: (newDescription: string) => void
}

export default function EventDescriptionModal({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  eventId,
  isEditable = false,
  onUpdate 
}: EventDescriptionModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState(description)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setEditDescription(description)
  }, [description])

  const handleSave = async () => {
    if (!eventId || !onUpdate) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/multis/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          description: editDescription
        })
      })

      if (response.ok) {
        onUpdate(editDescription)
        setIsEditing(false)
        alert('설명이 성공적으로 수정되었습니다.')
      } else {
        const errorData = await response.json()
        alert(`수정 실패: ${errorData.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      console.error('설명 수정 오류:', error)
      alert('설명 수정 중 오류가 발생했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditDescription(description)
    setIsEditing(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-950/95 border border-slate-900 rounded-3xl max-w-3xl w-full max-h-[80vh] overflow-hidden shadow-[0_24px_60px_-30px_rgba(15,23,42,0.8)]">
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-900/80">
          <div>
            <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Event Detail</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors text-xl"
          >
            ×
          </button>
        </div>

        <div className="px-6 md:px-8 py-6 overflow-y-auto min-h-[48vh] max-h-[72vh]">
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full h-64 rounded-2xl border border-slate-900 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 leading-relaxed focus:outline-none focus:ring-1 focus:ring-slate-500 resize-none"
              placeholder="이벤트 설명을 입력하세요…"
            />
          ) : (
            description ? (
              <div className="rounded-2xl border border-slate-900 bg-slate-950/40 px-4 py-5 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {description}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 px-4 py-12 text-center text-sm text-slate-500">
                아직 등록된 설명이 없습니다.
              </div>
            )
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-5 border-t border-slate-900 bg-slate-950">
          <div className="flex items-center gap-2">
            {isEditable && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100/90 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="text-base">💾</span>
                      {isSaving ? '저장 중…' : '저장'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-transparent px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
                  >
                    <span className="text-base">✏️</span>
                    편집
                  </button>
                )}
              </>
            )}
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
