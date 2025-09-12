'use client'
import React from 'react'

interface Props {
  segmentCount: number
  segmentNames: string[]
  selectedSegmentIndex: number
  onSegmentChange: (index: number) => void
  xAxisKey: 'time' | 'distance'
  onToggleXAxis: () => void
  analysisMode: 'braking' | 'throttle'
  onModeChange: (mode: 'braking' | 'throttle') => void
}

export default function SegmentControls({
  segmentNames,
  selectedSegmentIndex,
  onSegmentChange,
  xAxisKey,
  onToggleXAxis,
  analysisMode,
  onModeChange,
}: Props) {
  return (
    <div className="flex justify-between items-center flex-wrap gap-2">
      {/* 🧭 구간 선택 */}
      <div className="flex items-center gap-2">
        <label className="font-medium text-sm">🧭 구간 선택:</label>
        <select
          className="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedSegmentIndex}
          onChange={(e) => onSegmentChange(Number(e.target.value))}
        >
          {segmentNames.map((name, idx) => (
            <option key={idx} value={idx}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* ⏱ / 📏 X축 전환 버튼 */}
      <button
        onClick={onToggleXAxis}
        className="text-sm px-3 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
      >
        X축 전환: {xAxisKey === 'time' ? '⏱ 시간' : '📏 거리'}
      </button>

      {/* 🔁 분석 모드 변경 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">분석 모드:</span>
        <button
          onClick={() => onModeChange('braking')}
          className={`px-3 py-1 rounded text-sm ${
            analysisMode === 'braking'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
        >
          브레이크
        </button>
        <button
          onClick={() => onModeChange('throttle')}
          className={`px-3 py-1 rounded text-sm ${
            analysisMode === 'throttle'
              ? 'bg-[#82ca9d] text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}
        >
          스로틀
        </button>
      </div>
    </div>
  )
}
