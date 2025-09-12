'use client'
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
} from 'recharts'
import type { CornerEntryFeedback, CornerExitFeedback } from '@/types/upload'

interface Props {
  data: Array<Record<string, number>>
  xAxisKey: 'time' | 'distance'
  analysisMode: 'braking' | 'throttle'
  exitFeedbacks: CornerExitFeedback[]
  entryFeedbacks?: CornerEntryFeedback[]
  onHoverExit: (index: number | null) => void
  onHoverTrail: (index: number | null) => void
  onHoverData: (payload: Record<string, number> | null) => void
}

export default function SegmentChart({
  data,
  xAxisKey,
  analysisMode,
  exitFeedbacks,
  entryFeedbacks = [],
  onHoverExit,
  onHoverTrail,
  onHoverData,
}: Props) {
  // 🚨 유효성 검사
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('🚫 주행 데이터가 비어있거나 배열이 아닙니다:', data)
    return <div className="text-red-500">🚫 주행 데이터가 없습니다.</div>
  }
  console.log('✅ SegmentChart 수신 데이터:', data)
  
  const lastX = data[data.length - 1]?.[xAxisKey]

  return (
    <ResponsiveContainer width="100%" height={225}>
      <LineChart
        data={data}
        syncId="segment-sync"
        onMouseMove={(state) => {
          const payload = state?.activePayload?.[0]?.payload ?? null
          onHoverData(payload)
        }}
        onMouseLeave={() => {
          onHoverData(null)
          onHoverExit(null)
          onHoverTrail(null)
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xAxisKey} tick={false} axisLine={false} />
        <YAxis />
        <Tooltip content={() => null} />

        {/* 분석 대상 라인 */}
        <Line type="monotone" dataKey="throttle" stroke="#82ca9d" dot={false} />
        <Line type="monotone" dataKey="brake" stroke="#ff7300" dot={false} />
        <Line type="monotone" dataKey="gear" stroke="transparent" dot={false} />

        {/* 🎯 가속 분석 모드: 코너 탈출 영역 강조 */}
        {analysisMode === 'throttle' &&
          exitFeedbacks.map((f, idx) => {
            const startX = data[f.start_idx]?.[xAxisKey]
            let endX = data[f.end_idx]?.[xAxisKey]
            if (startX == null || endX == null || lastX == null) return null
            if (endX > lastX) endX = lastX

            return (
              <ReferenceArea
                key={`exit-${idx}`}
                x1={startX}
                x2={endX}
                strokeOpacity={0.1}
                fill="#aaf"
                fillOpacity={0.2}
                onMouseEnter={() => onHoverExit(idx)}
                onMouseLeave={() => onHoverExit(null)}
              />
            )
          })}

        {/* 🎯 제동 분석 모드: 브레이킹 및 트레일 브레이킹 영역 강조 */}
        {analysisMode === 'braking' &&
          entryFeedbacks.map((zone, idx) => {
            const startX = data[zone.start_idx]?.[xAxisKey]
            let endX = data[zone.end_idx]?.[xAxisKey]
            if (startX == null || endX == null || lastX == null) return null
            if (endX > lastX) endX = lastX

            return (
              <ReferenceArea
                key={`trail-${idx}`}
                x1={startX}
                x2={endX}
                strokeOpacity={0.1}
                fill="#ffa500"
                fillOpacity={0.2}
                onMouseEnter={() => onHoverTrail(idx)}
                onMouseLeave={() => onHoverTrail(null)}
              />
            )
          })}
      </LineChart>
    </ResponsiveContainer>
  )
}
