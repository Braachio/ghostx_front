'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const GAME_OPTIONS = ['컴페티치오네','아세토코르사','그란투리스모7','르망얼티밋','EA WRC','아이레이싱','알펙터2', 'F1 25', '오토모빌리스타2']
const DAY_OPTIONS = ['월','화','수','목','금','토','일']

function getISOWeek(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return { year: d.getUTCFullYear(), week }
}

export default function NewMultiPage() {
  const router = useRouter()

  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)

  const [title, setTitle] = useState('')
  const [game, setGame] = useState('')
  const [gameTrack, setGameTrack] = useState('')
  const [multiClass, setMultiClass] = useState('GT3')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [week, setWeek] = useState<number>(getISOWeek(new Date()).week)
  const [submitting, setSubmitting] = useState(false)

  const toggleDay = (d: string) => {
    setMultiDay(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  // 주차별 라벨 생성 함수
  const getWeekLabel = (weekNum: number, yearNum: number) => {
    const currentWeek = getISOWeek(new Date()).week
    const currentYear = new Date().getFullYear()
    
    if (yearNum === currentYear) {
      if (weekNum === currentWeek) return '이번주'
      if (weekNum === currentWeek + 1) return '다음주'
      if (weekNum === currentWeek + 2) return '2주 후'
      if (weekNum === currentWeek + 3) return '3주 후'
      if (weekNum === currentWeek - 1) return '지난주'
      if (weekNum === currentWeek - 2) return '2주 전'
    }
    
    return `${weekNum}주차`
  }

  // 주차 옵션 생성 (이번주부터 3주 후까지)
  const getWeekOptions = () => {
    const currentWeek = getISOWeek(new Date()).week
    const options = []
    
    for (let i = 0; i <= 3; i++) {
      const weekNum = currentWeek + i // 이번주부터 3주 후까지
      if (weekNum >= 1 && weekNum <= 52) {
        options.push({
          value: weekNum,
          label: getWeekLabel(weekNum, year)
        })
      }
    }
    
    return options
  }


  const handleImport = async () => {
    if (!importUrl.trim()) return
    setImporting(true)
    try {
      const res = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '가져오기 실패')
      if (data.title) setTitle(data.title)
      if (data.game) setGame(data.game)
      if (data.game_track) setGameTrack(data.game_track)
      if (Array.isArray(data.multi_day) && data.multi_day.length) setMultiDay(data.multi_day)
      if (data.multi_time) setMultiTime(data.multi_time)
      if (data.link) setLink(data.link)
      if (typeof data.year === 'number') setYear(data.year)
      if (typeof data.week === 'number') setWeek(data.week)
      
      // 디버그 정보 표시
      if (data.debug) {
        console.log('파싱 결과:', data.debug)
        const debugInfo = `
제목: ${data.debug.title_text || '없음'}
게임: ${data.debug.game_text || '없음'} (매칭된 키워드: ${data.debug.matched_game_keywords.join(', ') || '없음'})
트랙: ${data.debug.track_text || '없음'} (매칭된 키워드: ${data.debug.matched_track_keywords.join(', ') || '없음'})
클래스: ${data.debug.class_text || '없음'}
요일: ${data.debug.days_text.join(', ') || '없음'}
시간: ${data.debug.time_text || '없음'}
날짜: ${data.debug.date_text || '없음'}
연도/주차: ${data.debug.year_week || '없음'}
HTML 길이: ${data.debug.html_length}자
        `.trim()
        
        alert(`불러오기 완료!\n\n${debugInfo}\n\n값을 확인하고 등록하세요.`)
      } else {
        alert('불러오기 완료. 값을 확인하고 등록하세요.')
      }
    } catch (e: unknown) {
      const error = e as Error
      alert(error?.message || '가져오기 실패')
    } finally {
      setImporting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !game.trim() || !gameTrack.trim() || multiDay.length === 0) {
      alert('제목/게임/트랙/요일은 필수입니다.')
      return
    }
    setSubmitting(true)
    try {
      // API 라우트를 통해 등록
      const response = await fetch('/api/multis', {
        method: 'POST',
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
          is_open: isOpen,
          description: description || null,
          link: link || null,
          year: year ?? null,
          week: week ?? null,
        })
      })
      
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || '등록 실패')
      }
      
      alert('이벤트가 등록되었습니다.')
      router.push('/multis')
    } catch (e: unknown) {
      const error = e as Error
      alert(error?.message || '등록 실패')
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
            🏁 새 이벤트 등록
          </h1>
          <p className="text-gray-400 text-lg">레이싱 커뮤니티에 새로운 이벤트를 추가하세요</p>
        </div>

        {/* URL 불러오기 섹션 */}
        <div className="bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm border border-cyan-500/30 rounded-xl p-6 mb-8 shadow-2xl shadow-cyan-500/10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔗</span>
            <h2 className="text-xl font-semibold text-white">URL로 불러오기</h2>
          </div>
          <p className="text-gray-400 text-sm mb-4">갤러리 글 URL을 입력하면 자동으로 정보를 가져옵니다</p>
          <div className="flex gap-3">
            <input 
              type="url" 
              placeholder="https://gall.dcinside.com/..." 
              value={importUrl} 
              onChange={(e)=>setImportUrl(e.target.value)} 
              className="flex-1 px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
            />
            <button 
              type="button" 
              onClick={handleImport} 
              disabled={importing || !importUrl.trim()} 
              className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:from-cyan-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/25 font-semibold"
            >
              {importing ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  불러오는 중...
                </div>
              ) : (
                '📥 불러오기'
              )}
            </button>
          </div>
        </div>

        {/* 이벤트 등록 폼 */}
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
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}년</option>
                  <option value={new Date().getFullYear() + 1}>{new Date().getFullYear() + 1}년</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-cyan-400">주차</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={week} 
                  onChange={e => setWeek(parseInt(e.target.value))}
                >
                  {getWeekOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.value}주차)
                    </option>
                  ))}
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
                <label className="block text-sm font-medium text-cyan-400">설명</label>
                <textarea 
                  rows={4} 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none" 
                  value={description} 
                  onChange={e=>setDescription(e.target.value)} 
                  placeholder="이벤트에 대한 자세한 설명을 입력하세요..."
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-600">
                <input 
                  id="open" 
                  type="checkbox" 
                  className="w-5 h-5 text-cyan-600 bg-gray-800 border-gray-600 rounded focus:ring-cyan-500 focus:ring-2" 
                  checked={isOpen} 
                  onChange={e=>setIsOpen(e.target.checked)} 
                />
                <label htmlFor="open" className="text-gray-300 font-medium">
                  활성으로 등록 (체크하면 다른 사용자들이 볼 수 있습니다)
                </label>
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-center pt-6">
            <button 
              type="submit" 
              disabled={submitting} 
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-green-500/25 font-semibold text-lg"
            >
              {submitting ? (
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  등록 중...
                </div>
              ) : (
                '🏁 이벤트 등록하기'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

