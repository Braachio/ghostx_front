'use client'

import { useState } from 'react'
import AchievementModal from './AchievementModal'

interface AchievementProgressProps {
  appId: number
  gameName?: string
}

export default function AchievementProgress({ appId, gameName }: AchievementProgressProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white text-sm font-medium"
      >
        🏆 업적 보기
      </button>

      <AchievementModal
        appId={appId}
        gameName={gameName}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}

