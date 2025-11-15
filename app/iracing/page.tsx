'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { JSX } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import TopNavigation from '@/components/TopNavigation'
import MetaVehicleReport from '@/components/MetaVehicleReport'
import BopAlertsCard from '@/components/BopAlertsCard'
import DriverSummaryCards from '@/components/iracing/DriverSummaryCards'
import DriverTrendChart from '@/components/iracing/DriverTrendChart'
import DriverStrengthsCard from '@/components/iracing/DriverStrengthsCard'
import DriverRecentResults from '@/components/iracing/DriverRecentResults'
import DriverConsistencyCard from '@/components/iracing/DriverConsistencyCard'
import DriverHighlights from '@/components/iracing/DriverHighlights'
import type { IracingDriverDetail } from '@/lib/iracingTypes'
import { useLanguage } from '@/hooks/useLanguage'

const translations = {
  ko: {
    common: {
      errorUnknown: '에러',
      tabSession: '세션 전략',
      tabDriver: '드라이버 인사이트',
      tabMeta: '메타 리포트',
      tabBop: 'BoP 패치 알림',
    },
    hero: {
      subtitle: 'iRacing 드라이버 분석 및 전략 도구',
      description: [
        '드라이버 전적, 퍼센타일 랭킹, 세션 요약을 통해',
        '레이싱 전략을 수립하고 경쟁력을 향상시키세요',
      ],
    },
    session: {
      label: 'Session Summary',
      title: '세션 전략',
      noMainDriver: '드라이버 인사이트 탭에서 내 주요 드라이버를 설정하면 맞춤 전략을 제공합니다.',
      inputPlaceholder: '세션(서브세션) ID',
      submit: '요약 보기',
      loading: '로딩...',
      errorDefault: '요약 실패',
      errorUnknown: '에러',
      loaded: '세션 참가자 데이터를 불러왔습니다.',
      strategyTitle: '전략 제안',
      strategyAggressive: '상위권 경쟁이 가능합니다. 초반부터 공격적으로 포지션을 확보하세요.',
      strategyTop5: 'TOP5가 충분히 노려집니다. 초반 혼전을 피하고 안정적으로 레이스를 운영하세요.',
      strategyDefensive: 'iRating이 높은 상대가 많습니다. 인시던트를 줄이고 완주에 집중하세요.',
      strategyBalanced: '밸런스 잡힌 로비입니다. 페이스를 유지하며 상황에 따라 오버테이크 기회를 노리세요.',
      strategyNeedsSelection: '드라이버를 선택하면 개인화된 전략을 제공합니다.',
      strongerTitle: '강한 상대',
      strongerHint: '드라이버를 선택하면 강한 상대를 표시합니다.',
      weakerTitle: '공략 대상',
      weakerHint: '드라이버를 선택하면 페이스가 낮은 상대를 표시합니다.',
      sofLabel: 'SOF (추정)',
      moreParticipants: (count: number) => `...외 ${count}명`,
      fallback: '세션 ID를 입력하면 참가자 정보를 요약해 드립니다.',
      mainDriverBadge: '내 드라이버',
      lapLabel: '랩',
    },
    driver: {
      sectionLabel: 'Driver Search',
      title: '드라이버 검색',
      profileLabel: '드라이버',
      placeholder: '드라이버 ID (cust_id)',
      button: '검색',
      hint: 'iRacing 드라이버 ID를 입력하세요. 예: 1060971 또는 #1060971',
      badgeMain: '내 드라이버',
      countryFallback: '국가 정보 없음',
      licenseLabel: '라이선스',
      lastUpdated: '업데이트',
      setMain: '내 주요 드라이버로 설정',
      setMainDone: '내 주요 드라이버로 설정됨',
      addFavorite: '즐겨찾기 추가',
      removeFavorite: '즐겨찾기 제거',
      favorites: '즐겨찾기',
      noFavorites: '즐겨찾기한 드라이버가 없습니다.',
      emptyState: '드라이버를 검색하고 선택하면 상세 인사이트가 표시됩니다.',
      percentileTitle: '퍼센타일 랭킹',
      percentileGlobal: 'Global 랭킹',
      percentileGlobalAmong: '전 세계 드라이버 중',
      percentileCountry: '국가별 랭킹',
      percentileCountryAmong: '국가 내 드라이버 중',
      percentileDifference: (value: number) =>
        `약 ${value > 50 ? '하위' : '상위'} ${Math.abs(50 - value).toFixed(1)}% 포인트`,
      errorSearch: '검색 실패',
      errorDetail: '상세 실패',
      searchExamples: 'iRacing API는 이름 검색을 지원하지 않습니다. 드라이버 ID만 검색 가능합니다.',
    },
  },
  en: {
    common: {
      errorUnknown: 'Error',
      tabSession: 'Session Summary',
      tabDriver: 'Driver Insights',
      tabMeta: 'Meta Report',
      tabBop: 'BoP Patch Alerts',
    },
    hero: {
      subtitle: 'iRacing Driver Analysis & Strategy Suite',
      description: [
        'Build race strategy with driver history, percentile ranking, and session insights',
        'Boost your competitiveness with smart preparation',
      ],
    },
    session: {
      label: 'Session Summary',
      title: 'Session Summary',
      noMainDriver: 'Set your main driver in Driver Insights to unlock tailored strategies.',
      inputPlaceholder: 'Session (sub-session) ID',
      submit: 'Load Summary',
      loading: 'Loading...',
      errorDefault: 'Failed to load summary',
      errorUnknown: 'Error',
      loaded: 'Session roster loaded.',
      strategyTitle: 'Strategy Tips',
      strategyAggressive: 'You can fight for the podium. Attack early and control the race.',
      strategyTop5: 'Top 5 is within reach. Stay out of early chaos and manage the stint.',
      strategyDefensive: 'High-rated rivals ahead. Minimize incidents and focus on finishing.',
      strategyBalanced: 'Balanced field. Maintain pace and pick overtakes opportunistically.',
      strategyNeedsSelection: 'Select a driver to receive a personalized strategy.',
      strongerTitle: 'Threats',
      strongerHint: 'Pick a driver to highlight stronger competitors.',
      weakerTitle: 'Opportunities',
      weakerHint: 'Pick a driver to highlight weaker competitors.',
      sofLabel: 'SOF (est.)',
      moreParticipants: (count: number) => `...and ${count} more`,
      fallback: 'Enter a session ID to summarize the field.',
      mainDriverBadge: 'My Driver',
      lapLabel: 'Lap',
    },
    driver: {
      sectionLabel: 'Driver Search',
      title: 'Driver Finder',
      profileLabel: 'Driver',
      placeholder: 'Driver ID (cust_id)',
      button: 'Search',
      hint: 'Enter iRacing driver ID. Example: 1060971 or #1060971',
      badgeMain: 'My Driver',
      countryFallback: 'Country unknown',
      licenseLabel: 'License',
      lastUpdated: 'Updated',
      setMain: 'Set as My Main Driver',
      setMainDone: 'Main Driver Selected',
      addFavorite: 'Add to Favorites',
      removeFavorite: 'Remove from Favorites',
      favorites: 'Favorites',
      noFavorites: 'No favorite drivers yet.',
      emptyState: 'Search and pick a driver to see detailed insights.',
      percentileTitle: 'Percentile Rankings',
      percentileGlobal: 'Global Ranking',
      percentileGlobalAmong: 'Among all drivers',
      percentileCountry: 'Country Ranking',
      percentileCountryAmong: 'Within your country',
      percentileDifference: (value: number) =>
        `About ${Math.abs(50 - value).toFixed(1)}% ${value > 50 ? 'below' : 'above'} median`,
      errorSearch: 'Search failed',
      errorDetail: 'Failed to load detail',
      searchExamples: 'iRacing API does not support name search. Only driver ID search is available.',
    },
  },
} as const

