'use client'

import React, { useEffect, useState } from 'react'
import clsx from 'clsx'

interface RPMShiftLightProps {
  rpm: number
}

export default function RPMShiftLight({ rpm }: RPMShiftLightProps) {
  const [blink, setBlink] = useState(false)

  const minCornerRPM = 3000
  const maxCornerRPM = 7000

  // 비율 계산
  const rpmRatio = Math.max(0, Math.min(1, (rpm - minCornerRPM) / (maxCornerRPM - minCornerRPM)))

  // 깜빡임 조건: 코너 상한 넘을 경우
  useEffect(() => {
    if (rpmRatio >= 1.0) {
      const interval = setInterval(() => setBlink(prev => !prev), 300)
      return () => clearInterval(interval)
    } else {
      setBlink(false)
    }
  }, [rpmRatio])

  // 점등 기준: 중앙부터 양쪽으로
  const ledThresholds = [
    0.05, 0.12, 0.20, 0.28, 0.36, 0.44, 0.52,
    0.60, 0.68, 0.76, 0.84, 0.92, 0.96, 1.0
  ]

  return (
    <div className="flex justify-center items-center gap-4">
      {ledThresholds.map((threshold, i) => {
        let color = 'bg-gray-700'

        if (rpmRatio >= 1.0) {
          color = blink ? 'bg-red-500' : 'bg-red-800'
        } else if (rpmRatio >= threshold) {
          if (threshold > 0.95) color = 'bg-red-500'
          else if (threshold > 0.80) color = 'bg-yellow-400'
          else color = 'bg-green-400'
        }

        return (
          <div
            key={i}
            className={clsx('w-3.5 h-3.5 rounded-full transition-all duration-100', color)}
          />
        )
      })}
    </div>
  )
}
