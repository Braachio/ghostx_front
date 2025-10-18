'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import WeekCalendar from '@/components/WeekCalendar'

const GAME_OPTIONS = ['컴페티치오네','아세토코르사','그란투리스모7','르망얼티밋','EA WRC','아이레이싱','알펙터2', 'F1 25', '오토모빌리스타2']
const DAY_OPTIONS = ['월','화','수','목','금','토','일']

export default function NewMultiPage() {
  const router = useRouter()


  const [title, setTitle] = useState('')
  const [game, setGame] = useState('')
  const [gameTrack, setGameTrack] = useState('')
  const [multiClass, setMultiClass] = useState('GT3')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [link, setLink] = useState('')
  const [description, setDescription] = useState('')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const toggleDay = (d: string) => {
    setMultiDay(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const handleDateSelect = (date: string) => {
    console.log('=== multis/new 날짜 처리 디버깅 ===')
    console.log('받은 날짜 문자열:', date)
    
    // 날짜 파싱 방법들 비교
    const method1 = new Date(date)
    const method2 = new Date(date + 'T00:00:00')
    const method3 = new Date(date + 'T12:00:00')
    
    console.log('방법1 (기본):', method1, method1.toLocaleString('ko-KR'))
    console.log('방법2 (자정):', method2, method2.toLocaleString('ko-KR'))
    console.log('방법3 (정오):', method3, method3.toLocaleString('ko-KR'))
    
    setSelectedDate(date)
    
    // 정오 시간으로 파싱하여 타임존 문제 방지
    const selectedDateObj = new Date(date + 'T12:00:00')
    const dayName = ['일', '월', '화', '수', '목', '금', '토'][selectedDateObj.getDay()]
    console.log('최종 선택된 날짜:', selectedDateObj.toLocaleString('ko-KR'))
    console.log('계산된 요일:', dayName)
    setMultiDay([dayName])
  }




  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !game.trim() || !gameTrack.trim() || !selectedDate) {
      alert('제목/게임/트랙/날짜는 필수입니다.')
      return
    }
    setSubmitting(true)
    try {
      // 선택된 날짜에서 year, week 계산
      const selectedDateObj = new Date(selectedDate)
      const year = selectedDateObj.getFullYear()
      const week = Math.ceil((selectedDateObj.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
      
      // 디버깅: 전송되는 데이터 확인
      const submitData = {
        title,
        game,
        game_track: gameTrack,
        multi_class: multiClass,
        multi_day: multiDay,
        multi_time: multiTime || null,
        multi_race: null,
        is_open: true, // 기본적으로 활성으로 등록
        description: description || null,
        link: link || null,
        year: year,
        week: week,
        event_date: selectedDate, // 선택된 날짜를 event_date로 설정
      }
      
      console.log('선택된 날짜:', selectedDate, '계산된 year/week:', year, week)
      console.log('등록 시 전송되는 데이터:', submitData)
      
      // API 라우트를 통해 등록
      const response = await fetch('/api/multis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
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
                  <label className="block text-sm font-medium text-cyan-400">트랙 *</label>
                  <input 
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                    value={gameTrack} 
                    onChange={(e)=>setGameTrack(e.target.value)} 
                    placeholder="예: Monza, Spa-Francorchamps"
                    required 
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
            </div>
          </div>

          {/* 일정 정보 */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📅</span>
              <h2 className="text-xl font-semibold text-white">일정 정보</h2>
            </div>
            
            {/* 날짜 선택 */}
            <div className="mb-6">
              <WeekCalendar 
                selectedDate={selectedDate} 
                onDateSelect={handleDateSelect} 
              />
            </div>

            {/* 시간 입력 */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-cyan-400">시간</label>
              <div className="flex gap-2">
                {/* 시간 선택 드롭다운 */}
                <select 
                  className="w-20 px-2 py-2 bg-gray-800/50 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={multiTime.split(':')[0] || ''} 
                  onChange={e=>{
                    const minute = multiTime.split(':')[1] || '00'
                    setMultiTime(`${e.target.value}:${minute}`)
                  }}
                >
                  <option value="">시</option>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0')
                    return (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    )
                  })}
                </select>
                
                <span className="text-gray-400 text-sm flex items-center">:</span>
                
                {/* 분 선택 드롭다운 */}
                <select 
                  className="w-16 px-2 py-2 bg-gray-800/50 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all" 
                  value={multiTime.split(':')[1] || ''} 
                  onChange={e=>{
                    const hour = multiTime.split(':')[0] || '20'
                    setMultiTime(`${hour}:${e.target.value}`)
                  }}
                >
                  <option value="">분</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const minute = (i * 5).toString().padStart(2, '0')
                    return (
                      <option key={minute} value={minute}>
                        {minute}
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
                <label className="block text-sm font-medium text-cyan-400">설명</label>
                <textarea 
                  rows={4} 
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all resize-none" 
                  value={description} 
                  onChange={e=>setDescription(e.target.value)} 
                  placeholder="이벤트에 대한 자세한 설명을 입력하세요..."
                />
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

