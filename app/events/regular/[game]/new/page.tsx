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

interface RegularEventFormData {
  title: string
  description: string
  day_of_week: string
  start_time: string
  duration_hours: number
  link?: string
  // 투표 옵션들
  track_options: string[]
  car_class_options: string[]
  voting_enabled: boolean
  voting_duration_days: number
  // 자동 투표 설정
  auto_voting_enabled: boolean
  voting_start_offset_days: number
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
    track_options: [],
    car_class_options: [],
    voting_enabled: true,
    voting_duration_days: 3,
    auto_voting_enabled: false,
    voting_start_offset_days: 1
  })

  // 임시 입력값들
  const [tempTrack, setTempTrack] = useState('')
  const [tempCarClass, setTempCarClass] = useState('')

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
      if (formData.car_class_options.length === 0) {
        alert('차량 클래스 옵션을 최소 1개 이상 추가해주세요.')
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
        track_options: formData.track_options,
        car_class_options: formData.car_class_options,
        voting_enabled: formData.voting_enabled,
        voting_duration_days: formData.voting_duration_days,
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
        
        // 자동 투표가 활성화된 경우 투표 스케줄 설정
        if (formData.auto_voting_enabled && eventId) {
          try {
            const scheduleResponse = await fetch(`/api/regular-events/${eventId}/voting-schedule`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                auto_voting_enabled: formData.auto_voting_enabled,
                voting_start_offset_days: formData.voting_start_offset_days,
                voting_duration_days: formData.voting_duration_days,
                weeks_ahead: 4 // 4주 앞까지 스케줄 생성
              }),
            })
            
            if (!scheduleResponse.ok) {
              console.warn('자동 투표 스케줄 설정 실패 (이벤트는 생성됨)')
            }
          } catch (scheduleError) {
            console.warn('자동 투표 스케줄 설정 중 오류 (이벤트는 생성됨):', scheduleError)
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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

  const addCarClassOption = () => {
    if (tempCarClass.trim() && !formData.car_class_options.includes(tempCarClass.trim())) {
      setFormData(prev => ({
        ...prev,
        car_class_options: [...prev.car_class_options, tempCarClass.trim()]
      }))
      setTempCarClass('')
    }
  }

  const removeCarClassOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      car_class_options: prev.car_class_options.filter((_, i) => i !== index)
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
      <div className="max-w-4xl mx-auto p-6">
        {/* 헤더 */}
        <div className="mb-12 text-center">
          <div className="inline-block mb-6">
            <div className="text-7xl animate-pulse">📅</div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent mb-4">
            {gameDisplayName} 정기 이벤트 등록
          </h1>
          <p className="text-gray-400 text-lg">
            매주 반복되는 정기 레이싱 이벤트를 등록하세요
          </p>
          <div className="mt-6 h-px w-96 mx-auto bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
        </div>

        {/* 정기 이벤트 설명 */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-blue-500/40 rounded-2xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔄</div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-3">
                  정기 이벤트란?
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  매주 같은 요일, 같은 시간에 반복되는 정규 레이싱 이벤트입니다. 
                  연도나 주차를 선택할 필요 없이 요일과 시간만 설정하면 됩니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-blue-400">
                    <span>📅</span>
                    <span>매주 반복</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-400">
                    <span>⏰</span>
                    <span>고정 시간</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-400">
                    <span>🎯</span>
                    <span>일정 예측 가능</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 등록 폼 */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800/20 to-black/20 rounded-2xl blur-xl"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 border border-gray-700 rounded-2xl p-8 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* 기본 정보 */}
              <div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-2">
                    이벤트 제목 *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    placeholder="예: 매주 일요일 GT3 챔피언십"
                  />
                </div>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  이벤트 설명 *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white resize-none"
                  placeholder="이벤트에 대한 자세한 설명을 입력하세요..."
                />
              </div>

              {/* 투표 설정 */}
              <div className="border-t border-gray-700 pt-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>🗳️</span>
                  투표 설정
                </h3>
                
                <div className="mb-6">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.voting_enabled}
                      onChange={(e) => handleInputChange('voting_enabled', e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-white font-semibold">매주 트랙과 차량 클래스 투표 활성화</span>
                  </label>
                  <p className="text-gray-400 text-sm mt-2 ml-8">
                    활성화하면 매주 참가자들이 투표하여 트랙과 차량 클래스를 선택할 수 있습니다.
                  </p>
                </div>

                {formData.voting_enabled && (
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      투표 기간 (일)
                    </label>
                    <select
                      value={formData.voting_duration_days}
                      onChange={(e) => handleInputChange('voting_duration_days', parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    >
                      <option value={1}>1일</option>
                      <option value={2}>2일</option>
                      <option value={3}>3일</option>
                      <option value={5}>5일</option>
                      <option value={7}>7일</option>
                    </select>
                  </div>
                )}
              </div>

              {/* 투표 옵션 설정 */}
              {formData.voting_enabled && (
                <div className="border-t border-gray-700 pt-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span>🎯</span>
                    투표 옵션 설정
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 트랙 옵션 */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        트랙 옵션 *
                      </label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tempTrack}
                            onChange={(e) => setTempTrack(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrackOption())}
                            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                            placeholder="예: Spa-Francorchamps"
                          />
                          <button
                            type="button"
                            onClick={addTrackOption}
                            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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

                    {/* 차량 클래스 옵션 */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-2">
                        차량 클래스 옵션 *
                      </label>
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={tempCarClass}
                            onChange={(e) => setTempCarClass(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCarClassOption())}
                            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                            placeholder="예: GT3, LMP2, Formula 1"
                          />
                          <button
                            type="button"
                            onClick={addCarClassOption}
                            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            추가
                          </button>
                        </div>
                        
                        <div className="space-y-2">
                          {formData.car_class_options.map((carClass, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-2">
                              <span className="text-white">{carClass}</span>
                              <button
                                type="button"
                                onClick={() => removeCarClassOption(index)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        {formData.car_class_options.length === 0 && (
                          <p className="text-gray-500 text-sm">차량 클래스 옵션을 추가해주세요.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 정기 일정 */}
              <div className="border-t border-gray-700 pt-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>🔄</span>
                  정기 일정 설정
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      요일 *
                    </label>
                    <select
                      required
                      value={formData.day_of_week}
                      onChange={(e) => handleInputChange('day_of_week', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
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
                      required
                      value={formData.start_time}
                      onChange={(e) => handleInputChange('start_time', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">
                      진행 시간 (시간) *
                    </label>
                    <select
                      required
                      value={formData.duration_hours}
                      onChange={(e) => handleInputChange('duration_hours', parseInt(e.target.value))}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                    >
                      <option value={1}>1시간</option>
                      <option value={1.5}>1.5시간</option>
                      <option value={2}>2시간</option>
                      <option value={2.5}>2.5시간</option>
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

              {/* 자동 투표 설정 */}
              <div className="border-t border-gray-700 pt-8">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <span>🤖</span>
                  자동 투표 스케줄
                </h3>
                
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      id="auto_voting_enabled"
                      checked={formData.auto_voting_enabled}
                      onChange={(e) => handleInputChange('auto_voting_enabled', e.target.checked)}
                      className="w-5 h-5 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="auto_voting_enabled" className="text-white font-medium">
                      자동 투표 스케줄 사용
                    </label>
                  </div>
                  
                  <div className="text-sm text-gray-400 bg-gray-800/50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <span>💡</span>
                      <div>
                        <p className="font-semibold text-gray-300 mb-2">자동 투표 스케줄이란?</p>
                        <ul className="space-y-1 text-gray-400">
                          <li>• 이벤트 시작 전 자동으로 투표가 재개됩니다</li>
                          <li>• 설정된 기간 후 자동으로 투표가 종료됩니다</li>
                          <li>• 매주 반복되는 정기 이벤트에 최적화된 기능입니다</li>
                          <li>• 예: 월요일 멀티 → 화요일 00:00 투표 시작 → 목요일 23:59 투표 종료</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  {formData.auto_voting_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          투표 시작 시점 (이벤트 시작 전)
                        </label>
                        <select
                          value={formData.voting_start_offset_days}
                          onChange={(e) => handleInputChange('voting_start_offset_days', parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                        >
                          <option value={1}>1일 전 (00:00)</option>
                          <option value={2}>2일 전 (00:00)</option>
                          <option value={3}>3일 전 (00:00)</option>
                          <option value={4}>4일 전 (00:00)</option>
                          <option value={5}>5일 전 (00:00)</option>
                          <option value={6}>6일 전 (00:00)</option>
                          <option value={7}>1주 전 (00:00)</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-2">
                          투표 지속 기간
                        </label>
                        <select
                          value={formData.voting_duration_days}
                          onChange={(e) => handleInputChange('voting_duration_days', parseInt(e.target.value))}
                          className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-white"
                        >
                          <option value={1}>1일</option>
                          <option value={2}>2일</option>
                          <option value={3}>3일</option>
                          <option value={4}>4일</option>
                          <option value={5}>5일</option>
                          <option value={6}>6일</option>
                          <option value={7}>1주</option>
                        </select>
                      </div>
                    </div>
                  )}
                  
                  {formData.auto_voting_enabled && (
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-blue-400">📅</span>
                        <span className="text-blue-300 font-semibold">투표 스케줄 예시</span>
                      </div>
                      <div className="text-sm text-blue-200 space-y-1">
                        <p>• <strong>{formData.day_of_week}요일</strong> 이벤트 기준</p>
                        <p>• 투표 시작: <strong>이벤트 {formData.voting_start_offset_days}일 전 00:00</strong></p>
                        <p>• 투표 종료: <strong>투표 시작 후 {formData.voting_duration_days}일 후 23:59</strong></p>
                      </div>
                    </div>
                  )}
                </div>
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
                    심레이싱게임 갤러리 등 참여 링크를 입력하세요. 입력된 링크는 이벤트 상세 페이지에서 클릭할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* 버튼들 */}
              <div className="flex justify-center gap-4 pt-8">
                <Link href={`/events/regular/${game}`}>
                  <button
                    type="button"
                    className="px-8 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-semibold"
                  >
                    취소
                  </button>
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg shadow-green-500/50 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '등록 중...' : '정기 이벤트 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
