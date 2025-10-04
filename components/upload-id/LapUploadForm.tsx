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
    <div className="flex items-center w-full sm:w-auto gap-4">
      <input id="csv-upload" type="file" accept=".csv" onChange={handleUpload} className="hidden" />
      <label
        htmlFor="csv-upload"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-cyan-500/30 text-sm text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 font-semibold cursor-pointer"
      >
        📤 고스트 데이터 업로드
      </label>
      <a
        href="/docs/motec_csv_guide.html"
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
      >
        👻 MoTeC 변환 가이드
      </a>
    </div>
  )
}
