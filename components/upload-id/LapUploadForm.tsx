'use client'
import React from 'react'
import { API_URL } from '@/lib/constants'
import type { ResultType } from '@/types/upload'

interface Props {
  userId: string
  setMessage: (msg: string) => void
  setResult: (data: ResultType | null) => void
  setDisplayName: (value: string) => void
}

export default function LapUploadForm({ userId, setMessage, setResult, setDisplayName }: Props) {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!userId) {
      setMessage('❌ 로그인 후 이용해주세요')
      alert('로그인 후 이용해주세요 🔐')
      return
    }

    if (!file) return

    setMessage('업로드 중...')
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId)
    formData.append('save', 'true')
    formData.append('weather', 'sunny')
    formData.append('air_temp', '25')
    formData.append('track_temp', '32')
    formData.append('display_name', '')

    try {
      const res = await fetch(`${API_URL}/api/analyze-motec-csv`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        if (res.status === 409 && data?.error?.includes('중복된 랩')) {
          setMessage('❌ 중복된 랩 데이터입니다.')
        } else {
          setMessage(`❌ 에러: ${data?.error || '알 수 없는 오류'}`)
        }
        return
      }

      setResult(data)
      setMessage('✅ 분석 완료')
      setDisplayName('')
    } catch (err) {
      console.error(err)
      setMessage('❌ 업로드 실패')
    }
  }

  return (
    <div className="flex items-center w-full sm:w-auto gap-3">
      <input id="csv-upload" type="file" accept=".csv" onChange={handleUpload} className="hidden" />
      <label
        htmlFor="csv-upload"
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
      >
        📤 CSV 업로드
      </label>
      <a
        href="/docs/motec_csv_guide.html"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 hover:underline"
      >
        MoTeC 변환 가이드
      </a>
    </div>
  )
}
