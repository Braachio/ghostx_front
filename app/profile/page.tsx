'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { findRacingGame, isRacingGame } from '@/lib/racingGames'
import RacingStats from '@/components/RacingStats'
import AchievementProgress from '@/components/AchievementProgress'
import { useNotificationPermission } from '@/hooks/useNotificationPermission'

// 게임 목록 (관심 게임 선택용)
const availableGames = [
  '아이레이싱', '알펙터2', '아세토코르사', '그란투리스모7', '오토모빌리스타2',
  '컴페티치오네', '르망얼티밋', 'F1 25', 'EA WRC'
]

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
  gallery_nickname?: string
  gallery_gallog_id?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [filter, setFilter] = useState<'all' | 'racing'>('racing')
  const [interestGames, setInterestGames] = useState<string[]>([])
  const [notificationSettings, setNotificationSettings] = useState({
    flash_event_notifications: true,
    regular_event_notifications: true,
    email_notifications: false,
    push_notifications: true
  })
  const [savingInterestGames, setSavingInterestGames] = useState(false)
  const [savingNotificationSettings, setSavingNotificationSettings] = useState(false)
  const [savingNotifications, setSavingNotifications] = useState(false)
  
  // 알림 권한 관리
  const { permission, isSupported, requestPermission, sendTestNotification } = useNotificationPermission()
  
  // 알림 권한 요청
  const handleRequestNotificationPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      alert('✅ 알림 권한이 허용되었습니다! 이제 갤멀 알림을 받을 수 있습니다.')
    } else {
      alert('❌ 알림 권한이 거부되었습니다. 브라우저 설정에서 알림을 허용해주세요.')
    }
  }

  // 테스트 알림 전송
  const handleTestNotification = () => {
    if (permission === 'granted') {
      sendTestNotification()
    } else {
      alert('먼저 알림 권한을 허용해주세요.')
    }
  }

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

  // 관심 게임 로드
  async function fetchInterestGames() {
    try {
      const response = await fetch('/api/user/interest-games')
      if (response.ok) {
        const data = await response.json()
        setInterestGames(data.games || [])
      }
    } catch (error) {
      console.error('관심 게임 로드 실패:', error)
    }
  }

  // 알림 설정 로드
  async function fetchNotificationSettings() {
    try {
      const response = await fetch('/api/user/notification-settings')
      if (response.ok) {
        const data = await response.json()
        setNotificationSettings(data.settings || notificationSettings)
      }
    } catch (error) {
      console.error('알림 설정 로드 실패:', error)
    }
  }

  useEffect(() => {
    fetchProfile()
    fetchInterestGames()
    fetchNotificationSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 관심 게임 토글
  const toggleInterestGame = async (gameName: string) => {
    console.log('🎮 관심 게임 토글 시작:', gameName)
    setSavingInterestGames(true)
    try {
      const isSelected = interestGames.includes(gameName)
      console.log('현재 선택 상태:', isSelected)
      
      if (isSelected) {
        // 제거
        console.log('관심 게임 제거 요청...')
        const response = await fetch(`/api/user/interest-games?gameName=${encodeURIComponent(gameName)}`, {
          method: 'DELETE'
        })
        console.log('제거 응답:', response.status, response.ok)
        if (response.ok) {
          setInterestGames(prev => prev.filter(game => game !== gameName))
          console.log('✅ 관심 게임 제거 완료')
        } else {
          const errorData = await response.json()
          console.error('❌ 제거 실패:', errorData)
          alert(`제거 실패: ${errorData.error || '알 수 없는 오류'}`)
        }
      } else {
        // 추가
        console.log('관심 게임 추가 요청...')
        const response = await fetch('/api/user/interest-games', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameName })
        })
        console.log('추가 응답:', response.status, response.ok)
        if (response.ok) {
          setInterestGames(prev => [...prev, gameName])
          console.log('✅ 관심 게임 추가 완료')
        } else {
          const errorData = await response.json()
          console.error('❌ 추가 실패:', errorData)
          alert(`추가 실패: ${errorData.error || '알 수 없는 오류'}`)
        }
      }
    } catch (error) {
      console.error('❌ 관심 게임 토글 실패:', error)
      alert(`오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setSavingInterestGames(false)
      console.log('토글 작업 완료')
    }
  }

  // 알림 설정 업데이트
  const updateNotificationSettings = async (newSettings: typeof notificationSettings) => {
    setSavingNotifications(true)
    try {
      const response = await fetch('/api/user/notification-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      })
      if (response.ok) {
        setNotificationSettings(newSettings)
      }
    } catch (error) {
      console.error('알림 설정 업데이트 실패:', error)
    } finally {
      setSavingNotifications(false)
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

  // 레이싱 게임만 필터링 (games가 undefined일 경우 빈 배열 사용)
  const racingGames = (games || []).filter(game => isRacingGame(game.appId))
  const displayGames = filter === 'racing' ? racingGames : (games || [])

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
                
                {/* 갤로그 정보 표시 */}
                {(profileData.gallery_nickname || profileData.gallery_gallog_id) && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-500/30 rounded-lg">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">🎮 갤로그 정보</h3>
                    <div className="flex flex-wrap gap-4 text-sm">
                      {profileData.gallery_nickname && (
                        <div className="bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                          <span className="text-gray-400">갤러리 닉네임:</span>{' '}
                          <span className="text-cyan-400 font-semibold">{profileData.gallery_nickname}</span>
                        </div>
                      )}
                      {profileData.gallery_gallog_id && (
                        <div className="bg-gray-800/50 px-3 py-1 rounded-lg border border-gray-700">
                          <span className="text-gray-400">갤로그 ID:</span>{' '}
                          <span className="text-blue-400 font-mono">{profileData.gallery_gallog_id}</span>
                        </div>
                      )}
                    </div>
                    {profileData.gallery_gallog_id && (
                      <a
                        href={`https://gallog.dcinside.com/${profileData.gallery_gallog_id}/guestbook`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 rounded-lg transition-all text-white text-sm font-semibold"
                      >
                        <span>갤로그 방명록 보기</span>
                        <span className="text-lg">→</span>
                      </a>
                    )}
                  </div>
                )}
                
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

        {/* 관심 게임 설정 */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-green-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🎯</div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                관심 게임 설정
              </h3>
            </div>
            <p className="text-gray-400 mb-6">
              관심 있는 게임을 선택하면 새로운 이벤트가 열릴 때 알림을 받을 수 있습니다.
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {availableGames.map(game => {
                const isSelected = interestGames.includes(game)
                return (
                  <button
                    key={game}
                    onClick={() => toggleInterestGame(game)}
                    disabled={savingInterestGames}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-green-600 text-white shadow-lg shadow-green-500/25 hover:bg-green-700'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    } ${savingInterestGames ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                  >
                    {game}
                  </button>
                )
              })}
            </div>
            
            {interestGames.length > 0 && (
              <div className="mt-4 p-3 bg-green-900/30 border border-green-500/30 rounded-lg">
                <p className="text-green-300 text-sm">
                  📢 선택된 게임: {interestGames.join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 알림 설정 */}
        <div className="relative mb-8 group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🔔</div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                알림 설정
              </h3>
            </div>
            
            <div className="space-y-4">
              {/* 브라우저 알림 권한 관리 */}
              <div className="p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-white font-semibold">🔔 브라우저 알림 권한</h4>
                    <p className="text-gray-400 text-sm">갤멀 알림을 받으려면 브라우저 알림 권한이 필요합니다</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      permission === 'granted' ? 'bg-green-600 text-white' :
                      permission === 'denied' ? 'bg-red-600 text-white' :
                      'bg-yellow-600 text-white'
                    }`}>
                      {permission === 'granted' ? '허용됨' :
                       permission === 'denied' ? '거부됨' : '요청 필요'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {permission !== 'granted' && (
                    <button
                      onClick={handleRequestNotificationPermission}
                      disabled={!isSupported}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                      {isSupported ? '알림 권한 요청' : '알림 미지원'}
                    </button>
                  )}
                  
                  {permission === 'granted' && (
                    <button
                      onClick={handleTestNotification}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      테스트 알림
                    </button>
                  )}
                </div>
                
                {!isSupported && (
                  <p className="text-red-400 text-xs mt-2">
                    이 브라우저는 알림을 지원하지 않습니다. Chrome, Firefox, Safari 등을 사용해주세요.
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div>
                  <h4 className="text-white font-semibold">⚡ 기습 갤멀 알림</h4>
                  <p className="text-gray-400 text-sm">관심 게임의 기습 갤멀이 열릴 때 알림</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.flash_event_notifications}
                    onChange={(e) => updateNotificationSettings({
                      ...notificationSettings,
                      flash_event_notifications: e.target.checked
                    })}
                    disabled={savingNotifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div>
                  <h4 className="text-white font-semibold">📅 정기 멀티 알림</h4>
                  <p className="text-gray-400 text-sm">관심 게임의 정기 멀티가 시작될 때 알림</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.regular_event_notifications}
                    onChange={(e) => updateNotificationSettings({
                      ...notificationSettings,
                      regular_event_notifications: e.target.checked
                    })}
                    disabled={savingNotifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
                <div>
                  <h4 className="text-white font-semibold">📧 이메일 알림</h4>
                  <p className="text-gray-400 text-sm">이메일로 알림 받기 (추후 구현)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationSettings.email_notifications}
                    onChange={(e) => updateNotificationSettings({
                      ...notificationSettings,
                      email_notifications: e.target.checked
                    })}
                    disabled={savingNotifications}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
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
