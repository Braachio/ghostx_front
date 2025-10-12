'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { findRacingGame, isRacingGame } from '@/lib/racingGames'
import RacingStats from '@/components/RacingStats'
import AchievementProgress from '@/components/AchievementProgress'

interface SteamProfile {
  steamId: string
  username: string
  profileUrl: string
  avatar: string
  avatarMedium: string
  accountCreated: string | null
}

interface SteamGame {
  appId: number
  name: string
  playtimeForever: number
  playtimeTwoWeeks: number
  iconUrl: string | null
  logoUrl: string | null
}

interface ProfileData {
  profile: SteamProfile
  games: SteamGame[]
  recentGames: SteamGame[]
  totalGames: number
  totalPlaytime: number
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [filter, setFilter] = useState<'all' | 'racing'>('racing')

  useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/steam/profile')
      
      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (response.status === 404) {
        setError('Steam 계정이 연동되지 않았습니다. Steam으로 로그인해주세요.')
        return
      }

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch profile')
      }

      const data: ProfileData = await response.json()
      setProfileData(data)
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Steam 프로필 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
          <h2 className="text-xl font-bold text-red-400 mb-2">오류</h2>
          <p className="text-gray-300">{error}</p>
          <Link 
            href="/login" 
            className="mt-4 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Steam 로그인
          </Link>
        </div>
      </div>
    )
  }

  if (!profileData) {
    return null
  }

  const { profile, games, totalGames, totalPlaytime } = profileData

  // 레이싱 게임만 필터링
  const racingGames = games.filter(game => isRacingGame(game.appId))
  const displayGames = filter === 'racing' ? racingGames : games

  // 레이싱 게임 통계
  const totalRacingPlaytime = racingGames.reduce(
    (sum, game) => sum + game.playtimeForever,
    0
  )
  const totalRacingGames = racingGames.length

  // 플레이 시간 포맷
  function formatPlaytime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}분`
    }
    const hours = Math.floor(minutes / 60)
    if (hours < 100) {
      return `${hours}시간`
    }
    return `${hours.toLocaleString()}시간`
  }

  // 상위 레이싱 게임 (플레이 시간 기준)
  const topRacingGames = [...racingGames]
    .sort((a, b) => b.playtimeForever - a.playtimeForever)
    .slice(0, 5)

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🎮 Steam 프로필</h1>
        <p className="text-gray-400">레이싱 게임 통계 및 업적 현황</p>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-6">
          <Image
            src={profile.avatar}
            alt={profile.username}
            width={128}
            height={128}
            className="rounded-lg border-2 border-blue-500/50"
          />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {profile.username}
            </h2>
            <div className="flex gap-4 text-sm text-gray-300 mb-4">
              <div>
                <span className="text-gray-400">Steam ID:</span>{' '}
                <span className="font-mono">{profile.steamId}</span>
              </div>
              {profile.accountCreated && (
                <div>
                  <span className="text-gray-400">가입일:</span>{' '}
                  {new Date(profile.accountCreated).toLocaleDateString('ko-KR')}
                </div>
              )}
            </div>
            <a
              href={profile.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-white"
            >
              <span>Steam 프로필 보기</span>
              <span>→</span>
            </a>
          </div>
        </div>
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">전체 게임</div>
          <div className="text-2xl font-bold text-white">{totalGames}개</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">레이싱 게임</div>
          <div className="text-2xl font-bold text-blue-400">{totalRacingGames}개</div>
        </div>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">전체 플레이 시간</div>
          <div className="text-2xl font-bold text-white">
            {formatPlaytime(totalPlaytime)}
          </div>
        </div>
        <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">레이싱 플레이 시간</div>
          <div className="text-2xl font-bold text-purple-400">
            {formatPlaytime(totalRacingPlaytime)}
          </div>
        </div>
      </div>

      {/* 레이싱 게임 통계 */}
      {racingGames.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-4">📊 레이싱 게임 통계</h3>
          <RacingStats games={racingGames} />
        </div>
      )}

      {/* 상위 레이싱 게임 */}
      {topRacingGames.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white mb-4">🏆 가장 많이 플레이한 레이싱 게임</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topRacingGames.map((game, index) => {
              const racingGame = findRacingGame(game.appId)
              return (
                <div
                  key={game.appId}
                  className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-4 hover:border-purple-400/50 transition-all"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {game.iconUrl && (
                      <Image
                        src={game.iconUrl}
                        alt={game.name}
                        width={32}
                        height={32}
                        className="rounded"
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-white text-sm">
                        {racingGame?.displayName || game.name}
                      </div>
                      {racingGame && (
                        <div className="text-xs text-gray-400">
                          {racingGame.category === 'sim' && '🏎️ 시뮬레이션'}
                          {racingGame.category === 'simcade' && '🎮 심케이드'}
                          {racingGame.category === 'arcade' && '🕹️ 아케이드'}
                        </div>
                      )}
                    </div>
                    <div className="text-2xl font-bold text-purple-400">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {formatPlaytime(game.playtimeForever)}
                  </div>
                  {game.playtimeTwoWeeks > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      최근 2주: {formatPlaytime(game.playtimeTwoWeeks)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 게임 목록 필터 */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('racing')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'racing'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🏎️ 레이싱 게임 ({totalRacingGames})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
          }`}
        >
          🎮 전체 게임 ({totalGames})
        </button>
      </div>

      {/* 게임 목록 */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-300">
                  게임
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                  플레이 시간
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                  최근 2주
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                  카테고리
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-300">
                  업적
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {displayGames
                .sort((a, b) => b.playtimeForever - a.playtimeForever)
                .map(game => {
                  const racingGame = findRacingGame(game.appId)
                  return (
                    <tr
                      key={game.appId}
                      className="hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {game.iconUrl && (
                            <Image
                              src={game.iconUrl}
                              alt={game.name}
                              width={32}
                              height={32}
                              className="rounded"
                            />
                          )}
                          <div>
                            <div className="font-medium text-white">
                              {racingGame?.displayName || game.name}
                            </div>
                            {racingGame && (
                              <div className="text-xs text-gray-400">
                                App ID: {game.appId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-white">
                        {formatPlaytime(game.playtimeForever)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-300">
                        {game.playtimeTwoWeeks > 0
                          ? formatPlaytime(game.playtimeTwoWeeks)
                          : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {racingGame && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-900/30 text-blue-300">
                            {racingGame.category === 'sim' && '시뮬레이션'}
                            {racingGame.category === 'simcade' && '심케이드'}
                            {racingGame.category === 'arcade' && '아케이드'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {racingGame && (
                          <AchievementProgress 
                            appId={game.appId} 
                            gameName={racingGame.displayName}
                          />
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>

      {displayGames.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          {filter === 'racing'
            ? '레이싱 게임이 없습니다'
            : '게임이 없습니다'}
        </div>
      )}
    </div>
  )
}

