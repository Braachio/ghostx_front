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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">{title} - 상세 설명</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isEditing ? (
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full h-64 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="이벤트 설명을 입력하세요..."
            />
          ) : (
            description ? (
              <div className="text-white leading-relaxed whitespace-pre-wrap">
                {description}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                설명이 없습니다.
              </div>
            )
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <div className="flex items-center gap-3">
            {isEditable && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <span>💾</span>
                      {isSaving ? '저장 중...' : '저장'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      취소
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span>✏️</span>
                    편집
                  </button>
                )}
              </>
            )}
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
