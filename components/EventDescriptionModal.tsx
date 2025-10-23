'use client'

interface EventDescriptionModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description: string
}

export default function EventDescriptionModal({ isOpen, onClose, title, description }: EventDescriptionModalProps) {
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
          {description ? (
            <div 
              className="text-white leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">
              설명이 없습니다.
            </div>
          )}
        </div>

        <div className="flex items-center justify-end p-6 border-t border-gray-700">
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
