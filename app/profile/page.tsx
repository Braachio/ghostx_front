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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="relative w-16 h-16 mx-auto mb-4">
                <div className="absolute inset-0 border-4 border-purple-500/30 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-purple-500 rounded-full border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-400 text-lg">Steam 프로필 불러오는 중...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-gradient-to-br from-red-900/20 to-red-800/20 border border-red-500/30 rounded-xl p-8 backdrop-blur-sm">
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400 mb-3">오류가 발생했습니다</h2>
              <p className="text-gray-300 mb-6">{error}</p>
              <Link 
                href="/login" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 text-white font-semibold"
              >
                <span>Steam 로그인</span>
                <span>→</span>
              </Link>
            </div>
          </div>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* 헤더 - 고스트카 테마 */}
        <div className="mb-8 text-center">
          <div className="inline-block mb-4">
            <div className="text-6xl animate-pulse">🏎️</div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            GHOST DRIVER PROFILE
          </h1>
          <p className="text-gray-400 text-lg">당신의 레이싱 통계를 확인하세요</p>
          <div className="mt-4 h-px w-64 mx-auto bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
        </div>

        {/* 프로필 카드 - 고스트 테마 */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
          <div className="relative bg-gradient-to-br from-gray-900/90 to-black/90 border border-purple-500/30 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl blur-md opacity-50"></div>
                <Image
                  src={profile.avatar}
                  alt={profile.username}
                  width={128}
                  height={128}
                  className="relative rounded-xl border-2 border-purple-400 shadow-lg"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {profile.username}
                </h2>
                <div className="flex flex-wrap gap-4 text-sm text-gray-300 mb-4 justify-center md:justify-start">
                  <div className="bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                    <span className="text-gray-400">Steam ID:</span>{' '}
                    <span className="font-mono text-purple-400">{profile.steamId}</span>
                  </div>
                  {profile.accountCreated && (
                    <div className="bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                      <span className="text-gray-400">가입일:</span>{' '}
                      <span className="text-blue-400">
                        {new Date(profile.accountCreated).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  )}
                </div>
                <a
                  href={profile.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-lg hover:shadow-purple-500/50 text-white font-semibold"
                >
                  <span>Steam 프로필 보기</span>
                  <span className="text-xl">→</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드들 - 네온 효과 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
            <div className="relative bg-gray-900/90 border border-blue-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-blue-400 text-sm mb-2 font-semibold">🎮 전체 게임</div>
              <div className="text-3xl font-bold text-white">{totalGames}<span className="text-lg text-gray-400">개</span></div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
            <div className="relative bg-gray-900/90 border border-purple-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-purple-400 text-sm mb-2 font-semibold">🏎️ 레이싱 게임</div>
              <div className="text-3xl font-bold text-white">{totalRacingGames}<span className="text-lg text-gray-400">개</span></div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
            <div className="relative bg-gray-900/90 border border-green-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-green-400 text-sm mb-2 font-semibold">⏱️ 전체 플레이</div>
              <div className="text-3xl font-bold text-white">{formatPlaytime(totalPlaytime)}</div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
            <div className="relative bg-gray-900/90 border border-orange-500/30 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-orange-400 text-sm mb-2 font-semibold">🔥 레이싱 플레이</div>
              <div className="text-3xl font-bold text-white">{formatPlaytime(totalRacingPlaytime)}</div>
            </div>
          </div>
        </div>

        {/* 레이싱 게임 통계 */}
        {racingGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">📊</div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                레이싱 게임 통계
              </h3>
            </div>
            <RacingStats games={racingGames} />
          </div>
        )}

        {/* 상위 레이싱 게임 */}
        {topRacingGames.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🏆</div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                가장 많이 플레이한 레이싱 게임
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topRacingGames.map((game, index) => {
                const racingGame = findRacingGame(game.appId)
                const rankColors = [
                  'from-yellow-500 to-orange-500',
                  'from-gray-400 to-gray-500',
                  'from-orange-600 to-orange-700'
                ]
                return (
                  <div
                    key={game.appId}
                    className="relative group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
                    <div className="relative bg-gray-900/90 border border-purple-500/30 rounded-xl p-5 backdrop-blur-sm hover:border-purple-400/50 transition-all">
                      <div className="flex items-center gap-4 mb-3">
                        {game.iconUrl && (
                          <Image
                            src={game.iconUrl}
                            alt={game.name}
                            width={48}
                            height={48}
                            className="rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white text-sm truncate">
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
                        <div className={`text-2xl font-bold bg-gradient-to-br ${rankColors[index] || 'from-gray-500 to-gray-600'} bg-clip-text text-transparent`}>
                          #{index + 1}
                        </div>
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {formatPlaytime(game.playtimeForever)}
                      </div>
                      {game.playtimeTwoWeeks > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          최근 2주: <span className="text-blue-400">{formatPlaytime(game.playtimeTwoWeeks)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 게임 목록 필터 */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="text-3xl">🎯</div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              전체 게임 목록
            </h3>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('racing')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                filter === 'racing'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              🏎️ 레이싱 게임 ({totalRacingGames})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
              }`}
            >
              🎮 전체 게임 ({totalGames})
            </button>
          </div>
        </div>

        {/* 게임 목록 테이블 */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-2xl blur-xl"></div>
          <div className="relative bg-gray-900/90 border border-purple-500/30 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-b border-purple-500/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-purple-300">
                      게임
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-purple-300">
                      플레이 시간
                    </th>
                    <th className="px-6 py-4 text-right text-sm font-bold text-purple-300">
                      최근 2주
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-purple-300">
                      카테고리
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-bold text-purple-300">
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
                          className="hover:bg-purple-900/10 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-4">
                              {game.iconUrl && (
                                <Image
                                  src={game.iconUrl}
                                  alt={game.name}
                                  width={40}
                                  height={40}
                                  className="rounded-lg"
                                />
                              )}
                              <div>
                                <div className="font-semibold text-white">
                                  {racingGame?.displayName || game.name}
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                  <div>App ID: {game.appId}</div>
                                  {racingGame ? (
                                    <div className="text-green-400">✅ 레이싱 게임 매핑됨</div>
                                  ) : (
                                    <div className="text-gray-600">❌ 레이싱 게임 아님</div>
                                  )}
                                  {!racingGame && (
                                    <div className="text-gray-600 italic">원본: {game.name}</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-purple-400">
                            {formatPlaytime(game.playtimeForever)}
                          </td>
                          <td className="px-6 py-4 text-right text-blue-400">
                            {game.playtimeTwoWeeks > 0
                              ? formatPlaytime(game.playtimeTwoWeeks)
                              : '-'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {racingGame && (
                              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-900/50 to-purple-900/50 text-blue-300 border border-blue-500/30">
                                {racingGame.category === 'sim' && '시뮬레이션'}
                                {racingGame.category === 'simcade' && '심케이드'}
                                {racingGame.category === 'arcade' && '아케이드'}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
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
        </div>

        {displayGames.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎮</div>
            <p className="text-gray-400 text-lg">
              {filter === 'racing'
                ? '레이싱 게임이 없습니다'
                : '게임이 없습니다'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
