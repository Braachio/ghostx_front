'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 게임 이름 매핑
const gameNames: Record<string, string> = {
  'iracing': '아이레이싱',
  'assettocorsa': '아세토코르사',
  'gran-turismo7': '그란투리스모7',
  'automobilista2': '오토모빌리스타2',
  'competizione': '컴페티치오네',
  'lemans': '르망얼티밋',
  'f1-25': 'F1 25',
  'ea-wrc': 'EA WRC'
}

// 게임별 트랙 옵션
const gameTracks: Record<string, string[]> = {
  'iracing': [
    'Spa-Francorchamps',
    'Silverstone',
    'Nürburgring',
    'Monza',
    'Suzuka',
    'Watkins Glen',
    'Road America',
    'Laguna Seca',
    'Sebring',
    'Daytona',
    'Talladega',
    'Charlotte',
    'Bristol',
    'Martinsville',
    'Phoenix',
    'Las Vegas',
    'Homestead',
    'Texas',
    'Kansas',
    'Atlanta'
  ],
  'assettocorsa': [
    'Spa-Francorchamps',
    'Silverstone',
    'Nürburgring',
    'Monza',
    'Suzuka',
    'Imola',
    'Mugello',
    'Brands Hatch',
    'Donington Park',
    'Oulton Park',
    'Snetterton',
    'Knockhill',
    'Zandvoort',
    'Red Bull Ring',
    'Paul Ricard',
    'Barcelona',
    'Valencia',
    'Jerez',
    'Portimão',
    'Estoril'
  ],
  'gran-turismo7': [
    'Spa-Francorchamps',
    'Silverstone',
    'Nürburgring',
    'Monza',
    'Suzuka',
    'Fuji Speedway',
    'Autopolis',
    'Twin Ring Motegi',
    'Tsukuba',
    'Deep Forest',
    'Trial Mountain',
    'High Speed Ring',
    'Grand Valley',
    'Laguna Seca',
    'Watkins Glen',
    'Road Atlanta',
    'Daytona',
    'Le Mans',
    'Sardegna',
    'Catalunya'
  ],
  'automobilista2': [
    'Spa-Francorchamps',
    'Silverstone',
    'Nürburgring',
    'Monza',
    'Suzuka',
    'Imola',
    'Mugello',
    'Brands Hatch',
    'Donington Park',
    'Oulton Park',
    'Snetterton',
    'Knockhill',
    'Zandvoort',
    'Red Bull Ring',
    'Paul Ricard',
    'Barcelona',
    'Valencia',
    'Jerez',
    'Portimão',
    'Estoril',
    'Interlagos',
    'Buenos Aires',
    'Cascavel',
    'Velopark',
    'Goiânia'
  ],
  'competizione': [
    'Spa-Francorchamps',
    'Silverstone',
    'Nürburgring',
    'Monza',
    'Suzuka',
    'Imola',
    'Mugello',
    'Brands Hatch',
    'Donington Park',
    'Oulton Park',
    'Snetterton',
    'Knockhill',
    'Zandvoort',
    'Red Bull Ring',
    'Paul Ricard',
    'Barcelona',
    'Valencia',
    'Jerez',
    'Portimão',
    'Estoril',
    'Kyalami',
    'Misano',
    'Hungaroring',
    'Zolder',
    'Oschersleben'
  ],
  'lemans': [
    'Le Mans',
    'Spa-Francorchamps',
    'Silverstone',
    'Nürburgring',
    'Monza',
    'Suzuka',
    'Imola',
    'Mugello',
    'Brands Hatch',
    'Donington Park',
    'Oulton Park',
    'Snetterton',
    'Knockhill',
    'Zandvoort',
    'Red Bull Ring',
    'Paul Ricard',
    'Barcelona',
    'Valencia',
    'Jerez',
    'Portimão',
    'Estoril',
    'Kyalami',
    'Misano',
    'Hungaroring',
    'Zolder'
  ],
  'f1-25': [
    'Spa-Francorchamps',
    'Silverstone',
    'Monza',
    'Suzuka',
    'Imola',
    'Mugello',
    'Red Bull Ring',
    'Paul Ricard',
    'Barcelona',
    'Valencia',
    'Jerez',
    'Portimão',
    'Estoril',
    'Kyalami',
    'Misano',
    'Hungaroring',
    'Zolder',
    'Bahrain',
    'Saudi Arabia',
    'Australia',
    'Azerbaijan',
    'Miami',
    'Monaco',
    'Canada',
    'Austria',
    'Great Britain',
    'Hungary',
    'Belgium',
    'Netherlands',
    'Italy',
    'Singapore',
    'Japan',
    'Qatar',
    'United States',
    'Mexico',
    'Brazil',
    'Las Vegas',
    'Abu Dhabi'
  ],
  'ea-wrc': [
    'Monte Carlo',
    'Sweden',
    'Mexico',
    'Croatia',
    'Portugal',
    'Sardinia',
    'Kenya',
    'Estonia',
    'Finland',
    'Greece',
    'Chile',
    'Central Europe',
    'Japan',
    'Rally GB',
    'Spain',
    'Australia',
    'New Zealand',
    'Argentina',
    'Turkey',
    'Germany'
  ]
}

