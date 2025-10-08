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
    <div className="bg-black min-h-screen py-6 relative overflow-hidden">
      {/* 배경 장식 요소 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-1 h-1 bg-blue-400 rounded-full animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 left-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse delay-500"></div>
        <div className="absolute top-1/2 right-10 w-1 h-1 bg-pink-400 rounded-full animate-pulse delay-700"></div>
        
        {/* 그리드 패턴 */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-16 gap-6 h-full">
            {Array.from({ length: 256 }).map((_, i) => (
              <div key={i} className="border border-gray-600"></div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-6 relative z-10">
        {/* 헤더 */}
        <div className="flex justify-between items-center border-b border-cyan-500 pb-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              👻 고스트 분석
            </h2>
            <p className="text-gray-300 mt-2">당신만의 고스트카를 만들어 랩타임을 단축하세요</p>
          </div>
          <div className="flex gap-3">
            {userId && (
              <Link href="/dashboard">
                <button className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/25 font-semibold">
                  📈 대시보드
                </button>
              </Link>
            )}
            <Link href="/">
              <button className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25 font-semibold">
                🏠 홈으로
              </button>
            </Link>
          </div>
        </div>

        {/* 📤 업로드 영역 */}
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-cyan-500/30 rounded-xl p-6 space-y-4 shadow-2xl shadow-cyan-500/10">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">📊 고스트 데이터 업로드</h3>
            <p className="text-gray-300">MoTeC CSV 파일을 업로드하여 당신만의 고스트카를 만들어보세요</p>
          </div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <LapUploadForm
            userId={userId}
            setMessage={setMessage}
            setResult={setResult}
            setDisplayName={() => {}} // 사용하지 않음
          />
          <span className="ml-auto text-sm text-cyan-400 font-semibold">{message}</span>
        </div>
        </div>

        {/* 🗂 랩 목록 + 상세정보 */}
        <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-blue-500/30 rounded-xl p-6 space-y-4 shadow-2xl shadow-blue-500/10">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-2">🏁 나의 고스트카 컬렉션</h3>
            <p className="text-gray-300">저장된 주행 데이터를 선택하여 상세 분석을 확인해보세요</p>
          </div>
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
          <div className="bg-gradient-to-br from-gray-900 to-black border-2 border-purple-500/30 rounded-xl p-6 shadow-2xl shadow-purple-500/10">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-white mb-2">👻 고스트 분석 결과</h3>
              <p className="text-gray-300">당신의 고스트카가 발견한 랩타임 단축의 비밀</p>
            </div>
            <SegmentAnalysis result={result} />
          </div>
        )}

      </div>
    </div>
  )
}
