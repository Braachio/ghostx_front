'use client'

interface TimerDisplayProps {
  value: number
}

export default function TimerDisplay({ value }: TimerDisplayProps) {
  // 시간/거리 판단해서 포맷 출력 (예: 12.34초 또는 120.5m)
  const formatted =
    value > 1000
      ? `${value.toFixed(0)} m`
      : `${value.toFixed(2)} s`

  return (
    <div className="text-xl font-bold text-gray-900 dark:text-white">
      {formatted}
    </div>
  )
}

// function TimerDisplay({ value }: { value: number }) {
//   return (
//     <div className="flex items-center space-x-1">
//       <span className="text-lg">⏱</span>
//       <span className="text-sm">{value.toFixed(2)}s</span>
//     </div>
//   )
// }