// components/upload-id/LapStatsCard.tsx
//임시 메시지나 안내 박스를 보여줄 때 재사용하기 좋은 단순 카드 컴포넌트
'use client'
import React from 'react'

interface Props {
  title: string
  message: string
  icon?: string
}

export default function LapStatsCard({ title, message, icon = '📊' }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center rounded-xl border border-dashed border-gray-400 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 p-4 min-h-[160px] max-w-[445px]">
      <p className="text-gray-700 dark:text-gray-200 text-xl font-semibold text-center">
        {icon} {message || title}
      </p>
    </div>
  )
}