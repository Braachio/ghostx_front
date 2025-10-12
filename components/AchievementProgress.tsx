'use client'

import { useState } from 'react'
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

interface AchievementProgressProps {
  appId: number
  gameName?: string
}

export default function AchievementProgress({ appId }: AchievementProgressProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AchievementData | null>(null)
  const [showAll, setShowAll] = useState(false)

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

  if (!data && !loading && !error) {
    return (
      <button
        onClick={fetchAchievements}
        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white text-sm font-medium"
      >
        🏆 업적 불러오기
      </button>
    )
  }

  if (loading) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-center gap-2 text-gray-400">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
          <span>업적 불러오는 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
        <div className="text-red-400 text-sm">{error}</div>
        <button
          onClick={fetchAchievements}
          className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors"
        >
          다시 시도
        </button>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const displayAchievements = showAll 
    ? data.achievements 
    : data.achievements.slice(0, 10)

  const recentAchievements = data.achievements
    .filter(a => a.achieved && a.unlockTime)
    .sort((a, b) => {
      if (!a.unlockTime || !b.unlockTime) return 0
      return new Date(b.unlockTime).getTime() - new Date(a.unlockTime).getTime()
    })
    .slice(0, 5)

  return (
    <div className="space-y-4">
      {/* 진행률 요약 */}
      <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-purple-400">🏆 업적 달성률</div>
          <div className="text-2xl font-bold text-white">
            {data.stats.percentage}%
          </div>
        </div>
        <div className="text-sm text-gray-300 mb-3">
          {data.stats.achieved} / {data.stats.total} 업적 달성
        </div>
        {/* 진행률 바 */}
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${data.stats.percentage}%` }}
          />
        </div>
      </div>

      {/* 최근 달성 업적 */}
      {recentAchievements.length > 0 && (
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-bold text-blue-400 mb-3">🌟 최근 달성한 업적</h4>
          <div className="space-y-2">
            {recentAchievements.map(achievement => (
              <div
                key={achievement.id}
                className="flex items-center gap-3 p-2 bg-blue-900/20 border border-blue-500/20 rounded-lg"
              >
                <Image
                  src={achievement.icon}
                  alt={achievement.displayName}
                  width={32}
                  height={32}
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

      {/* 업적 목록 */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-bold text-gray-300 mb-3">전체 업적</h4>
        <div className="space-y-2">
          {displayAchievements.map(achievement => (
            <div
              key={achievement.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                achievement.achieved
                  ? 'bg-green-900/20 border border-green-500/20'
                  : 'bg-gray-800/50 border border-gray-700/50 opacity-60'
              }`}
            >
              <Image
                src={achievement.achieved ? achievement.icon : achievement.iconGray}
                alt={achievement.displayName}
                width={32}
                height={32}
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
              </div>
              {achievement.achieved && achievement.unlockTime && (
                <div className="text-xs text-gray-400">
                  {new Date(achievement.unlockTime).toLocaleDateString('ko-KR', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {data.achievements.length > 10 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="mt-3 w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-sm text-gray-300"
          >
            {showAll 
              ? '접기' 
              : `${data.achievements.length - 10}개 더 보기`
            }
          </button>
        )}
      </div>
    </div>
  )
}

