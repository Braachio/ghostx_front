// components/upload-id/SegmentInfoPanel.tsx
'use client'
import React from 'react'
import SteeringWheel from './SteeringWheel'
import VerticalBar from './VerticalBar'
import GearSpeedCircle from '@/components/GearSpeedCircle'
import RPMShiftLight from '@/components/RPMShiftLight'
import TimerDisplay from '@/components/TimerDisplay'

interface Props {
  hoveredData: Record<string, number> | null
  xAxisKey: 'time' | 'distance'
}

export default function SegmentInfoPanel({ hoveredData, xAxisKey }: Props) {
  return (
    <div className="relative rounded-xl shadow-2xl shadow-cyan-500/10 bg-gradient-to-br from-gray-800/90 to-black/90 backdrop-blur-md border-2 border-cyan-500/30 p-6 pt-12 min-h-[160px] max-w-[480px]">
      {/* RPM 표시 */}
      <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
        <RPMShiftLight rpm={hoveredData?.rpms ?? 0} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 min-h-[100px]">
        {/* ⏱ 시간 또는 거리 */}
        <div className="text-center text-cyan-400 text-2xl font-semibold min-w-[80px]">
          {hoveredData ? (
            xAxisKey === 'distance'
              ? `${hoveredData.distance.toFixed(1)} m`
              : <TimerDisplay value={hoveredData[xAxisKey] ?? 0} />
          ) : '--:--'}
        </div>

        {/* ⚙️ 기어 + 속도 */}
        <div className="min-w-[96px]">
          <GearSpeedCircle gear={hoveredData?.gear ?? '-'} speed={hoveredData?.speed ?? 0} />
        </div>

        {/* 🧭 조향각 */}
        <div className="flex flex-col items-center min-w-[10px]">
          <SteeringWheel angle={-(hoveredData?.steerangle ?? 0)} />
        </div>

        {/* 🦶 Throttle + Brake */}
        <div className="flex flex-wrap items-center gap-1">
          <div className="flex flex-col items-center min-w-[32px] text-sm">
            <span className="mt-1 text-orange-400 font-semibold">
              {hoveredData?.brake?.toFixed(0) ?? '-'}
            </span>
            <VerticalBar value={hoveredData?.brake ?? 0} color="#ff7300" />
            <span className="mt-1 text-orange-400 font-semibold">BRK</span>
          </div>
          <div className="flex flex-col items-center min-w-[32px] text-sm">
            <span className="mt-1 text-green-400 font-semibold">
              {hoveredData?.throttle?.toFixed(0) ?? '-'}
            </span>
            <VerticalBar value={hoveredData?.throttle ?? 0} color="#82ca9d" />
            <span className="mt-1 text-green-400 font-semibold">THR</span>
          </div>
        </div>
      </div>

      {!hoveredData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full max-w-[480px] min-h-[160px] bg-gradient-to-br from-gray-800/90 to-black/90 backdrop-blur-sm rounded-xl border-2 border-cyan-500/30 flex items-center justify-center">
            <span className="text-cyan-400 text-xl font-semibold text-center">
              👻 마우스를 그래프 위에 올려주세요 🖱️
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
