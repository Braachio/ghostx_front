// UploadIdPage.tsx

'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

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

export default function UploadIdPage() {
  const [message, setMessage] = useState('')
  const [result, setResult] = useState<ResultType | null>(null)
  const [userId, setUserId] = useState<string>('')

  const supabase = createPagesBrowserClient<Database>()

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data?.user?.id) {
        setUserId(data.user.id)
      }
    }
    fetchUser()
  }, [])

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
      setResult(data)
      setMessage('✅ 분석 완료')
    } catch (err) {
      console.error(err)
      setMessage('❌ 업로드 실패')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">📂 MoTeC CSV 업로드 분석</h2>
        <Link href="/">
          <button className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition">
            홈으로
          </button>
        </Link>
      </div>

      <div>
        <input
          id="csv-upload"
          type="file"
          accept=".csv"
          onChange={handleUpload}
          className="hidden"
        />
        <label
          htmlFor="csv-upload"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition"
        >
          📂 CSV 파일 선택
        </label>
      </div>

      {/* 안내 문구 */}
      <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl border border-blue-200 dark:border-gray-600">
        <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-2">📘 MoTeC CSV 내보내기 방법</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-200 space-y-1">
          <li>MoTeC <strong>i2 Pro</strong> 실행</li>
          <li><strong>[File] → [Export As...] → CSV</strong> 선택</li>
          <li>원하는 <strong>채널</strong>과 <strong>랩</strong> 선택 후 저장</li>
          <li>해당 CSV 파일을 이곳에 업로드하면 분석됩니다 ✅</li>
        </ul>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">※ 현재는 .ld 파일은 지원되지 않습니다.</p>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>

      {result && (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 space-y-4">
          {/* 트랙 및 차량 정보 */}
          <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
            <p><span className="font-semibold">🏁 트랙:</span> {result.track || '알 수 없음'}</p>
            <p><span className="font-semibold">🚗 차량:</span> {result.car || '알 수 없음'}</p>
          </div>

          {/* 주행 데이터 그래프 */}
          {result.data && Array.isArray(result.data) && (
            <div className="mt-6 space-y-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">📈 주행 입력값 시각화</h3>

              {/* Throttle */}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.data} syncId="shared-zoom">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="throttle" stroke="#82ca9d" dot={false} />
                </LineChart>
              </ResponsiveContainer>

              {/* Brake */}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.data} syncId="shared-zoom">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="brake" stroke="#ff7300" dot={false} />
                </LineChart>
              </ResponsiveContainer>

              {/* Steering Angle */}
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={result.data} syncId="shared-zoom">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="steerangle" stroke="#8884d8" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 전체 주행 스타일 리포트 */}
          {result.style_report && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">📊 전체 주행 스타일 분석</h3>
              <p className="text-sm text-gray-700 dark:text-gray-200">
                총 코너 수: <strong>{result.style_report.total_corners}</strong><br />
                주요 스타일: <strong>{result.style_report.main_style}</strong>
              </p>
              <div className="mt-2">
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">📌 스타일 분포:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-200">
                  {Object.entries(result.style_report.style_distribution).map(([style, count]) => (
                    <li key={style}>{style}: {count}회</li>
                  ))}
                </ul>
              </div>
              <div className="mt-2">
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-1">🧠 주행 피드백:</h4>
                <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-200">
                  {result.style_report.feedback.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* 코너별 분석 리포트 */}
          {result.corner_feedback && Array.isArray(result.corner_feedback) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">🏎️ 코너별 분석 리포트</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600">
                  <thead className="bg-gray-200 dark:bg-gray-700">
                    <tr>
                      <th className="px-3 py-2">코너</th>
                      <th className="px-3 py-2">진입속도</th>
                      <th className="px-3 py-2">최저속도</th>
                      <th className="px-3 py-2">탈출속도</th>
                      <th className="px-3 py-2">이상적 속도</th>
                      <th className="px-3 py-2">스타일</th>
                      <th className="px-3 py-2">피드백</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.corner_feedback.map((corner: CornerFeedback, idx: number) => (
                      <tr key={idx} className="border-t border-gray-300 dark:border-gray-600">
                        <td className="px-3 py-1">{corner.name}</td>
                        <td className="px-3 py-1">{corner.entry_speed} km/h</td>
                        <td className="px-3 py-1">{corner.min_speed} km/h</td>
                        <td className="px-3 py-1">{corner.exit_speed} km/h</td>
                        <td className="px-3 py-1">{corner.ideal_exit_speed} km/h</td>
                        <td className="px-3 py-1">{corner.style}</td>
                        <td className="px-3 py-1">{corner.feedback}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
