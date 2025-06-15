'use client'

import { useState, useEffect } from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from 'recharts'

export default function UploadIdPage() {
  const [message, setMessage] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null)
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

    try {
      const res = await fetch('http://localhost:8000/analyze-motec-csv', {
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
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">📂 MoTeC CSV 업로드 분석</h2>

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
            className="inline-block px-2.5 py-0.8 bg-blue-600 text-white rounded-xl cursor-pointer hover:bg-blue-700 transition"
        >
            📂 CSV 파일 선택
        </label>
      </div>

      {/* ✅ 안내 문구 */}
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
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 space-y-3">
          {/* ✅ 트랙 및 차량 정보 표시 */}
          <div className="text-sm text-gray-800 dark:text-gray-200 space-y-1">
            <p><span className="font-semibold">🏁 트랙:</span> {result.track || '알 수 없음'}</p>
            <p><span className="font-semibold">🚗 차량:</span> {result.car || '알 수 없음'}</p>
          </div>

          {/* ✅ 전체 분석 결과 출력 
          <pre className="text-xs whitespace-pre-wrap break-words mt-2 text-gray-700 dark:text-gray-300">
            {JSON.stringify(result, null, 2)}
          </pre>*/}

          {/* ✅ 주행 데이터 그래프 */}
          {result.data && Array.isArray(result.data) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">📈 주행 데이터 시각화</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={result.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" label={{ value: '시간 (s)', position: 'insideBottomRight', offset: -5 }} />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="speed" stroke="#8884d8" dot={false} name="속도 (km/h)" />
                  <Line type="monotone" dataKey="throttle" stroke="#82ca9d" dot={false} name="스로틀 (%)" />
                  <Line type="monotone" dataKey="brake" stroke="#ff7300" dot={false} name="브레이크 (%)" />
                  <Line type="monotone" dataKey="steering" stroke="#ff6384" dot={false} name="스티어링" />
                  <Brush dataKey="time" height={20} stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
