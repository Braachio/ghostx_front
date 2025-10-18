'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'

interface Achievement {
  id: string
  displayName: string
  description: string
  icon: string
  iconGray: string
  hidden: boolean
  achieved: boolean
  unlockTime: string | null
}

interface AchievementData {
  appId: string
  gameName: string
  achievements: Achievement[]
  stats: {
    achieved: number
    total: number
    percentage: number
  }
}

interface AchievementModalProps {
  appId: number
  gameName?: string
  isOpen: boolean
  onClose: () => void
}

export default function AchievementModal({ appId, gameName, isOpen, onClose }: AchievementModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AchievementData | null>(null)
  const [filter, setFilter] = useState<'all' | 'achieved' | 'unachieved'>('all')

  useEffect(() => {
    if (isOpen && !data && !loading) {
      fetchAchievements()
    }
  }, [isOpen])

  async function fetchAchievements() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/steam/achievements/${appId}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch achievements')
      }

      const achievementData: AchievementData = await response.json()
      setData(achievementData)
    } catch (err) {
      console.error('Achievements fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const filteredAchievements = data?.achievements.filter(achievement => {
    switch (filter) {
      case 'achieved':
        return achievement.achieved
      case 'unachieved':
        return !achievement.achieved
      default:
        return true
    }
  }) || []

  const recentAchievements = data?.achievements
    .filter(a => a.achieved && a.unlockTime)
    .sort((a, b) => {
      if (!a.unlockTime || !b.unlockTime) return 0
      return new Date(b.unlockTime).getTime() - new Date(a.unlockTime).getTime()
    })
    .slice(0, 5) || []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">🏆 업적 목록</h2>
            {gameName && (
              <p className="text-sm text-gray-400 mt-1">{gameName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3 text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                <span>업적 불러오는 중...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6 text-center">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={fetchAchievements}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {data && (
            <div className="space-y-6">
              {/* 진행률 요약 */}
              <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold text-purple-400">🏆 업적 달성률</div>
                  <div className="text-3xl font-bold text-white">
                    {data.stats.percentage}%
                  </div>
                </div>
                <div className="text-sm text-gray-300 mb-4">
                  {data.stats.achieved} / {data.stats.total} 업적 달성
                </div>
                {/* 진행률 바 */}
                <div className="h-4 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${data.stats.percentage}%` }}
                  />
                </div>
              </div>

              {/* 최근 달성 업적 */}
              {recentAchievements.length > 0 && (
                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                  <h4 className="text-lg font-bold text-blue-400 mb-4">🌟 최근 달성한 업적</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {recentAchievements.map(achievement => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg"
                      >
                        <Image
                          src={achievement.icon}
                          alt={achievement.displayName}
                          width={40}
                          height={40}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {achievement.displayName}
                          </div>
                          <div className="text-xs text-gray-400">
                            {achievement.unlockTime && 
                              new Date(achievement.unlockTime).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            }
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 필터 및 업적 목록 */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-gray-300">전체 업적</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        filter === 'all' 
                          ? 'bg-purple-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      전체 ({data.achievements.length})
                    </button>
                    <button
                      onClick={() => setFilter('achieved')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        filter === 'achieved' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      달성 ({data.stats.achieved})
                    </button>
                    <button
                      onClick={() => setFilter('unachieved')}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        filter === 'unachieved' 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      미달성 ({data.stats.total - data.stats.achieved})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
                        achievement.achieved
                          ? 'bg-green-900/20 border border-green-500/20'
                          : 'bg-gray-800/50 border border-gray-700/50 opacity-60'
                      }`}
                    >
                      <Image
                        src={achievement.achieved ? achievement.icon : achievement.iconGray}
                        alt={achievement.displayName}
                        width={48}
                        height={48}
                        className="rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${
                          achievement.achieved ? 'text-white' : 'text-gray-400'
                        }`}>
                          {achievement.displayName}
                          {achievement.achieved && (
                            <span className="ml-2 text-green-400">✓</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {achievement.description}
                        </div>
                        {achievement.achieved && achievement.unlockTime && (
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(achievement.unlockTime).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredAchievements.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    {filter === 'achieved' && '달성한 업적이 없습니다.'}
                    {filter === 'unachieved' && '미달성 업적이 없습니다.'}
                    {filter === 'all' && '업적이 없습니다.'}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
