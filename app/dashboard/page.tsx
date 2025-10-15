'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FAQ_LIST } from '@/components/faqData'
import { fetchDashboardOverview } from '@/lib/dashboardApi'
import DashboardOverview from '@/components/dashboard/DashboardOverview'
import PerformanceTrends from '@/components/dashboard/PerformanceTrends'
import BrakingAnalysis from '@/components/dashboard/BrakingAnalysis'
import Leaderboard from '@/components/dashboard/Leaderboard'

type TabType = 'overview' | 'trends' | 'braking' | 'leaderboard'

export default function DashboardPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [userId, setUserId] = useState('')
  const [hasData, setHasData] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showFAQ, setShowFAQ] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [selectedTrack, setSelectedTrack] = useState('')
  const [selectedDays, setSelectedDays] = useState(30)
  const [trackOptions, setTrackOptions] = useState<string[]>([])

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/me')
        if (!res.ok) throw new Error('인증 필요')
        const result = await res.json()
        setNickname(result.user.nickname)
        setUserId(result.user.id)
        // 테스트를 위해 임시로 데이터가 있다고 설정
        setHasData(true)
        console.log('User data:', result.user)
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error('인증 오류:', err.message)
        }
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [router])

  // Load available tracks dynamically from recent laps
  useEffect(() => {
    const loadTracks = async () => {
      try {
        if (!userId) return
        const overview = await fetchDashboardOverview(userId, undefined, selectedDays)
        const uniqueTracks = Array.from(new Set((overview.recent_laps || []).map(l => l.track).filter(Boolean)))
        setTrackOptions(uniqueTracks)
        // If a previously selected track no longer exists, reset to all
        if (selectedTrack && !uniqueTracks.includes(selectedTrack)) {
          setSelectedTrack('')
        }
        console.log('로드된 트랙 옵션:', uniqueTracks)
      } catch (e) {
        console.warn('트랙 옵션 로드 실패:', e)
        setTrackOptions([])
      }
    }
    loadTracks()
  }, [userId, selectedDays, selectedTrack])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6 text-center">
          <h1 className="text-2xl font-bold mb-6 text-gray-900">{nickname}님, 환영합니다!</h1>
          
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-lg font-semibold mb-2">데이터 준비 중</h2>
            <p className="text-gray-600 mb-4">
              레이싱 데이터를 업로드하면 상세한 분석 대시보드를 확인할 수 있습니다.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push('/upload-id')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg transition font-medium"
            >
              📈 데이터 업로드하기
            </button>

            <button
              onClick={() => router.push('/multis')}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg transition font-medium"
            >
              🗓️ 멀티 일정 보기
            </button>

            <button
              onClick={() => setShowFAQ(true)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg transition font-medium"
            >
              ❓ FAQ 보기
            </button>
          </div>

          <div className="mt-8">
            <button
              onClick={async () => {
                // 현재 사용자가 Steam 사용자인지 확인
                const meResponse = await fetch('/api/me')
                const meData = await meResponse.json()
                
                await fetch('/api/logout', { method: 'POST' })
                
                // Steam 사용자라면 익명 ID 삭제 (Steam 로그인 시 익명 ID와 충돌 방지)
                if (meData.user?.email && !meData.user.email.includes('anonymous_')) {
                  localStorage.removeItem('ghostx_anonymous_id')
                }
                
                router.push('/login')
              }}
              className="text-sm text-gray-500 hover:underline"
            >
              로그아웃
            </button>
          </div>
        </div>

        {/* FAQ 모달 */}
        {showFAQ && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-lg max-h-[80vh] overflow-y-auto">
              <h2 className="text-lg font-bold mb-4">❓ 자주 묻는 질문 (FAQ)</h2>
              <div className="space-y-3 text-sm text-gray-700">
                {FAQ_LIST.map((item, index) => (
                  <div key={index}>
                    <strong>Q. {item.question}</strong>
                    <p className="pl-2">A. {item.answer}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 text-right">
                <button
                  onClick={() => setShowFAQ(false)}
                  className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                🏁 GhostX 대시보드
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                <i className="fas fa-user mr-2"></i>
                {nickname}님
              </span>
              <div className="flex items-center space-x-2">
                <Link
                  href="/"
                  className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  🏠 홈
                </Link>
                <Link
                  href="/multis"
                  className="text-sm px-3 py-1 bg-cyan-100 text-cyan-700 rounded-md hover:bg-cyan-200 transition-colors"
                >
                  🗓️ 커뮤니티
                </Link>
                <Link
                  href="/upload-id"
                  className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  📊 분석
                </Link>
              </div>
              <button
                onClick={async () => {
                  // 현재 사용자가 Steam 사용자인지 확인
                  const meResponse = await fetch('/api/me')
                  const meData = await meResponse.json()
                  
                  await fetch('/api/logout', { method: 'POST' })
                  
                  // Steam 사용자라면 익명 ID 삭제 (Steam 로그인 시 익명 ID와 충돌 방지)
                  if (meData.user?.email && !meData.user.email.includes('anonymous_')) {
                    localStorage.removeItem('ghostx_anonymous_id')
                  }
                  
                  router.push('/login')
                }}
                className="text-sm text-gray-500 hover:underline"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                필터
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    트랙
                  </label>
                  <select
                    value={selectedTrack}
                    onChange={(e) => setSelectedTrack(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">모든 트랙</option>
                    {trackOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    기간
                  </label>
                  <select
                    value={selectedDays}
                    onChange={(e) => setSelectedDays(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={7}>최근 7일</option>
                    <option value={30}>최근 30일</option>
                    <option value={90}>최근 90일</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-white rounded-lg shadow-sm p-4 mt-4">
              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-chart-line mr-2"></i>
                  대시보드 개요
                </button>
                <button
                  onClick={() => setActiveTab('trends')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'trends'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-chart-area mr-2"></i>
                  성능 트렌드
                </button>
                <button
                  onClick={() => setActiveTab('braking')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'braking'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-car-crash mr-2"></i>
                  브레이킹 분석
                </button>
                <button
                  onClick={() => setActiveTab('leaderboard')}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'leaderboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className="fas fa-trophy mr-2"></i>
                  리더보드
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'overview' && (
              <DashboardOverview
                userId={userId}
                track={selectedTrack}
                days={selectedDays}
              />
            )}
            {activeTab === 'trends' && (
              <PerformanceTrends
                userId={userId}
                track={selectedTrack}
                days={selectedDays}
              />
            )}
            {activeTab === 'braking' && (
              <BrakingAnalysis
                userId={userId}
                track={selectedTrack}
                days={selectedDays}
              />
            )}
            {activeTab === 'leaderboard' && (
              <Leaderboard
                track={selectedTrack || 'seoul-circuit'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
