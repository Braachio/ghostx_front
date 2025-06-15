'use client'

import { useSearchParams, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Brush, Legend,
} from 'recharts'

type LapDataPoint = {
  time: number
  distance: number
  speed: number
  throttle: number
  brake: number
  steering: number
}

export default function LapComparePage() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const targetIdParam = searchParams.get('target')

  const [baseData, setBaseData] = useState<LapDataPoint[]>([])
  const [targetData, setTargetData] = useState<LapDataPoint[]>([])
  const [status, setStatus] = useState('비교 준비 중...')

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      // 1. 기준 랩 정보 조회
      const { data: baseLap, error: baseErr } = await supabase
        .from('laps')
        .select('id, track, car, lap_time')
        .eq('id', id)
        .single()

      if (baseErr || !baseLap) {
        setStatus('기준 랩 정보를 불러올 수 없습니다.')
        return
      }

      // 2. 기준 랩 시계열 데이터 조회
      const { data: baseLapData } = await supabase
        .from('lap_data')
        .select('data')
        .eq('lap_id', id)
        .single()

      setBaseData(baseLapData?.data || [])

      // 3. 타겟 랩: 직접 지정 or 자동 검색
      let targetId = targetIdParam

      if (!targetId) {
        const { data: fasterLap } = await supabase
          .from('laps')
          .select('id')
          .eq('track', baseLap.track)
          .eq('car', baseLap.car)
          .lt('lap_time', baseLap.lap_time)
          .neq('id', id)
          .order('lap_time', { ascending: true })
          .limit(1)
          .single()

        targetId = fasterLap?.id
        if (!targetId) {
          setStatus('더 빠른 랩이 없습니다. 비교 불가')
          return
        }
      }

      const { data: targetLapData } = await supabase
        .from('lap_data')
        .select('data')
        .eq('lap_id', targetId)
        .single()

      setTargetData(targetLapData?.data || [])
      setStatus('✅ 비교 완료')
    }

    fetchData()
  }, [id, targetIdParam])

  const metrics: (keyof LapDataPoint)[] = ['speed', 'throttle', 'brake', 'steering']

  const colors = {
    base: '#3B82F6',
    target: '#F97316',
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h2 className="text-2xl font-bold">🆚 랩 비교 시각화</h2>
      <p className="text-gray-500">{status}</p>

      {baseData.length > 0 && targetData.length > 0 && metrics.map(metric => (
        <div key={metric} className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow">
          <h3 className="text-lg font-semibold mb-2">{metric.toUpperCase()}</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart syncId="compare" margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" type="number" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                data={baseData}
                type="monotone"
                dataKey={metric}
                name="기준 랩"
                stroke={colors.base}
                strokeWidth={2}
                dot={false}
              />
              <Line
                data={targetData}
                type="monotone"
                dataKey={metric}
                name="더 빠른 랩"
                stroke={colors.target}
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
              />
              <Brush dataKey="time" height={20} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ))}
    </div>
  )
}
