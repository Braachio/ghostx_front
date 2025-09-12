// 'use client'
// import React from 'react'

// interface Props {
//   track: string
//   car: string
//   stats: {
//     duration: string
//     maxSpeed: string
//     minSpeed: string
//   }
// }

// export default function SegmentDetailPanel({ track, car, stats }: Props) {
//   return (
//     <div className="flex justify-between items-start text-sm mt-2">
//       {/* 🏁 차량 및 트랙 정보 */}
//       <div className="flex gap-40 text-gray-700 dark:text-gray-300">
//         <p><strong>🏁 트랙:</strong> {track}</p>
//         <p><strong>🚗 차량:</strong> {car}</p>
//       </div>

//       {/* 📊 구간 통계 정보 */}
//       <div className="flex gap-2 text-gray-700 dark:text-gray-300">
//         <p><strong>⏱ 지속 시간:</strong> {stats.duration}초</p>
//         <p><strong>🚀 최고 속도:</strong> {stats.maxSpeed} kph</p>
//         <p><strong>🐢 최저 속도:</strong> {stats.minSpeed} kph</p>
//       </div>
//     </div>
//   )
// }
