'use client'

import { useMemo } from 'react'
import { findRacingGame } from '@/lib/racingGames'

interface SteamGame {
  appId: number
  name: string
  playtimeForever: number
  playtimeTwoWeeks: number
}

interface RacingStatsProps {
  games: SteamGame[]
}

export default function RacingStats({ games }: RacingStatsProps) {
  const stats = useMemo(() => {
    const simGames: SteamGame[] = []
    const simcadeGames: SteamGame[] = []
    const arcadeGames: SteamGame[] = []

    games.forEach(game => {
      const racingGame = findRacingGame(game.appId)
      if (!racingGame) return

      if (racingGame.category === 'sim') simGames.push(game)
      else if (racingGame.category === 'simcade') simcadeGames.push(game)
      else if (racingGame.category === 'arcade') arcadeGames.push(game)
    })

    const simPlaytime = simGames.reduce((sum, g) => sum + g.playtimeForever, 0)
    const simcadePlaytime = simcadeGames.reduce((sum, g) => sum + g.playtimeForever, 0)
    const arcadePlaytime = arcadeGames.reduce((sum, g) => sum + g.playtimeForever, 0)
    const totalPlaytime = simPlaytime + simcadePlaytime + arcadePlaytime

    return {
      sim: { games: simGames, playtime: simPlaytime, percentage: totalPlaytime > 0 ? (simPlaytime / totalPlaytime) * 100 : 0 },
      simcade: { games: simcadeGames, playtime: simcadePlaytime, percentage: totalPlaytime > 0 ? (simcadePlaytime / totalPlaytime) * 100 : 0 },
      arcade: { games: arcadeGames, playtime: arcadePlaytime, percentage: totalPlaytime > 0 ? (arcadePlaytime / totalPlaytime) * 100 : 0 },
      total: totalPlaytime,
    }
  }, [games])

  function formatPlaytime(minutes: number): string {
    if (minutes < 60) return `${minutes}분`
    const hours = Math.floor(minutes / 60)
    return `${hours.toLocaleString()}시간`
  }

  if (stats.total === 0) {
    return (
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-6">
        <div className="text-center text-gray-400">
          레이싱 게임 플레이 기록이 없습니다
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 총 플레이 시간 */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-2">🏎️ 레이싱 게임 총 플레이 시간</h3>
        <div className="text-4xl font-bold text-purple-400">
          {formatPlaytime(stats.total)}
        </div>
        <div className="text-sm text-gray-400 mt-2">
          {stats.sim.games.length + stats.simcade.games.length + stats.arcade.games.length}개의 레이싱 게임
        </div>
      </div>

      {/* 카테고리별 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 시뮬레이션 */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-blue-400">🏎️ 시뮬레이션</div>
            <div className="text-xs text-gray-400">
              {stats.sim.percentage.toFixed(0)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatPlaytime(stats.sim.playtime)}
          </div>
          <div className="text-xs text-gray-400">
            {stats.sim.games.length}개 게임
          </div>
          {/* 진행률 바 */}
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${stats.sim.percentage}%` }}
            />
          </div>
        </div>

        {/* 심케이드 */}
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-green-400">🎮 심케이드</div>
            <div className="text-xs text-gray-400">
              {stats.simcade.percentage.toFixed(0)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatPlaytime(stats.simcade.playtime)}
          </div>
          <div className="text-xs text-gray-400">
            {stats.simcade.games.length}개 게임
          </div>
          {/* 진행률 바 */}
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 transition-all duration-500"
              style={{ width: `${stats.simcade.percentage}%` }}
            />
          </div>
        </div>

        {/* 아케이드 */}
        <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-orange-400">🕹️ 아케이드</div>
            <div className="text-xs text-gray-400">
              {stats.arcade.percentage.toFixed(0)}%
            </div>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {formatPlaytime(stats.arcade.playtime)}
          </div>
          <div className="text-xs text-gray-400">
            {stats.arcade.games.length}개 게임
          </div>
          {/* 진행률 바 */}
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500"
              style={{ width: `${stats.arcade.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* 카테고리별 게임 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 시뮬레이션 게임 */}
        {stats.sim.games.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-bold text-blue-400 mb-3">시뮬레이션 게임</h4>
            <div className="space-y-2">
              {stats.sim.games
                .sort((a, b) => b.playtimeForever - a.playtimeForever)
                .slice(0, 5)
                .map(game => {
                  const racingGame = findRacingGame(game.appId)
                  return (
                    <div key={game.appId} className="text-sm">
                      <div className="flex justify-between items-center">
                        <div className="text-gray-300 truncate flex-1">
                          {racingGame?.displayName || game.name}
                        </div>
                        <div className="text-white font-semibold ml-2">
                          {formatPlaytime(game.playtimeForever)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              {stats.sim.games.length > 5 && (
                <div className="text-xs text-gray-500 pt-1">
                  +{stats.sim.games.length - 5}개 더
                </div>
              )}
            </div>
          </div>
        )}

        {/* 심케이드 게임 */}
        {stats.simcade.games.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-bold text-green-400 mb-3">심케이드 게임</h4>
            <div className="space-y-2">
              {stats.simcade.games
                .sort((a, b) => b.playtimeForever - a.playtimeForever)
                .slice(0, 5)
                .map(game => {
                  const racingGame = findRacingGame(game.appId)
                  return (
                    <div key={game.appId} className="text-sm">
                      <div className="flex justify-between items-center">
                        <div className="text-gray-300 truncate flex-1">
                          {racingGame?.displayName || game.name}
                        </div>
                        <div className="text-white font-semibold ml-2">
                          {formatPlaytime(game.playtimeForever)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              {stats.simcade.games.length > 5 && (
                <div className="text-xs text-gray-500 pt-1">
                  +{stats.simcade.games.length - 5}개 더
                </div>
              )}
            </div>
          </div>
        )}

        {/* 아케이드 게임 */}
        {stats.arcade.games.length > 0 && (
          <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-bold text-orange-400 mb-3">아케이드 게임</h4>
            <div className="space-y-2">
              {stats.arcade.games
                .sort((a, b) => b.playtimeForever - a.playtimeForever)
                .slice(0, 5)
                .map(game => {
                  const racingGame = findRacingGame(game.appId)
                  return (
                    <div key={game.appId} className="text-sm">
                      <div className="flex justify-between items-center">
                        <div className="text-gray-300 truncate flex-1">
                          {racingGame?.displayName || game.name}
                        </div>
                        <div className="text-white font-semibold ml-2">
                          {formatPlaytime(game.playtimeForever)}
                        </div>
                      </div>
                    </div>
                  )
                })}
              {stats.arcade.games.length > 5 && (
                <div className="text-xs text-gray-500 pt-1">
                  +{stats.arcade.games.length - 5}개 더
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

