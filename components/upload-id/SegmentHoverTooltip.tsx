'use client'
import React from 'react'

interface TooltipProps {
  mode: 'throttle' | 'braking'
  hoveredExitIndex: number | null
  hoveredTrailIndex: number | null
  exitFeedbacks: Array<{ feedback: string }>
  entryFeedbacks: Array<{ feedback: string }>
}

export default function SegmentHoverTooltip({
  mode,
  hoveredExitIndex,
  hoveredTrailIndex,
  exitFeedbacks,
  entryFeedbacks,
}: TooltipProps) {
  const feedback =
    mode === 'throttle'
      ? hoveredExitIndex !== null
        ? exitFeedbacks?.[hoveredExitIndex]?.feedback
        : null
      : hoveredTrailIndex !== null
        ? entryFeedbacks?.[hoveredTrailIndex]?.feedback
        : null

  if (!feedback) return null

  return (
    <div className="absolute -top-20 right-4 bg-white dark:bg-gray-800 border dark:border-gray-600 shadow-lg rounded p-3 z-50 max-w-[480px] text-sm text-gray-800 dark:text-gray-100">
      {feedback}
    </div>
  )
}