interface RegularEventFormData {
  title: string
  description: string
  day_of_week: string
  start_time: string
  duration_hours: number
  link?: string
  voting_enabled: boolean
  track_options: string[]
}

interface RegularEventPageProps {
  params: Promise<{ game: string }>
}

export default function RegularEventPage({ params }: RegularEventPageProps) {
  const router = useRouter()
  const [game, setGame] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<RegularEventFormData>({
    title: '',
    description: '',
    day_of_week: '일',
    start_time: '20:00',
    duration_hours: 2,
    link: '',
    voting_enabled: false,
    track_options: []
  })

  // 임시 입력값들
  const [tempTrack, setTempTrack] = useState('')

  // params 로드
  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setGame(resolvedParams.game)
    }
    loadParams()
  }, [params])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 투표가 활성화된 경우 옵션 검증
    if (formData.voting_enabled) {
      if (formData.track_options.length === 0) {
        alert('트랙 옵션을 최소 1개 이상 추가해주세요.')
        setLoading(false)
        return
      }
    }

    try {
      const gameName = gameNames[game] || game
      
      const eventData = {
        title: formData.title,
        description: formData.description,
        game: gameName,
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        duration_hours: formData.duration_hours,
        link: formData.link,
        voting_enabled: formData.voting_enabled,
        track_options: formData.track_options,
        event_type: 'regular_schedule',
        is_template_based: false
      }

      const response = await fetch('/api/multis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })

      if (response.ok) {
        const result = await response.json()
        const eventId = result.eventId
        
        // 투표가 활성화된 경우 투표 옵션 및 스케줄 생성
        if (formData.voting_enabled && eventId && formData.track_options.length > 0) {
          try {
            // 투표 옵션 생성
            for (const track of formData.track_options) {
              await fetch(`/api/regular-events/${eventId}/vote-options`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  option_type: 'track',
                  option_value: track
                }),
              })
            }
            console.log('투표 옵션 생성 완료')

            // 투표 스케줄 생성
            await fetch(`/api/regular-events/${eventId}/voting-schedule`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                weeks_ahead: 4
              }),
            })
            console.log('투표 스케줄 생성 완료')
          } catch (optionError) {
            console.warn('투표 설정 생성 중 오류 (이벤트는 생성됨):', optionError)
          }
        }
        
        router.push(`/events/regular/${game}`)
      } else {
        const errorData = await response.json()
        console.error('이벤트 등록 실패:', errorData)
        alert(`이벤트 등록 실패: ${errorData.error || '알 수 없는 오류가 발생했습니다.'}`)
      }
    } catch (error) {
      console.error('이벤트 등록 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof RegularEventFormData, value: string | number | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      return newData
    })
  }

  const addTrackOption = () => {
    if (tempTrack.trim() && !formData.track_options.includes(tempTrack.trim())) {
      setFormData(prev => ({
        ...prev,
        track_options: [...prev.track_options, tempTrack.trim()]
      }))
      setTempTrack('')
    }
  }

  const removeTrackOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      track_options: prev.track_options.filter((_, i) => i !== index)
    }))
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-blue-400 text-xl">로딩 중...</p>
        </div>
      </div>
    )
  }

  const gameDisplayName = gameNames[game] || game

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href={`/events/regular/${game}`}
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ← 돌아가기
            </Link>
            <h1 className="text-3xl font-bold text-white">
              {gameDisplayName} 정기 이벤트 생성
            </h1>
          </div>
          <p className="text-gray-400">
            매주 반복되는 정기 이벤트를 생성합니다.
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
            
            {/* 기본 정보 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📝</span>
                기본 정보
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    이벤트 제목 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    placeholder="예: 매주 일요일 GT3 레이스"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    이벤트 설명 *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white resize-none"
                    placeholder="이벤트에 대한 상세 설명을 입력하세요"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 정기 일정 설정 */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span>📅</span>
                정기 일정 설정
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    요일 *
                  </label>
                  <select
                    value={formData.day_of_week}
                    onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    required
                  >
                    <option value="월">월요일</option>
                    <option value="화">화요일</option>
                    <option value="수">수요일</option>
                    <option value="목">목요일</option>
                    <option value="금">금요일</option>
                    <option value="토">토요일</option>
                    <option value="일">일요일</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    시작 시간 *
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    지속시간 (시간) *
                  </label>
                  <select
                    value={formData.duration_hours}
                    onChange={(e) => handleInputChange('duration_hours', parseInt(e.target.value))}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    required
                  >
                    <option value={1}>1시간</option>
                    <option value={2}>2시간</option>
                    <option value={3}>3시간</option>
                    <option value={4}>4시간</option>
                    <option value={6}>6시간</option>
                    <option value={8}>8시간</option>
                    <option value={12}>12시간</option>
                    <option value={24}>24시간</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 투표 설정 */}
            <div className="border-t border-gray-700 pt-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>🗳️</span>
                투표 설정
              </h3>
              
              <div className="mb-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.voting_enabled}
                    onChange={(e) => handleInputChange('voting_enabled', e.target.checked)}
                    className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-white font-semibold">트랙 투표 활성화</span>
                </label>
                <p className="text-gray-400 text-sm mt-2 ml-8">
                  활성화하면 매주 참가자들이 투표하여 트랙을 선택할 수 있습니다.
                </p>
              </div>

              {/* 트랙 옵션 설정 */}
              {formData.voting_enabled && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    트랙 옵션 *
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <select
                        value={tempTrack}
                        onChange={(e) => setTempTrack(e.target.value)}
                        className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                      >
                        <option value="">트랙을 선택하세요</option>
                        {gameTracks[game]?.map((track) => (
                          <option key={track} value={track}>
                            {track}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={addTrackOption}
                        disabled={!tempTrack}
                        className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        추가
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.track_options.map((track, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2">
                          <span className="text-white">{track}</span>
                          <button
                            type="button"
                            onClick={() => removeTrackOption(index)}
                            className="text-red-400 hover:text-red-300 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    {formData.track_options.length === 0 && (
                      <p className="text-gray-500 text-sm">트랙 옵션을 추가해주세요.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 추가 정보 */}
            <div className="border-t border-gray-700 pt-8">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span>🔗</span>
                추가 정보
              </h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  링크 (참여/원문)
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => handleInputChange('link', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                  placeholder="https://gall.dcinside.com/..."
                />
                <p className="text-gray-400 text-sm mt-2">
                  링크가 있으면 설명이 클릭 가능한 링크로 표시됩니다.
                </p>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading ? '생성 중...' : '이벤트 생성'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}