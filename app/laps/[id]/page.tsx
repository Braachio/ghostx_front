'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Brush,
} from 'recharts'

interface LapDetail {
  time: number
  distance: number
  speed: number
  throttle: number
  brake: number
  steering: number
}

export default function LapDetailPage() {
  const { id } = useParams()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [lapInfo, setLapInfo] = useState<any>(null)
  const [data, setData] = useState<LapDetail[]>([])

  useEffect(() => {
    const fetchLapData = async () => {
      const { data: lap, error: lapError } = await supabase
        .from('laps')
        .select('*')
        .eq('id', id)
        .single()

      const { data: lapData, error: dataError } = await supabase
        .from('lap_data')
        .select('data')
        .eq('lap_id', id)
        .single()

      if (lapError || dataError) {
        console.error(lapError || dataError)
        return
      }

      setLapInfo(lap)
      setData(lapData.data)
    }

    fetchLapData()
  }, [id])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">🏁 주행 상세 분석</h2>

      {lapInfo && (
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow space-y-1">
          <p><strong>트랙:</strong> {lapInfo.track}</p>
          <p><strong>차량:</strong> {lapInfo.car}</p>
          <p><strong>랩타임:</strong> {lapInfo.lap_time}s</p>
        </div>
      )}

      {data.length > 0 && (
        <div className="grid grid-cols-1 gap-8">
          {(['speed', 'throttle', 'brake', 'steering'] as const).map((metric) => (
            <div key={metric} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow">
              <h3 className="text-lg font-semibold mb-2">{metric.toUpperCase()}</h3>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    strokeWidth={2}
                    stroke={
                      metric === 'speed' ? '#1E90FF' :
                      metric === 'throttle' ? '#22C55E' :
                      metric === 'brake' ? '#EF4444' : '#A855F7'
                    }
                    dot={false}
                  />
                  <Brush dataKey="time" height={20} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
