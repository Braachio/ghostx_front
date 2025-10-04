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
    <div className="flex justify-between items-center flex-wrap gap-4 bg-gradient-to-r from-gray-800 to-gray-900 p-4 rounded-lg border border-gray-600">
      {/* 🧭 구간 선택 */}
      <div className="flex items-center gap-2">
        <label className="font-medium text-sm text-cyan-400">🧭 구간 선택:</label>
        <select
          className="border-2 border-cyan-500/30 rounded-lg px-3 py-1 text-sm bg-gray-800 text-white focus:border-cyan-400 focus:outline-none transition-colors"
          value={selectedSegmentIndex}
          onChange={(e) => onSegmentChange(Number(e.target.value))}
        >
          {segmentNames.map((name, idx) => (
            <option key={idx} value={idx} className="bg-gray-800">
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* ⏱ / 📏 X축 전환 버튼 */}
      <button
        onClick={onToggleXAxis}
        className="text-sm px-3 py-1 rounded-lg bg-gray-700 text-white hover:bg-cyan-600 transition-all border border-gray-600 hover:border-cyan-500"
      >
        X축 전환: {xAxisKey === 'time' ? '⏱ 시간' : '📏 거리'}
      </button>

      {/* 🔁 분석 모드 변경 */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-300">분석 모드:</span>
        <button
          onClick={() => onModeChange('braking')}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
            analysisMode === 'braking'
              ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg shadow-orange-500/25'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          }`}
        >
          🛑 브레이크
        </button>
        <button
          onClick={() => onModeChange('throttle')}
          className={`px-3 py-1 rounded-lg text-sm font-semibold transition-all ${
            analysisMode === 'throttle'
              ? 'bg-gradient-to-r from-green-600 to-cyan-600 text-white shadow-lg shadow-green-500/25'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600'
          }`}
        >
          🚀 스로틀
        </button>
      </div>
    </div>
  )
}
