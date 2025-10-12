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
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 to-gray-900/20 rounded-xl blur-lg"></div>
        <div className="relative bg-gray-900/90 border border-gray-700 rounded-xl p-8 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-6xl mb-4">🏎️</div>
            <p className="text-gray-400 text-lg">레이싱 게임 플레이 기록이 없습니다</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 총 플레이 시간 - 네온 효과 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-pink-600/30 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
        <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-purple-500/40 rounded-2xl p-8 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              🏎️ 레이싱 게임 총 플레이 시간
            </h3>
            <div className="text-sm text-gray-400 bg-gray-800/50 px-3 py-1 rounded-full border border-gray-700">
              {stats.sim.games.length + stats.simcade.games.length + stats.arcade.games.length}개 게임
            </div>
          </div>
          <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
            {formatPlaytime(stats.total)}
          </div>
        </div>
      </div>

      {/* 카테고리별 통계 - 그라데이션 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 시뮬레이션 */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
          <div className="relative bg-gray-900/95 border border-blue-500/40 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-bold text-blue-400">🏎️ 시뮬레이션</div>
              <div className="text-sm font-bold text-blue-300 bg-blue-900/30 px-3 py-1 rounded-full">
                {stats.sim.percentage.toFixed(0)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {formatPlaytime(stats.sim.playtime)}
            </div>
            <div className="text-xs text-gray-400 mb-4">
              {stats.sim.games.length}개 게임
            </div>
            {/* 진행률 바 - 네온 효과 */}
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/50 transition-all duration-500"
                style={{ width: `${stats.sim.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 심케이드 */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
          <div className="relative bg-gray-900/95 border border-green-500/40 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-bold text-green-400">🎮 심케이드</div>
              <div className="text-sm font-bold text-green-300 bg-green-900/30 px-3 py-1 rounded-full">
                {stats.simcade.percentage.toFixed(0)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {formatPlaytime(stats.simcade.playtime)}
            </div>
            <div className="text-xs text-gray-400 mb-4">
              {stats.simcade.games.length}개 게임
            </div>
            {/* 진행률 바 - 네온 효과 */}
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg shadow-green-500/50 transition-all duration-500"
                style={{ width: `${stats.simcade.percentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* 아케이드 */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-xl blur-lg group-hover:blur-xl transition-all"></div>
          <div className="relative bg-gray-900/95 border border-orange-500/40 rounded-xl p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="text-base font-bold text-orange-400">🕹️ 아케이드</div>
              <div className="text-sm font-bold text-orange-300 bg-orange-900/30 px-3 py-1 rounded-full">
                {stats.arcade.percentage.toFixed(0)}%
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-2">
              {formatPlaytime(stats.arcade.playtime)}
            </div>
            <div className="text-xs text-gray-400 mb-4">
              {stats.arcade.games.length}개 게임
            </div>
            {/* 진행률 바 - 네온 효과 */}
            <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg shadow-orange-500/50 transition-all duration-500"
                style={{ width: `${stats.arcade.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 카테고리별 게임 목록 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 시뮬레이션 게임 */}
        {stats.sim.games.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/5 rounded-xl blur-lg"></div>
            <div className="relative bg-gray-900/90 border border-blue-500/30 rounded-xl p-5 backdrop-blur-sm">
              <h4 className="text-sm font-bold text-blue-400 mb-4 flex items-center gap-2">
                <span>🏎️</span>
                <span>시뮬레이션 게임</span>
              </h4>
              <div className="space-y-3">
                {stats.sim.games
                  .sort((a, b) => b.playtimeForever - a.playtimeForever)
                  .slice(0, 5)
                  .map(game => {
                    const racingGame = findRacingGame(game.appId)
                    return (
                      <div key={game.appId} className="flex justify-between items-center p-2 bg-blue-900/10 rounded-lg hover:bg-blue-900/20 transition-colors">
                        <div className="text-sm text-gray-300 truncate flex-1 pr-2">
                          {racingGame?.displayName || game.name}
                        </div>
                        <div className="text-sm text-blue-400 font-bold whitespace-nowrap">
                          {formatPlaytime(game.playtimeForever)}
                        </div>
                      </div>
                    )
                  })}
                {stats.sim.games.length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
                    +{stats.sim.games.length - 5}개 더
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 심케이드 게임 */}
        {stats.simcade.games.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-green-500/5 rounded-xl blur-lg"></div>
            <div className="relative bg-gray-900/90 border border-green-500/30 rounded-xl p-5 backdrop-blur-sm">
              <h4 className="text-sm font-bold text-green-400 mb-4 flex items-center gap-2">
                <span>🎮</span>
                <span>심케이드 게임</span>
              </h4>
              <div className="space-y-3">
                {stats.simcade.games
                  .sort((a, b) => b.playtimeForever - a.playtimeForever)
                  .slice(0, 5)
                  .map(game => {
                    const racingGame = findRacingGame(game.appId)
                    return (
                      <div key={game.appId} className="flex justify-between items-center p-2 bg-green-900/10 rounded-lg hover:bg-green-900/20 transition-colors">
                        <div className="text-sm text-gray-300 truncate flex-1 pr-2">
                          {racingGame?.displayName || game.name}
                        </div>
                        <div className="text-sm text-green-400 font-bold whitespace-nowrap">
                          {formatPlaytime(game.playtimeForever)}
                        </div>
                      </div>
                    )
                  })}
                {stats.simcade.games.length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
                    +{stats.simcade.games.length - 5}개 더
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 아케이드 게임 */}
        {stats.arcade.games.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-orange-500/5 rounded-xl blur-lg"></div>
            <div className="relative bg-gray-900/90 border border-orange-500/30 rounded-xl p-5 backdrop-blur-sm">
              <h4 className="text-sm font-bold text-orange-400 mb-4 flex items-center gap-2">
                <span>🕹️</span>
                <span>아케이드 게임</span>
              </h4>
              <div className="space-y-3">
                {stats.arcade.games
                  .sort((a, b) => b.playtimeForever - a.playtimeForever)
                  .slice(0, 5)
                  .map(game => {
                    const racingGame = findRacingGame(game.appId)
                    return (
                      <div key={game.appId} className="flex justify-between items-center p-2 bg-orange-900/10 rounded-lg hover:bg-orange-900/20 transition-colors">
                        <div className="text-sm text-gray-300 truncate flex-1 pr-2">
                          {racingGame?.displayName || game.name}
                        </div>
                        <div className="text-sm text-orange-400 font-bold whitespace-nowrap">
                          {formatPlaytime(game.playtimeForever)}
                        </div>
                      </div>
                    )
                  })}
                {stats.arcade.games.length > 5 && (
                  <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-800">
                    +{stats.arcade.games.length - 5}개 더
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
