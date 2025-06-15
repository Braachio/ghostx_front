'use client'

import { useEffect, useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from 'recharts'

interface LapMeta {
  id: string
  track: string
  car: string
  uploaded_at: string
}

const metrics = ['speed', 'throttle', 'brake', 'steering', 'rpm', 'gear'] as const
const metricColors: Record<string, string> = {
  speed: '#1E90FF',
  throttle: '#22C55E',
  brake: '#EF4444',
  steering: '#A855F7',
  rpm: '#F59E0B',
  gear: '#0EA5E9',
}

export default function ReplayPage() {
  const user_id = 'demo_user' // TODO: 로그인 사용자 ID로 교체
  const [lapList, setLapList] = useState<LapMeta[]>([])
  const [selectedLap, setSelectedLap] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lapData, setLapData] = useState<any[]>([])
  const [xAxis, setXAxis] = useState<'time' | 'distance'>('time')

  useEffect(() => {
    fetch(`http://localhost:8000/get-user-laps?user_id=${user_id}`)
      .then(res => res.json())
      .then(data => setLapList(data.laps || []))
  }, [])

  useEffect(() => {
    if (!selectedLap) return
    fetch(`http://localhost:8000/get-lap-data?lap_id=${selectedLap}`)
      .then(res => res.json())
      .then(data => setLapData(data.lap_data || []))
  }, [selectedLap])

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">🎥 랩 리플레이 시각화</h2>

      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <label className="font-semibold">랩 선택:</label>
        <select
          value={selectedLap ?? ''}
          onChange={(e) => setSelectedLap(e.target.value)}
          className="p-2 border rounded text-black w-full md:w-auto"
        >
          <option value="">-- 랩을 선택하세요 --</option>
          {lapList.map((lap) => (
            <option key={lap.id} value={lap.id}>
              {lap.track} / {lap.car} ({lap.uploaded_at.split('T')[0]})
            </option>
          ))}
        </select>

        <label className="ml-4 font-semibold">X축:</label>
        <select
          value={xAxis}
          onChange={(e) => setXAxis(e.target.value as 'time' | 'distance')}
          className="p-2 border rounded text-black"
        >
          <option value="time">시간 (s)</option>
          <option value="distance">거리 (m)</option>
        </select>
      </div>

      {lapData.length > 0 && metrics.map((metric) => (
        <div key={metric} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl shadow-md">
          <h3 className="text-xl font-semibold mb-2">{metric.toUpperCase()}</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={lapData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxis} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={metric}
                stroke={metricColors[metric]}
                strokeWidth={2}
                dot={false}
              />
              <Brush dataKey={xAxis} height={20} stroke={metricColors[metric]} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
