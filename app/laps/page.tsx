'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface Lap {
  id: string
  track: string
  car: string
  lap_time: number
  sector1: number
  sector2: number
  sector3: number
  uploaded_at: string
}

export default function LapListPage() {
  const [laps, setLaps] = useState<Lap[]>([])

  useEffect(() => {
    const fetchLaps = async () => {
      const { data, error } = await supabase
        .from('laps')
        .select('*')
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error(error)
      } else {
        setLaps(data)
      }
    }

    fetchLaps()
  }, [])

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">📋 내 주행 기록</h2>

      {laps.map((lap) => (
        <div
          key={lap.id}
          className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <h3 className="text-lg font-semibold">{lap.track} - {lap.car}</h3>
          <p className="text-sm text-gray-500">랩타임: {lap.lap_time}s</p>
          <p className="text-sm text-gray-500">
            섹터: {lap.sector1}s / {lap.sector2}s / {lap.sector3}s
          </p>
          <p className="text-xs text-gray-400">{new Date(lap.uploaded_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  )
}
