'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { PostgrestResponse } from '@supabase/supabase-js'

interface StyleReport {
  user_id: string
  lap_id: string
  total_corners: number
  style_distribution: Record<string, number>
  main_style: string
  feedback: string[]
}

interface CornerFeedback {
  name: string
  entry_speed: number
  min_speed: number
  exit_speed: number
  ideal_exit_speed: number
  style: string
  feedback: string
}

interface ResultType {
  track: string
  car: string
  data?: Array<Record<string, number>>
  corner_feedback?: CornerFeedback[]
  style_report?: StyleReport
}

interface LapMeta {
  id: string
  user_id: string
  track: string
  car: string
  created_at: string
  hash: string
}

export default function UploadIdPage() {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<ResultType | null>(null)
  const [userId, setUserId] = useState<string>('')
  const [lapList, setLapList] = useState<LapMeta[]>([])
  const [selectedLapId, setSelectedLapId] = useState<string>('')
  const [xAxisKey, setXAxisKey] = useState<'time' | 'distance'>('time') // ✅ 토글 상태
  const [selectedSegmentIndex, setSelectedSegmentIndex] = useState<number>(0)

  const toggleXAxis = () => {
    setXAxisKey(prev => (prev === 'time' ? 'distance' : 'time'))
  }

  const supabase = createPagesBrowserClient<Database>()

  useEffect(() => {
    const fetchUserAndLaps = async () => {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user?.id) {
        const uid = userData.user.id
        setUserId(uid)

        const { data: laps } = await supabase
          .from('lap_meta')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false }) as PostgrestResponse<LapMeta>

        if (laps) setLapList(laps)
      }
    }

    fetchUserAndLaps()
  }, [])

  const getSummaryStats = (segment: any[]) => {
    const duration = segment.at(-1)?.time - segment[0]?.time || 0
    const speeds = segment.map((d) => d.speed).filter((v) => v !== undefined && !isNaN(v))
    const maxSpeed = Math.max(...speeds)
    const minSpeed = Math.min(...speeds)

    return {
      duration: duration.toFixed(2), // 초 단위
      maxSpeed: maxSpeed.toFixed(1),
      minSpeed: minSpeed.toFixed(1),
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !userId) return

    setMessage('업로드 중...')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)
    formData.append('save', 'true')
    formData.append('weather', 'sunny')
    formData.append('air_temp', '25')
    formData.append('track_temp', '32')

    try {
      const res = await fetch('http://localhost:8000/api/analyze-motec-csv', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data?.error?.includes("중복된 랩")) {
          setMessage('❌ 중복된 랩 데이터입니다.')
        } else {
          setMessage(`❌ 에러: ${data?.error || '알 수 없는 오류'}`)
        }
        return
      }

      setResult(data)
      setMessage('✅ 분석 완료')
    } catch (err) {
      console.error(err)
      setMessage('❌ 업로드 실패')
    }
  }

  const fetchLapDetail = async (lapId: string) => {
    setMessage('📦 저장된 랩 데이터 불러오는 중...')
    try {
      const res = await fetch(`http://localhost:8000/api/lap/${lapId}`)
      const data = await res.json()

      if (!res.ok) {
        setMessage(`❌ 랩 데이터 불러오기 실패: ${data?.error || '서버 오류'}`)
        return
      }

      setResult(data)
      setMessage('✅ 데이터 불러오기 완료')
    } catch (err) {
      console.error(err)
      setMessage('❌ 네트워크 오류로 데이터 불러오기 실패')
    }
  }

  const splitByTimeGap = (data: Array<Record<string, number>>, threshold = 1.5) => {
    if (!data || data.length === 0) return []

    const result: Array<Array<Record<string, number>>> = []
    let currentGroup: Array<Record<string, number>> = [data[0]]

    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1]
      const curr = data[i]
      const gap = curr.time - prev.time

      if (gap > threshold) {
        result.push(currentGroup)
        currentGroup = []
      }
      currentGroup.push(curr)
    }

    if (currentGroup.length) result.push(currentGroup)
    return result
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📂 MoTeC CSV 업로드 분석</h2>
        <Link href="/">
          <button className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition">홈으로</button>
        </Link>
      </div>

      <div className="space-y-3">
        <div>
          <input id="csv-upload" type="file" accept=".csv" onChange={handleUpload} className="hidden" />
          <label htmlFor="csv-upload" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition">
            📤 CSV 파일 업로드
          </label>
        </div>

        {lapList.length > 0 && (
          <div>
            <label className="mr-2 font-medium text-sm">📜 이전 랩 선택:</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={selectedLapId}
              onChange={(e) => {
                const id = e.target.value
                setSelectedLapId(id)
                if (id) fetchLapDetail(id)
              }}
            >
              <option value="">선택하세요</option>
              {lapList.map((lap) => (
                <option key={lap.id} value={lap.id}>
                  {lap.track} - {lap.car} ({new Date(lap.created_at).toLocaleString()})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">📈 주행 시각화</h3>
        <button
          onClick={toggleXAxis}
          className="text-sm px-3 py-1 rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-700 transition"
        >
          X축 전환: {xAxisKey === 'time' ? '⏱ 시간' : '📏 거리'}
        </button>
      </div>
      
      {result?.data && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 space-y-6">
          <div className="text-sm text-gray-800 dark:text-gray-200">
            <p><strong>🏁 트랙:</strong> {result.track}</p>
            <p><strong>🚗 차량:</strong> {result.car}</p>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">📈 주행 시각화</h3>

          {result?.data && (
            <div className="mb-4">
              <label className="mr-2 font-medium text-sm">🧭 구간 선택:</label>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={selectedSegmentIndex}
                onChange={(e) => setSelectedSegmentIndex(Number(e.target.value))}
              >
                {splitByTimeGap(result.data).map((_, idx) => (
                  <option key={idx} value={idx}>
                    구간 {idx + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          {result?.data && (() => {
            const segments = splitByTimeGap(result.data)
            const segment = segments[selectedSegmentIndex]
            const stats = getSummaryStats(segment)
            
            return (
              <div className="bg-white dark:bg-gray-900 shadow-md rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-base font-semibold text-gray-800 dark:text-gray-100">📦 구간 {selectedSegmentIndex + 1}</h4>
                </div>

                {/* 📊 요약 정보 표시 */}
                <div className="flex gap-6 text-sm text-gray-700 dark:text-gray-300">
                  <p><strong>⏱ 지속 시간:</strong> {stats.duration}초</p>
                  <p><strong>🚀 최고 속도:</strong> {stats.maxSpeed} km/h</p>
                  <p><strong>🐢 최저 속도:</strong> {stats.minSpeed} km/h</p>
                </div>

                {/* Throttle + Brake */}
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={segment} syncId="segment-sync">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey={xAxisKey} tick={false} axisLine={false} />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="throttle" stroke="#82ca9d" dot={false} />
                    <Line type="monotone" dataKey="brake" stroke="#ff7300" dot={false} />
                  </LineChart>
                </ResponsiveContainer>

                {/* speed, steerangle, gear */}
                {["speed", "steerangle", "gear"].map((key, i) => (
                  <ResponsiveContainer key={i} width="100%" height={200}>
                    <LineChart data={segment} syncId="segment-sync">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey={xAxisKey} tick={false} axisLine={false} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey={key} stroke="#8884d8" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )
}
