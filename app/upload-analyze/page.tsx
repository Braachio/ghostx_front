'use client'

import { useState } from 'react'
import Papa, { ParseResult, ParseError } from 'papaparse'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Brush,
} from 'recharts'

interface RawRow {
  TIME: string
  LAP_BEACON?: string
  DISTANCE?: string
  THROTTLE: string
  BRAKE: string
  SPEED: string
  STEERANGLE: string
}

interface ConvertedRow {
  time: number
  distance: number
  throttle: number
  brake: number
  speed: number
  steering: number
}

const metricColors: Record<string, string> = {
  speed: '#1E90FF',
  throttle: '#22C55E',
  brake: '#EF4444',
  steering: '#A855F7',
}

export default function UploadAnalyzePage() {
  const [message, setMessage] = useState('')
  const [data, setData] = useState<ConvertedRow[]>([])
  const [xAxisType, setXAxisType] = useState<'time' | 'distance'>('time')
  const [feedbackList, setFeedbackList] = useState<string[]>([])

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length !== 2) {
      setMessage("⚠️ 두 개의 CSV 파일을 업로드해주세요.")
      return
    }

    setMessage('CSV 변환 및 분석 중...')
    setFeedbackList([])
    setData([])

    const [text1, text2] = await Promise.all(files.map(file => file.text()))

    // ✅ 파일1 → 시각화용
    Papa.parse<RawRow>(text1, {
      header: true,
      complete: async (result: ParseResult<RawRow>) => {
        const converted: ConvertedRow[] = result.data.map((row) => ({
          time: parseFloat(row.TIME),
          distance: parseFloat(row.LAP_BEACON || row.DISTANCE || '0'),
          throttle: parseFloat(row.THROTTLE) / 100,
          brake: parseFloat(row.BRAKE),
          speed: parseFloat(row.SPEED),
          steering: parseFloat(row.STEERANGLE),
        })).filter(r => !isNaN(r.time))

        setData(converted)
        setMessage(`✅ ${converted.length}개 데이터 분석 완료`)
      },
      error: (err: ParseError) => {
        setMessage(`❌ 파싱 실패: ${String(err.message || err)}`)
      },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)

    // ✅ 파일1 vs 파일2 비교 분석 요청
    const res = await fetch('http://localhost:8000/compare-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        base_csv: text1,
        target_csv: text2,
      }),
    })

    const result = await res.json()
    setFeedbackList(result.feedback || [])
  }

  return (
    <div className="p-6 max-w-6xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-lg space-y-8">
      <h2 className="text-3xl font-extrabold">🚀 MoTeC CSV 비교 분석</h2>

      <input
        type="file"
        accept=".csv"
        multiple
        onChange={handleFiles}
        className="mb-4"
      />

      <div className="mb-4">
        <label className="mr-2 font-semibold">X축 선택:</label>
        <select
          value={xAxisType}
          onChange={(e) => setXAxisType(e.target.value as 'time' | 'distance')}
          className="p-2 border text-black"
        >
          <option value="time">시간 (s)</option>
          <option value="distance">거리 (m)</option>
        </select>
      </div>

      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{message}</p>

      {feedbackList.length > 0 && (
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-gray-800 rounded-xl shadow">
          <h3 className="text-xl font-bold mb-3">📊 주행 피드백</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {feedbackList.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {data.length > 0 && (
        <div className="grid grid-cols-1 gap-8">
          {(['speed', 'throttle', 'brake', 'steering'] as const).map((metric) => (
            <div key={metric} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-3">{metric.toUpperCase()}</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey={xAxisType}
                    label={{
                      value: xAxisType === 'time' ? '시간 (s)' : '거리 (m)',
                      position: 'insideBottomRight',
                      offset: -5
                    }}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey={metric}
                    stroke={metricColors[metric]}
                    strokeWidth={2}
                    dot={false}
                  />
                  <Brush dataKey={xAxisType} height={20} stroke={metricColors[metric]} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
