'use client'

import { useState } from 'react'
import BrakingPointTrainer from './BrakingPointTrainer'

interface TrainingModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function TrainingModal({ isOpen, onClose }: TrainingModalProps) {
  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white">AI 교정 훈련</h2>
            <p className="text-sm text-gray-400 mt-1">브레이킹 포인트 집중 훈련</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-3xl transition-colors"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
          <BrakingPointTrainer />
        </div>
      </div>
    </div>
  )
}



