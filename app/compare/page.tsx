'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface AnalysisRow {
  id: string
  file_url: string
  avg_lap_time: number
  best_lap_time: number
  avg_speed: number
  avg_throttle: number
  avg_brake: number
  sector1_avg: number
  sector2_avg: number
  sector3_avg: number
  created_at: string
}

export default function ComparePage() {
  const [data, setData] = useState<AnalysisRow[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: rows } = await supabase
        .from('analysis_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      if (rows) setData(rows)
    }

    fetchData()
  }, [])

  const selected = data.filter((d) => selectedIds.includes(d.id))
  const canCompare = selected.length === 2

  const chartData = canCompare
    ? [
        { name: 'Avg Lap Time', [selected[0].id]: selected[0].avg_lap_time, [selected[1].id]: selected[1].avg_lap_time },
        { name: 'Best Lap', [selected[0].id]: selected[0].best_lap_time, [selected[1].id]: selected[1].best_lap_time },
        { name: 'Speed', [selected[0].id]: selected[0].avg_speed, [selected[1].id]: selected[1].avg_speed },
        { name: 'Throttle', [selected[0].id]: selected[0].avg_throttle, [selected[1].id]: selected[1].avg_throttle },
        { name: 'Brake', [selected[0].id]: selected[0].avg_brake, [selected[1].id]: selected[1].avg_brake },
      ]
    : []

  return (
    <div className="p-6 max-w-5xl mx-auto text-black dark:text-white">
      <h2 className="text-2xl font-bold mb-4">🔍 분석 결과 비교</h2>

      <p className="mb-2 text-gray-600">최근 분석 결과 중 두 개를 선택하여 비교합니다.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {data.map((item) => (
          <div
            key={item.id}
            onClick={() => {
              setSelectedIds((prev) =>
                prev.includes(item.id)
                  ? prev.filter((id) => id !== item.id)
                  : prev.length < 2
                  ? [...prev, item.id]
                  : prev
              )
            }}
            className={`border p-4 rounded cursor-pointer ${
              selectedIds.includes(item.id) ? 'bg-blue-100 dark:bg-blue-800' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <p className="text-sm text-gray-500">📁 {item.file_url.slice(-30)}</p>
            <p>⏱️ 평균랩: {item.avg_lap_time}s / 최고랩: {item.best_lap_time}s</p>
            <p>🏎️ 속도: {item.avg_speed} / 💨 Throttle: {item.avg_throttle}</p>
          </div>
        ))}
      </div>

      {canCompare && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-2">📊 비교 결과</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey={selected[0].id} fill="#8884d8" />
              <Bar dataKey={selected[1].id} fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
