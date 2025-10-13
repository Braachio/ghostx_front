'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface VotingSchedule {
  id: string
  regular_event_id: string
  week_number: number
  year: number
  voting_start_time: string
  voting_end_time: string
  is_processed: boolean
  created_at: string
  multis: {
    title: string
    game: string
    multi_day: string[]
    auto_voting_enabled: boolean
  }
}

interface ScheduleStatus {
  isActive: boolean
  shouldOpen: boolean
  shouldClose: boolean
  timeToStart: number
  timeToEnd: number
}

interface VotingScheduleWithStatus extends VotingSchedule {
  status: ScheduleStatus
}

export default function VotingSchedulesPage() {
  const [schedules, setSchedules] = useState<VotingScheduleWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [lastProcessed, setLastProcessed] = useState<string>('')

  const fetchSchedules = async () => {
    try {
      const response = await fetch('/api/voting/auto-process')
      if (response.ok) {
        const data = await response.json()
        setSchedules(data.schedules || [])
      } else {
        console.error('투표 스케줄 조회 실패')
      }
    } catch (error) {
      console.error('투표 스케줄 조회 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const processSchedules = async () => {
    setProcessing(true)
    try {
      const response = await fetch('/api/voting/auto-process', {
        method: 'POST'
      })
      if (response.ok) {
        const result = await response.json()
        setLastProcessed(new Date().toLocaleString())
        alert(`자동 투표 처리 완료!\n처리된 스케줄: ${result.processed.total}개\n투표 재개: ${result.processed.opened}개\n투표 종료: ${result.processed.closed}개\n투표 결과 적용: ${result.processed.appliedResults}개`)
        await fetchSchedules()
      } else {
        const error = await response.json()
        alert(`처리 실패: ${error.error}`)
      }
    } catch (error) {
      console.error('자동 투표 처리 오류:', error)
      alert('자동 투표 처리 중 오류가 발생했습니다.')
    } finally {
      setProcessing(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusBadge = (status: ScheduleStatus, isProcessed: boolean) => {
    if (status.isActive) {
      return <span className="px-2 py-1 bg-green-900/30 border border-green-500/30 rounded text-xs text-green-300">🟢 투표 진행중</span>
    } else if (status.shouldOpen && !isProcessed) {
      return <span className="px-2 py-1 bg-yellow-900/30 border border-yellow-500/30 rounded text-xs text-yellow-300">⏰ 시작 대기</span>
    } else if (status.shouldClose && isProcessed) {
      return <span className="px-2 py-1 bg-red-900/30 border border-red-500/30 rounded text-xs text-red-300">🔴 종료 대기</span>
    } else {
      return <span className="px-2 py-1 bg-gray-900/30 border border-gray-500/30 rounded text-xs text-gray-300">⏸️ 대기중</span>
    }
  }

  const getTimeRemaining = (timeToStart: number, timeToEnd: number, isActive: boolean) => {
    if (isActive) {
      const hours = Math.floor(timeToEnd / (1000 * 60 * 60))
      const minutes = Math.floor((timeToEnd % (1000 * 60 * 60)) / (1000 * 60))
      return `종료까지 ${hours}시간 ${minutes}분`
    } else {
      const hours = Math.floor(timeToStart / (1000 * 60 * 60))
      const minutes = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60))
      return `시작까지 ${hours}시간 ${minutes}분`
    }
  }

  useEffect(() => {
    fetchSchedules()
    
    // 1분마다 자동 새로고침
    const interval = setInterval(fetchSchedules, 60000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                🤖 자동 투표 스케줄 관리
              </h1>
              <p className="text-gray-400">정기 이벤트의 자동 투표 시작/종료를 관리합니다</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchSchedules}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                🔄 새로고침
              </button>
              <button
                onClick={processSchedules}
                disabled={processing}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {processing ? '처리중...' : '⚡ 자동 처리'}
              </button>
            </div>
          </div>
          
          {lastProcessed && (
            <div className="mt-4 text-sm text-gray-400">
              마지막 처리: {lastProcessed}
            </div>
          )}
        </div>

        {/* 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-900/20 to-blue-800/20 border border-blue-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{schedules.length}</div>
            <div className="text-sm text-gray-400">전체 스케줄</div>
          </div>
          <div className="bg-gradient-to-br from-green-900/20 to-green-800/20 border border-green-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">
              {schedules.filter(s => s.status.isActive).length}
            </div>
            <div className="text-sm text-gray-400">투표 진행중</div>
          </div>
          <div className="bg-gradient-to-br from-yellow-900/20 to-yellow-800/20 border border-yellow-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400">
              {schedules.filter(s => s.status.shouldOpen).length}
            </div>
            <div className="text-sm text-gray-400">시작 대기</div>
          </div>
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">
              {schedules.filter(s => s.status.shouldClose).length}
            </div>
            <div className="text-sm text-gray-400">종료 대기</div>
          </div>
        </div>

        {/* 스케줄 목록 */}
        <div className="bg-gradient-to-br from-gray-900/95 to-black/95 border border-gray-700 rounded-2xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-6">투표 스케줄 목록</h2>
          
          {schedules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg mb-2">📅 등록된 투표 스케줄이 없습니다</div>
              <div className="text-gray-500 text-sm">자동 투표가 활성화된 정기 이벤트를 생성하면 여기에 표시됩니다</div>
            </div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div key={schedule.id} className="bg-gray-800/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {schedule.multis.title}
                        </h3>
                        {getStatusBadge(schedule.status, schedule.is_processed)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">게임:</span>
                          <span className="text-white ml-2">{schedule.multis.game}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">요일:</span>
                          <span className="text-white ml-2">{schedule.multis.multi_day.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">주차:</span>
                          <span className="text-white ml-2">{schedule.year}년 {schedule.week_number}주차</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                        <div>
                          <span className="text-gray-400">투표 시작:</span>
                          <span className="text-white ml-2">{formatTime(schedule.voting_start_time)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">투표 종료:</span>
                          <span className="text-white ml-2">{formatTime(schedule.voting_end_time)}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm">
                        <span className="text-gray-400">상태:</span>
                        <span className="text-white ml-2">
                          {getTimeRemaining(
                            schedule.status.timeToStart,
                            schedule.status.timeToEnd,
                            schedule.status.isActive
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 하단 네비게이션 */}
        <div className="mt-8 flex justify-center">
          <Link href="/admin">
            <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
              ← 관리자 메인으로
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}
