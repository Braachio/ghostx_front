'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWeekInfo, getWeekOptions, getWeekDateRange } from '@/app/utils/weekUtils'

type MultisType = {
  title: string
  game: string
  multi_race: string
  multi_class: string
  game_track: string
  multi_day: string[]
  multi_time: string
  description: string
  link: string
  is_open: boolean
  year: number
  week: number
}

const GAME_OPTIONS = ['컴페티치오네','아세토코르사','그란투리스모7','르망얼티밋','EA WRC','아이레이싱','알펙터2', 'F1 25', '오토모빌리스타2']
const DAY_OPTIONS = ['월','화','수','목','금','토','일']

// 주차 계산 함수 제거 (날짜 기반 시스템으로 변경)

export default function EditMultiForm({ id }: { id: string }) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [game, setGame] = useState('')
  const [gameTrack, setGameTrack] = useState('')
  const [multiClass, setMultiClass] = useState('')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [bookmarkUrl, setBookmarkUrl] = useState('')
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const currentWeekInfo = getCurrentWeekInfo()
  const [year, setYear] = useState<number>(currentWeekInfo.year)
  const [week, setWeek] = useState<number>(currentWeekInfo.week)
  const [submitting, setSubmitting] = useState(false)

  const toggleDay = (d: string) => {
    setMultiDay(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  // URL 북마크 기능
  const handleBookmarkUrl = async () => {
    if (!bookmarkUrl.trim()) {
      alert('URL을 입력해주세요.')
      return
    }

    setBookmarkLoading(true)
    try {
      const response = await fetch('/api/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: bookmarkUrl }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // 제목이 비어있으면 북마크에서 가져온 제목 사용
        if (!title.trim() && data.title) {
          setTitle(data.title)
        }
        
        // 설명을 북마크에서 가져온 내용으로 설정
        if (data.description) {
          setDescription(data.description)
        }
        
        // 링크도 설정
        setLink(bookmarkUrl)
        
        alert('북마크 정보를 가져왔습니다!')
      } else {
        const errorData = await response.json()
        alert(errorData.error || '북마크 정보를 가져올 수 없습니다.')
      }
    } catch (error) {
      console.error('북마크 처리 실패:', error)
      alert('북마크 처리 중 오류가 발생했습니다.')
    } finally {
      setBookmarkLoading(false)
    }
  }

  // 주차 관련 함수들 제거 (날짜 기반 시스템으로 변경)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/multis/${id}`)
        if (!res.ok) throw new Error('데이터 불러오기 실패')

        const json = await res.json()
        const data = (json.data ?? json) as MultisType

        setTitle(data.title ?? '')
        setGame(String(data.game ?? ''))
        setGameTrack(data.game_track ?? '')
        setMultiClass(data.multi_class ?? '')
        setMultiDay(data.multi_day ?? [])
        setMultiTime(data.multi_time ?? '')
        setDescription(data.description ?? '')
        setLink(data.link ?? '')
        setIsOpen(data.is_open ?? false)
        setYear(data.year ?? currentWeekInfo.year)
        setWeek(data.week ?? currentWeekInfo.week)
      } catch (error) {
        console.error('데이터 불러오기 실패:', error)
        alert('데이터를 불러올 수 없습니다.')
      }
    }

    fetchData()
  }, [id, currentWeekInfo.week, currentWeekInfo.year])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !game.trim() || !gameTrack.trim() || multiDay.length === 0) {
      alert('제목/게임/트랙/요일은 필수입니다.')
      return
    }
    setSubmitting(true)
    try {
      const response = await fetch(`/api/multis/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          game,
          game_track: gameTrack,
          multi_class: multiClass,
          multi_day: multiDay,
          multi_time: multiTime || null,
          multi_race: null,
          is_open: true, // 기본적으로 활성으로 유지
          description: description || null,
          link: link || null,
          year: year,
          week: week,
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '수정 실패')
      }
      
      alert('이벤트가 수정되었습니다.')
      router.push('/multis')
    } catch (e: unknown) {
      const error = e as Error
      alert(error?.message || '수정 실패')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-black min-h-screen relative overflow-hidden">
      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto px-6 lg:px-8 py-8 relative z-10">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
            ✏️ 이벤트 수정
          </h1>
          <p className="text-gray-400 text-lg">레이싱 이벤트 정보를 수정하세요</p>
        </div>

        {/* 이벤트 수정 폼 */}
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-8 shadow-2xl shadow-cyan-500/10">
          {/* 기본 정보 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📝</span>
              <h2 className="text-xl font-semibold text-white">기본 정보</h2>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400">제목 *</label>
                <input 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={title} 
                  onChange={(e)=>setTitle(e.target.value)} 
                  placeholder="이벤트 제목을 입력하세요"
                  required 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cyan-400">게임 *</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                    value={game} 
                    onChange={(e)=>setGame(e.target.value)} 
                    required
                  >
                    <option value="">게임을 선택하세요</option>
                    {GAME_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cyan-400">트랙 *</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                    value={gameTrack} 
                    onChange={(e)=>setGameTrack(e.target.value)} 
                    placeholder="예: Monza, Spa-Francorchamps"
                    required 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 일정 정보 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📅</span>
              <h2 className="text-xl font-semibold text-white">일정 정보</h2>
            </div>
            
            {/* 요일 선택 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-cyan-400 mb-3">요일 *</label>
              <div className="flex flex-wrap gap-3">
                {DAY_OPTIONS.map(d => (
                  <label key={d} className={`px-4 py-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${multiDay.includes(d)?'bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/25':'bg-gray-800/50 text-gray-300 border-gray-600 hover:border-gray-500'}`}>
                    <input type="checkbox" className="hidden" checked={multiDay.includes(d)} onChange={()=>toggleDay(d)} />
                    <span className="font-medium">{d}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 시간 및 날짜 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400">시간</label>
                <input 
                  placeholder="20:00 (예: 20:30, 20시30분)" 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={multiTime} 
                  onChange={e=>setMultiTime(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400">클래스</label>
                <input 
                  placeholder="GT3, GT4, Formula 등" 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={multiClass} 
                  onChange={e=>setMultiClass(e.target.value)} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400">연도</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={year} 
                  onChange={e => setYear(parseInt(e.target.value))}
                >
                  <option value={currentWeekInfo.year}>{currentWeekInfo.year}년</option>
                  <option value={currentWeekInfo.year + 1}>{currentWeekInfo.year + 1}년</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400">주차</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={week} 
                  onChange={e => setWeek(parseInt(e.target.value))}
                >
                  {getWeekOptions(year, week).map(option => {
                    const { start, end } = getWeekDateRange(year, option.value)
                    const startStr = `${start.getMonth() + 1}/${start.getDate()}`
                    const endStr = `${end.getMonth() + 1}/${end.getDate()}`
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label} ({option.value}주차) - {startStr} ~ {endStr}
                      </option>
                    )
                  })}
                </select>
              </div>
            </div>
          </div>

          {/* 추가 정보 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🔗</span>
              <h2 className="text-xl font-semibold text-white">추가 정보</h2>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400">링크 (참여/원문)</label>
                <input 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={link} 
                  onChange={e=>setLink(e.target.value)} 
                  placeholder="https://gall.dcinside.com/..."
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400">URL 북마크</label>
                <div className="flex gap-2">
                  <input 
                    type="url"
                    className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                    value={bookmarkUrl} 
                    onChange={e=>setBookmarkUrl(e.target.value)} 
                    placeholder="https://gall.dcinside.com/..."
                  />
                  <button
                    type="button"
                    onClick={handleBookmarkUrl}
                    disabled={bookmarkLoading || !bookmarkUrl.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium whitespace-nowrap"
                  >
                    {bookmarkLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        가져오는 중...
                      </div>
                    ) : (
                      '📖 정보 가져오기'
                    )}
                  </button>
                </div>
                <p className="text-gray-400 text-sm">
                  URL을 입력하고 "정보 가져오기"를 클릭하면 자동으로 제목과 설명을 가져옵니다.
                </p>
              </div>
              
              {/* 가져온 설명 표시 */}
              {description && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-cyan-400">설명 (자동 가져옴)</label>
                  <div className="px-4 py-3 bg-gray-800/30 border border-gray-600 rounded-lg text-gray-300 text-sm">
                    {description}
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-center pt-6">
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-8 py-4 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/25 font-semibold text-lg"
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  수정 중...
                </div>
              ) : (
                '✏️ 이벤트 수정하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}