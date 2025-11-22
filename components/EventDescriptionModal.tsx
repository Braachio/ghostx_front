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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 overflow-y-auto min-h-[48vh] max-h-[72vh]">
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full h-64 border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white leading-relaxed rounded focus:outline-none focus:border-gray-600 resize-none"
              placeholder="이벤트 설명을 입력하세요…"
            />
          ) : (
            description ? (
              <div className="border border-gray-700 bg-gray-800 px-4 py-5 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap rounded">
                {description}
              </div>
            ) : (
              <div className="border border-dashed border-gray-700 bg-gray-800 px-4 py-12 text-center text-sm text-gray-400 rounded">
                아직 등록된 설명이 없습니다.
              </div>
            )
          )}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 bg-gray-800">
          <div className="flex items-center gap-2">
            {isEditable && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-white text-gray-900 text-sm font-medium rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                      {isSaving ? '저장 중…' : '저장'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 border border-gray-700 bg-transparent text-sm text-gray-200 rounded hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 border border-gray-700 bg-transparent text-sm text-gray-200 rounded hover:bg-gray-800 transition-colors"
                  >
                    편집
                  </button>
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
    </div>
  )
}
