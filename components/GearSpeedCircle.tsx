'use client'

import React from 'react'

interface GearSpeedCircleProps {
  gear: number | string
  speed: number
}

export default function GearSpeedCircle({ gear, speed = 0 }: GearSpeedCircleProps) {
  return (
    <div className="w-24 h-24 flex items-center justify-center rounded-full border-2 border-gray-500 dark:border-gray-300 bg-transparent text-gray-900 dark:text-gray-100">
      <div className="text-center leading-none">
        <div className="text-3xl font-extrabold">{gear}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">kph</div>
        <div className="text-sm font-medium">{speed.toFixed(0)}</div>
      </div>
    </div>
  )
}
