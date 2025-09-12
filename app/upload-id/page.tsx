'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import type { LapMeta, ResultType } from '@/types/upload'
import LapBrowser from '@/components/LapBrowser'
import LapUploadForm from '@/components/upload-id/LapUploadForm'
import LapDetailCard from '@/components/upload-id/LapDetailCard'
import SegmentAnalysis from '@/components/upload-id/SegmentAnalysis'
import { API_URL } from '@/lib/constants'

export default function UploadIdPage() {
  const [userId, setUserId] = useState('')
  const [message, setMessage] = useState('')
  const [lapList, setLapList] = useState<LapMeta[]>([])
  const [selectedLapId, setSelectedLapId] = useState('')
  const [result, setResult] = useState<ResultType | null>(null)
  const supabase = createPagesBrowserClient<Database>()

  // 🔑 유저 정보 및 랩 목록 불러오기
  useEffect(() => {
    const fetchUserAndLaps = async () => {
      const { data: userData } = await supabase.auth.getUser()
      const uid = userData?.user?.id
      if (!uid) return
      setUserId(uid)

      const { data: laps, error } = await supabase
        .from('lap_meta')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('랩 목록 불러오기 실패:', error)
        setMessage('❌ 랩 목록을 불러오지 못했습니다')
        return
      }

      if (laps) setLapList(laps)
    }
    fetchUserAndLaps()
  }, 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [])

  // 🧠 저장된 분석 결과 불러오기
  const fetchLapDetail = async (lapId: string) => {
    setMessage('📦 저장된 랩 데이터 불러오는 중...')
    try {
      const res = await fetch(`${API_URL}/api/lap/${lapId}`)
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

  return (
    <div className="bg-white dark:bg-gray-900 min-h-screen p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ACC 주행 분석</h2>
        <Link href="/">
          <button className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 transition">
            홈으로
          </button>
        </Link>
      </div>

      {/* 📤 업로드 영역 */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">CSV 업로드</h3>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <LapUploadForm
            userId={userId}
            setMessage={setMessage}
            setResult={setResult}
            setDisplayName={() => {}} // 사용하지 않음
          />
          <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">{message}</span>
        </div>
      </div>

      {/* 🗂 랩 목록 + 상세정보 */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">내 주행 목록</h3>
        <div className="flex items-start gap-x-6 flex-wrap">
          <div className="w-full max-w-md mb-4">
            <LapBrowser
              lapList={lapList}
              onSelect={(lapId) => {
                setSelectedLapId(lapId)
                setMessage('')
                fetchLapDetail(lapId)
              }}
            />
          </div>
          {selectedLapId && (
            <LapDetailCard
              lapList={lapList}
              selectedLapId={selectedLapId}
              setLapList={setLapList}
            />
          )}
        </div>
      </div>


      {/* 분석 결과 섹션 */}
      {result?.data && Array.isArray(result.data) && result.data.length > 0 && (
        <SegmentAnalysis result={result} />
      )}

    </div>
  )
}