interface DriverItem {
  custId: string
  name: string
  country?: string | null
  irating?: number | null
  licenseClass?: string | null
}

interface User {
  id: string
  email: string
  nickname: string
  role: string
}

export default function IracingTestPage() {
  const [user, setUser] = useState<User | null>(null)
  const [q, setQ] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [items, setItems] = useState<DriverItem[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [profile, setProfile] = useState<IracingDriverDetail | null>(null)
  const [percentile, setPercentile] = useState<{ global?: { percentile?: number }; country?: { percentile?: number; code?: string } } | null>(null)
  const [sessionId, setSessionId] = useState('')
  const [sessionSummary, setSessionSummary] = useState<{ 
    sessionId: string
    sofEstimate?: number | null
    participants?: Array<{ 
      custId: string
      name: string
      country?: string | null
      irating?: number | null
      safetyRating?: number | null
      stability?: { incPerRace?: number | null; dnfRate?: number | null }
      pace?: { estLap?: number | null }
      features?: {
        i_rating?: number | null
        safety_rating?: number | null
        avg_incidents_per_race?: number | null
        dnf_rate?: number | null
        recent_avg_finish_position?: number | null
        win_rate?: number | null
        ir_trend?: number | null
      }
      predictedFinish?: number | null
      predictedConfidence?: number | null
      strategyRecommendation?: { strategy: string; confidence: number; reasoning: string[] } | null
    }>
    overallStrategy?: { strategy: string; confidence: number; reasoning: string[] } | null
    snapshotAt?: string 
  } | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'session' | 'driver' | 'meta' | 'bop'>('session')
  const [mainDriverCustId, setMainDriverCustId] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<Array<{ id: string; custId: string; driverName: string | null; notes: string | null }>>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null) // 카테고리 선택: 1=Oval, 2=Road, 3=Dirt Oval, 4=Dirt Road, 5=Sports Car, 6=Formula Car
  const supabase = useSupabaseClient()
  const { language, setLanguage } = useLanguage()
  const t = translations[language] ?? translations.ko
  const locale = language === 'ko' ? 'ko-KR' : 'en-US'

  // 사용자 정보 로드
  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch('/api/me')
        if (res.ok) {
          const { user } = await res.json()
          setUser(user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('사용자 정보 로드 실패:', error)
        setUser(null)
      }
    }
    loadUser()
  }, [supabase])

  // 주요 드라이버 및 즐겨찾기 로드
  useEffect(() => {
    const loadDriverPreferences = async () => {
      if (!user) return
      
      try {
        // 주요 드라이버 로드
        const mainRes = await fetch('/api/iracing/driver/main')
        if (mainRes.ok) {
          const { mainDriverCustId: mainId } = await mainRes.json()
          setMainDriverCustId(mainId)
        }
        
        // 즐겨찾기 로드
        const favRes = await fetch('/api/iracing/driver/favorites')
        if (favRes.ok) {
          const { favorites: favs } = await favRes.json()
          setFavorites(favs || [])
        }
      } catch (error) {
        console.error('드라이버 설정 로드 실패:', error)
      }
    }
    
    loadDriverPreferences()
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    location.reload()
  }

  const search = async () => {
    setSearchLoading(true)
    setSearchError(null)
    setItems([])
    setProfile(null)
    setPercentile(null)
    try {
      const res = await fetch(`/api/iracing/driver/search?q=${encodeURIComponent(q)}`)
      const ct = res.headers.get('content-type') || ''
      const payload = ct.includes('application/json') ? await res.json() : await res.text()
      if (!res.ok) throw new Error(typeof payload === 'string' ? payload : (payload?.error || t.driver.errorSearch))
      setItems(payload)
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : t.common.errorUnknown)
    } finally {
      setSearchLoading(false)
    }
  };

  const loadDetail = useCallback(async (custId: string, options?: { switchToDriverTab?: boolean; categoryId?: number | null }) => {
    setSearchLoading(true)
    setSearchError(null)
    setProfile(null)
    setPercentile(null)
    try {
      // 카테고리 파라미터 추가
      const categoryParam = options?.categoryId ? `?category_id=${options.categoryId}` : ''
      console.log(`[Frontend] Loading driver detail for custId: ${custId}, categoryId: ${options?.categoryId || 'none'}`)
      const pr = await fetch(`/api/iracing/driver/${custId}${categoryParam}`)
      const prCt = pr.headers.get('content-type') || ''
      const pd = prCt.includes('application/json') ? await pr.json() : await pr.text()
      if (!pr.ok) throw new Error(typeof pd === 'string' ? pd : (pd?.error || t.driver.errorDetail))
      setProfile(pd as IracingDriverDetail)
      
      console.log(`[Frontend] Received profile data:`, {
        custId: pd?.custId,
        categoryId: pd?.categoryId,
        irating: pd?.irating,
        performance: {
          totalStarts: pd?.performance?.totalStarts,
          wins: pd?.performance?.wins,
          winRate: pd?.performance?.winRate,
        },
        recentRacesCount: pd?.recentRaces?.length || 0,
      })
      
      // API에서 반환된 카테고리 ID를 선택 상태로 설정
      if (pd?.categoryId) {
        setSelectedCategoryId(pd.categoryId)
      } else if (options?.categoryId) {
        setSelectedCategoryId(options.categoryId)
      } else {
        // 카테고리가 없으면 null로 설정 (사용자가 선택하도록)
        setSelectedCategoryId(null)
      }
      const val = pd?.irating ?? 0
      const pct = await fetch(`/api/iracing/percentile?metric=irating&value=${val}&country=${pd?.country || ''}`)
      const pctCt = pct.headers.get('content-type') || ''
      const pctd = pctCt.includes('application/json') ? await pct.json() : await pct.text()
      if (pct.ok && typeof pctd !== 'string') setPercentile(pctd)
    } catch (e) {
      setSearchError(e instanceof Error ? e.message : t.common.errorUnknown)
    } finally {
      setSearchLoading(false)
    }

    if (options?.switchToDriverTab) {
      setActiveTab('driver')
    }
  }, [t])

  const loadDetailFromSession = (custId: string) => {
    loadDetail(custId, { switchToDriverTab: true })
  }

  const handleSetMainDriver = useCallback(async (custId: string) => {
    if (!user) {
      alert(language === 'ko' ? '로그인이 필요합니다.' : 'Login required')
      return
    }
    
    try {
      const res = await fetch('/api/iracing/driver/main', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custId }),
      })
      
      if (res.ok) {
        setMainDriverCustId(custId)
      } else {
        const error = await res.json()
        alert(error.error || (language === 'ko' ? '주요 드라이버 설정 실패' : 'Failed to set main driver'))
      }
    } catch (error) {
      console.error('주요 드라이버 설정 실패:', error)
      alert(language === 'ko' ? '주요 드라이버 설정 실패' : 'Failed to set main driver')
    }
  }, [user, language])

  const handleToggleFavorite = useCallback(async (custId: string, driverName?: string) => {
    if (!user) {
      alert(language === 'ko' ? '로그인이 필요합니다.' : 'Login required')
      return
    }
    
    const isFavorite = favorites.some(fav => fav.custId === custId)
    
    try {
      if (isFavorite) {
        // 즐겨찾기 제거
        const res = await fetch(`/api/iracing/driver/favorites/${custId}`, {
          method: 'DELETE',
        })
        
        if (res.ok) {
          setFavorites(prev => prev.filter(fav => fav.custId !== custId))
        } else {
          const error = await res.json()
          alert(error.error || (language === 'ko' ? '즐겨찾기 제거 실패' : 'Failed to remove favorite'))
        }
      } else {
        // 즐겨찾기 추가
        const res = await fetch('/api/iracing/driver/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ custId, driverName }),
        })
        
        if (res.ok) {
          const { favorite } = await res.json()
          setFavorites(prev => [...prev, favorite])
        } else {
          const error = await res.json()
          alert(error.error || (language === 'ko' ? '즐겨찾기 추가 실패' : 'Failed to add favorite'))
        }
      }
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error)
      alert(language === 'ko' ? '즐겨찾기 처리 실패' : 'Failed to toggle favorite')
    }
  }, [user, language, favorites])

  useEffect(() => {
    if (!mainDriverCustId) return
    // profile이 없고, searchLoading이 false일 때만 자동 로드
    // (카테고리 선택 중에는 searchLoading이 true이므로 자동 로드하지 않음)
    if (!profile && !searchLoading) {
      loadDetail(mainDriverCustId)
    }
  }, [mainDriverCustId, profile, searchLoading, loadDetail])

  const sessionAnalysis = useMemo(() => {
    const participants = sessionSummary?.participants || []
    if (!participants.length) return null

    const driverCustId = profile?.custId ?? mainDriverCustId ?? null
    const driverIr = profile?.irating ?? (driverCustId ? participants.find((p) => String(p.custId) === driverCustId)?.irating ?? null : null)

    const withIr = participants
      .map((p) => ({ ...p, irating: p.irating ?? null }))

    const sortedByIr = withIr
      .filter((p) => typeof p.irating === 'number')
      .sort((a, b) => (b.irating! - a.irating!))

    let stronger: typeof withIr = []
    let weaker: typeof withIr = []
    let strategy: string = t.session.loaded

    if (driverIr !== null && driverIr !== undefined) {
      stronger = withIr.filter((p) => String(p.custId) !== driverCustId && (p.irating ?? 0) >= driverIr + 50)
      weaker = withIr.filter((p) => String(p.custId) !== driverCustId && (p.irating ?? 0) <= driverIr - 50)

      const driverRank = sortedByIr.findIndex((p) => String(p.custId) === driverCustId) + 1 || null
      const strongerCount = stronger.length
      const weakerCount = weaker.length

      if (driverRank && driverRank <= 3 && strongerCount <= 2) {
        strategy = t.session.strategyAggressive
      } else if (driverRank && driverRank <= 6 && weakerCount > strongerCount) {
        strategy = t.session.strategyTop5
      } else if (strongerCount > weakerCount * 1.5) {
        strategy = t.session.strategyDefensive
      } else {
        strategy = t.session.strategyBalanced
      }
    } else {
      strategy = t.session.strategyNeedsSelection
    }

    return {
      stronger: stronger.slice(0, 5),
      weaker: weaker.slice(0, 5),
      strategy,
    }
  }, [sessionSummary, profile, mainDriverCustId, t])

  const renderSessionTab = () => (
    <>
      {/* 세션 요약 카드 (메인) */}
      <div className="bg-gray-900/70 border border-emerald-700/40 rounded-2xl p-6 backdrop-blur-sm shadow-lg shadow-emerald-500/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-xs text-emerald-300/80 uppercase tracking-[0.2em]">{t.session.label}</div>
            <div className="text-xl font-semibold text-white">{t.session.title}</div>
          </div>
          {sessionSummary?.snapshotAt && (
            <div className="text-xs text-gray-400">{new Date(sessionSummary.snapshotAt).toLocaleTimeString(locale)}</div>
          )}
        </div>

        {!mainDriverCustId && (
          <div className="mb-4 text-xs text-emerald-200/80 bg-emerald-900/20 border border-emerald-700/40 rounded-lg px-4 py-2">
            {t.session.noMainDriver}
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <input
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder={t.session.inputPlaceholder}
            className="flex-1 bg-gray-950/60 border border-emerald-700/40 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={async () => {
              if (!sessionId.trim()) return
              setSessionLoading(true)
              setSessionError(null)
              setSessionSummary(null)
              try {
                // 먼저 빠른 요약을 가져와서 즉시 표시
                const quickRes = await fetch(`/api/iracing/session/${encodeURIComponent(sessionId.trim())}/quick`)
                const quickCt = quickRes.headers.get('content-type') || ''
                const quickData = quickCt.includes('application/json') ? await quickRes.json() : await quickRes.text()
                if (quickRes.ok && typeof quickData !== 'string') {
                  // 기본 정보 먼저 표시
                  setSessionSummary({
                    ...quickData,
                    participants: (quickData.participants || []).map((p: {
                      custId: string
                      name: string
                      country?: string | null
                      irating?: number | null
                      safetyRating?: number | null
                    }) => ({
                      ...p,
                      features: undefined,
                      predictedFinish: undefined,
                      predictedConfidence: undefined,
                    })),
                    overallStrategy: undefined,
                  })
                }
                
                // 그 다음 상세 분석을 백그라운드에서 로드
                const mainDriverParam = mainDriverCustId ? `?mainDriverCustId=${mainDriverCustId}` : ''
                const res = await fetch(`/api/iracing/session/${encodeURIComponent(sessionId.trim())}/advanced${mainDriverParam}`)
                const ct = res.headers.get('content-type') || ''
                const data = ct.includes('application/json') ? await res.json() : await res.text()
                if (!res.ok) throw new Error(typeof data === 'string' ? data : (data?.error || t.session.errorDefault))
                console.log('[Session Summary] Frontend received data:', {
                  sessionId: data?.sessionId,
                  sofEstimate: data?.sofEstimate,
                  participantsCount: data?.participants?.length ?? 0,
                  hasError: !!data?.error,
                  dataKeys: Object.keys(data || {}),
                })
                // 첫 3명의 참가자 데이터 확인
                if (data?.participants && data.participants.length > 0) {
                  console.log('[Session Summary] First 3 participants from advanced API:', data.participants.slice(0, 3).map((p: {
                    custId: string
                    name: string
                    irating?: number | null
                    safetyRating?: number | null
                    features?: { i_rating?: number | null; safety_rating?: number | null; avg_incidents_per_race?: number | null }
                    predictedFinish?: number | null
                    predictedConfidence?: number | null
                  }) => ({
                    custId: p.custId,
                    name: p.name,
                    irating: p.irating,
                    safetyRating: p.safetyRating,
                    features_i_rating: p.features?.i_rating,
                    features_safety_rating: p.features?.safety_rating,
                    features_avg_incidents: p.features?.avg_incidents_per_race,
                    predictedFinish: p.predictedFinish,
                    predictedConfidence: p.predictedConfidence,
                  })))
                }
                setSessionSummary(data)
              } catch (e) {
                setSessionError(e instanceof Error ? e.message : t.session.errorUnknown)
              } finally {
                setSessionLoading(false)
              }
            }}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-lime-500 hover:from-emerald-500 hover:to-lime-400 transition-colors font-semibold whitespace-nowrap"
          >
            {t.session.submit}
          </button>
        </div>

        {sessionLoading && <div className="text-sm text-gray-400">{t.session.loading}</div>}
        {sessionError && <div className="text-sm text-red-400">{sessionError}</div>}

        {sessionSummary ? (
          <div className="mt-4">
            {/* 고도화된 전략 제안 (overallStrategy가 있으면 우선 표시) */}
            {sessionSummary.overallStrategy && (
              <div className="mb-5 bg-gradient-to-r from-emerald-900/40 to-cyan-900/40 border border-emerald-600/50 rounded-xl p-5">
                <div className="text-sm text-emerald-200 uppercase tracking-[0.2em] mb-3 flex items-center justify-between">
                  <span>AI 전략 제안</span>
                  <span className="text-emerald-400 text-xs">
                    신뢰도: {Math.round(sessionSummary.overallStrategy.confidence * 100)}%
                  </span>
                </div>
                <div className="mb-3">
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
                    sessionSummary.overallStrategy.strategy === 'aggressive' 
                      ? 'bg-red-600/30 text-red-200 border border-red-500/50'
                      : sessionSummary.overallStrategy.strategy === 'defensive'
                      ? 'bg-yellow-600/30 text-yellow-200 border border-yellow-500/50'
                      : sessionSummary.overallStrategy.strategy === 'survival'
                      ? 'bg-orange-600/30 text-orange-200 border border-orange-500/50'
                      : 'bg-emerald-600/30 text-emerald-200 border border-emerald-500/50'
                  }`}>
                    {sessionSummary.overallStrategy.strategy === 'aggressive' ? '공격적 전략' :
                     sessionSummary.overallStrategy.strategy === 'defensive' ? '방어적 전략' :
                     sessionSummary.overallStrategy.strategy === 'survival' ? '생존 모드' :
                     '균형 전략'}
                  </span>
                </div>
                <ul className="space-y-1.5 text-base text-emerald-100">
                  {sessionSummary.overallStrategy.reasoning.map((reason, idx) => (
                    <li key={`reason-${idx}-${reason.substring(0, 20)}`} className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sessionAnalysis && !sessionSummary.overallStrategy && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-5">
                <div className="bg-emerald-900/30 border border-emerald-600/40 rounded-xl p-4">
                  <div className="text-sm text-emerald-200 uppercase tracking-[0.2em] mb-2">{t.session.strategyTitle}</div>
                  <p className="text-base text-emerald-100 leading-relaxed">{sessionAnalysis.strategy}</p>
                </div>
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                  <div className="text-sm text-gray-400 uppercase tracking-[0.2em] mb-2">{t.session.strongerTitle}</div>
                  {sessionAnalysis.stronger && sessionAnalysis.stronger.length > 0 ? (
                    <ul className="space-y-2 text-base text-gray-300">
                      {sessionAnalysis.stronger.map((p, idx) => (
                        <li key={`strong-${p.custId || p.name || idx}-${idx}`} className="flex items-center justify-between">
                          <span className="truncate max-w-[70%]">{p.name}</span>
                          <span className="text-emerald-300 font-semibold">iR {p.irating ?? '-'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">{t.session.strongerHint}</div>
                  )}
                </div>
                <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
                  <div className="text-sm text-gray-400 uppercase tracking-[0.2em] mb-2">{t.session.weakerTitle}</div>
                  {sessionAnalysis.weaker && sessionAnalysis.weaker.length > 0 ? (
                    <ul className="space-y-2 text-base text-gray-300">
                      {sessionAnalysis.weaker.map((p, idx) => (
                        <li key={`weak-${p.custId || p.name || idx}-${idx}`} className="flex items-center justify-between">
                          <span className="truncate max-w-[70%]">{p.name}</span>
                          <span className="text-gray-400">iR {p.irating ?? '-'}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-gray-500">{t.session.weakerHint}</div>
                  )}
                </div>
              </div>
            )}
            {sessionSummary.sofEstimate && (
              <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-emerald-900/30 border border-emerald-600/40">
                  <div className="text-sm text-emerald-200 uppercase tracking-[0.2em]">{t.session.sofLabel}</div>
                  <div className="text-2xl font-bold text-emerald-300">{sessionSummary.sofEstimate.toLocaleString(locale)}</div>
                </div>
              </div>
            )}
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {sessionSummary.participants?.slice(0, 20).map((p, index: number) => {
                // 디버깅: 첫 번째 참가자만 로그
                if (index === 0) {
                  console.log('[Session Summary] Rendering participant:', {
                    custId: p.custId,
                    name: p.name,
                    irating: p.irating,
                    safetyRating: p.safetyRating,
                    predictedFinish: p.predictedFinish,
                    predictedConfidence: p.predictedConfidence,
                    hasFeatures: !!p.features,
                    features_i_rating: p.features?.i_rating,
                    features_safety_rating: p.features?.safety_rating,
                    features_avg_incidents: p.features?.avg_incidents_per_race,
                  })
                }
                return (
                <div
                  key={`participant-${p.custId || p.name || index}-${index}`}
                  className="bg-gray-950/60 border border-gray-800 rounded-xl p-4 hover:border-emerald-500/60 transition-colors cursor-pointer"
                  onClick={() => {
                    setQ('')
                    setItems([])
                    loadDetailFromSession(String(p.custId))
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-500 w-6">#{index + 1}</span>
                      <div className="font-semibold text-white text-base flex items-center gap-2">
                        <span className="truncate max-w-[200px]">{p.name}</span>
                        {mainDriverCustId && String(p.custId) === mainDriverCustId && (
                          <span className="px-2 py-0.5 text-xs rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-200">
                            {t.session.mainDriverBadge}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-sm px-2 py-0.5 rounded bg-gray-800 text-gray-300">{p.country || '-'}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-500">
                    <div>
                      <span className="text-gray-400">iR:</span>{' '}
                      <span className="text-cyan-300 font-semibold">
                        {p.irating !== null && p.irating !== undefined 
                          ? p.irating.toLocaleString(locale) 
                          : (p.features?.i_rating !== null && p.features?.i_rating !== undefined
                            ? p.features.i_rating.toLocaleString(locale)
                            : '-')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">SR:</span>{' '}
                      <span className="text-green-300 font-semibold">
                        {(() => {
                          const sr = p.safetyRating ?? p.features?.safety_rating ?? null
                          if (sr !== null && sr !== undefined) {
                            return sr > 10 ? (sr / 100).toFixed(2) : sr.toFixed(2)
                          }
                          return '-'
                        })()}
                      </span>
                    </div>
                    {(p.features?.avg_incidents_per_race !== null && p.features?.avg_incidents_per_race !== undefined) ? (
                      <div>
                        <span className="text-gray-400">평균 Inc:</span>{' '}
                        <span className="text-yellow-300 font-semibold">
                          {p.features.avg_incidents_per_race.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-gray-400">평균 Inc:</span>{' '}
                        <span className="text-gray-500">-</span>
                      </div>
                    )}
                    {p.predictedFinish ? (
                      <div>
                        <span className="text-gray-400">예측:</span>{' '}
                        <span className="text-purple-300 font-semibold">
                          {Math.round(p.predictedFinish)}등
                          {p.predictedConfidence && (
                            <span className="text-[10px] text-gray-500 ml-1">
                              ({Math.round(p.predictedConfidence * 100)}%)
                            </span>
                          )}
                        </span>
                      </div>
                    ) : p.pace?.estLap !== null && p.pace?.estLap !== undefined ? (
                      <div>
                        {t.session.lapLabel}: {p.pace.estLap.toFixed(1)}s
                      </div>
                    ) : null}
                  </div>
                </div>
              )})}
              {sessionSummary.participants && sessionSummary.participants.length > 20 && (
                <div className="text-sm text-center text-gray-500 pt-2">
                  {t.session.moreParticipants(sessionSummary.participants.length - 20)}
                </div>
              )}
            </div>
          </div>
        ) : (
          !sessionLoading && (
            <div className="mt-6 text-center text-gray-500 text-sm border border-dashed border-emerald-500/40 rounded-xl py-10">
              {t.session.fallback}
            </div>
          )
        )}
      </div>

    </>
  );

  const renderDriverTab = () => (
    <div className="space-y-4">
      {/* 즐겨찾기 목록 */}
      {user && favorites.length > 0 && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-3">{t.driver.favorites}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favorites.map((fav, favIdx) => (
              <button
                key={`favorite-${fav.id || fav.custId || favIdx}-${favIdx}`}
                onClick={() => loadDetail(fav.custId)}
                className={`text-left bg-gray-800/60 border ${
                  profile?.custId === fav.custId ? 'border-cyan-500/60' : 'border-gray-700'
                } hover:border-cyan-400 rounded-xl px-3 py-3 transition-colors`}
              >
                <div className="flex items-center justify-between text-sm text-white">
                  <span className="truncate max-w-[70%] flex items-center gap-2">
                    <span className="text-yellow-400">★</span>
                    {fav.driverName || `Driver #${fav.custId}`}
                  </span>
                  <span className="text-[10px] text-gray-500">#{fav.custId}</span>
                </div>
                {fav.notes && (
                  <div className="text-[11px] text-gray-400 mt-1 truncate">{fav.notes}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-1">{t.driver.sectionLabel}</div>
        <div className="text-xl font-semibold text-white mb-4">{t.driver.title}</div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.driver.placeholder}
            className="flex-1 bg-gray-800/80 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button onClick={search} className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-colors font-semibold whitespace-nowrap">
            {t.driver.button}
          </button>
        </div>
        {searchLoading && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_,i)=> (
              <div key={i} className="h-16 bg-gray-900/70 border border-gray-800 rounded-xl animate-pulse"/>
            ))}
          </div>
        )}
        {searchError && <div className="text-sm text-red-400 mt-3">{searchError}</div>}
        {!searchLoading && items.length === 0 && !searchError && q && (
          <div className="text-xs text-amber-400 mt-3">
            {isNaN(parseInt(q, 10)) 
              ? '드라이버 ID는 숫자여야 합니다. 예: 1060971'
              : '드라이버를 찾을 수 없습니다. ID를 확인해주세요.'}
          </div>
        )}
        {!searchLoading && items.length === 0 && !searchError && !q && (
          <div className="text-xs text-gray-500 mt-3">{t.driver.hint}</div>
        )}
        {items.length > 0 && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((it, itemIdx) => {
              const isFavorite = favorites.some(fav => fav.custId === it.custId)
              return (
                <button key={`search-result-${it.custId || it.name || itemIdx}-${itemIdx}`} onClick={() => loadDetail(it.custId)} className={`text-left bg-gray-900/80 border ${mainDriverCustId === it.custId ? 'border-emerald-500/60' : 'border-gray-800'} hover:border-gray-700 rounded-xl px-3 py-3 transition-colors`}>
                  <div className="flex items-center justify-between text-sm text-white">
                    <span className="truncate max-w-[70%] flex items-center gap-2">
                      {isFavorite && <span className="text-yellow-400">★</span>}
                      {it.name}
                      {mainDriverCustId === it.custId && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-200">
                          {t.driver.badgeMain}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-gray-500">#{it.custId}</span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {it.country || '-'} • iR {it.irating !== null && it.irating !== undefined ? it.irating.toLocaleString(locale) : '-'} • L {it.licenseClass ?? '-'}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {profile ? (
        <div className="space-y-4">
          <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-gray-400 uppercase tracking-[0.2em]">{t.driver.profileLabel}</div>
                <h3 className="text-2xl font-bold text-white">{profile.name}</h3>
                <div className="text-sm text-gray-400">
                  {profile.country || t.driver.countryFallback}
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                {profile.lastUpdated && (
                  <div className="text-xs text-gray-500">
                    {t.driver.lastUpdated} {new Date(profile.lastUpdated).toLocaleString(locale)}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleFavorite(profile.custId, profile.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      favorites.some(fav => fav.custId === profile.custId)
                        ? 'bg-yellow-600/30 border-yellow-500/50 text-yellow-200'
                        : 'bg-gray-800/60 border-gray-700 text-gray-200 hover:border-yellow-400 hover:text-yellow-200'
                    }`}
                    title={favorites.some(fav => fav.custId === profile.custId) ? t.driver.removeFavorite : t.driver.addFavorite}
                  >
                    {favorites.some(fav => fav.custId === profile.custId) ? '★' : '☆'}
                  </button>
                  <button
                    onClick={() => handleSetMainDriver(profile.custId)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      mainDriverCustId === profile.custId
                        ? 'bg-emerald-600/30 border-emerald-500/50 text-emerald-200 cursor-default'
                        : 'bg-gray-800/60 border-gray-700 text-gray-200 hover:border-emerald-400 hover:text-emerald-200'
                    }`}
                    disabled={mainDriverCustId === profile.custId}
                  >
                    {mainDriverCustId === profile.custId ? t.driver.setMainDone : t.driver.setMain}
                  </button>
                </div>
              </div>
            </div>
            {/* 카테고리 선택 UI */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-3">카테고리별 통계 보기</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 5, name: 'Sports Car', nameKo: '스포츠카' },
                  { id: 6, name: 'Formula', nameKo: '포뮬러' },
                  { id: 1, name: 'Oval', nameKo: '오벌' },
                  { id: 3, name: 'Dirt Oval', nameKo: '더트 오벌' },
                  { id: 4, name: 'Dirt Road', nameKo: '더트 로드' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={async () => {
                      console.log(`[Frontend] Category button clicked: ${cat.id}`)
                      setSelectedCategoryId(cat.id)
                      // 카테고리 선택 시에는 profile을 null로 설정하지 않음
                      // (useEffect가 다시 auto-detect로 요청하는 것을 방지)
                      await loadDetail(profile.custId, { categoryId: cat.id })
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                      selectedCategoryId === cat.id
                        ? 'bg-cyan-600/30 border-cyan-500/50 text-cyan-200'
                        : 'bg-gray-800/60 border-gray-700 text-gray-200 hover:border-cyan-400 hover:text-cyan-200'
                    }`}
                  >
                    {language === 'ko' ? cat.nameKo : cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DriverSummaryCards profile={profile} />
          {percentile && (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">{t.driver.percentileTitle}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-400">{t.driver.percentileGlobal}</div>
                    <span className="px-2 py-1 text-xs rounded-full bg-cyan-600/20 text-cyan-300 border border-cyan-600/30">
                      {profile.irating?.toLocaleString(locale) ?? '-'} iR
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>{t.driver.percentileGlobalAmong}</span>
                      <span className="font-semibold text-cyan-400">
                        {language === 'ko' ? '상위' : 'Top'} {percentile.global?.percentile?.toFixed(1) ?? '-'}%
                      </span>
                    </div>
                    <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, percentile.global?.percentile ?? 0)}%` }}
                      />
                    </div>
                  </div>
                  {percentile.global?.percentile && (
                    <div className="text-xs text-gray-500">
                      {t.driver.percentileDifference(percentile.global.percentile)}
                    </div>
                  )}
                </div>
                <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm text-gray-400">{t.driver.percentileCountry}</div>
                    <span className="px-2 py-1 text-xs rounded-full bg-purple-600/20 text-purple-300 border border-purple-600/30">
                      {percentile.country?.code || '-'}
                    </span>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                      <span>{t.driver.percentileCountryAmong}</span>
                      <span className="font-semibold text-purple-400">
                        {language === 'ko' ? '상위' : 'Top'} {percentile.country?.percentile?.toFixed(1) ?? '-'}%
                      </span>
                    </div>
                    <div className="h-3 w-full bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, percentile.country?.percentile ?? 0)}%` }}
                      />
                    </div>
                  </div>
                  {percentile.country?.percentile && (
                    <div className="text-xs text-gray-500">
                      {t.driver.percentileDifference(percentile.country.percentile)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {profile.trends && profile.trends.length > 0 && <DriverTrendChart data={profile.trends} />}
          <DriverStrengthsCard strengths={profile.strengths} />
          <DriverConsistencyCard consistency={profile.consistency} />
          <DriverHighlights highlights={profile.highlights} />

          {profile.recentRaces && profile.recentRaces.length > 0 && (
            <DriverRecentResults races={profile.recentRaces} />
          )}
        </div>
      ) : (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center text-gray-500 text-sm">
          {t.driver.emptyState}
        </div>
      )}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'session':
        return renderSessionTab();
      case 'driver':
        return renderDriverTab();
      case 'meta':
        return (
          <div className="mt-6">
            <MetaVehicleReport />
          </div>
        );
      case 'bop':
        return (
          <div className="mt-6">
            <BopAlertsCard />
          </div>
        );
      default:
        return null;
    }
  };

  const content = (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      {/* 상단 네비게이션 */}
      <TopNavigation
        user={user}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={handleLogout}
      />

      {/* 메인 컨텐츠 */}
      <div className="pt-24 px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 상단 설명 섹션 */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                아이레이싱 전적 분석
              </span>
            </h1>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 text-white">
              {t.hero.subtitle}
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              {t.hero.description.map((line, idx) => (
                <span key={idx}>
                  {line}
                  {idx < t.hero.description.length - 1 && (
                    <>
                      <br />
                    </>
                  )}
                </span>
              ))}
            </p>
            <div className="h-px w-64 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
          </div>

          {/* 탭 네비게이션 */}
          <div className="flex items-center gap-4 border-b border-gray-800">
            <button
              onClick={() => setActiveTab('session')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'session'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.common.tabSession}
              {activeTab === 'session' && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
              )}
            </button>
            <button
              onClick={() => setActiveTab('driver')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'driver'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.common.tabDriver}
              {activeTab === 'driver' && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
              )}
            </button>
            <button
              onClick={() => setActiveTab('meta')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'meta'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.common.tabMeta}
              {activeTab === 'meta' && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
              )}
            </button>
            <button
              onClick={() => setActiveTab('bop')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                activeTab === 'bop'
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {t.common.tabBop}
              {activeTab === 'bop' && (
                <span className="absolute left-0 right-0 -bottom-0.5 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"/>
              )}
            </button>
          </div>

        {/* 탭 컨텐츠 */}
        {renderTabContent()}
        </div>
      </div>
    </div>
  ) as JSX.Element;

  return content;
}


