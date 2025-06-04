'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

export default function CreateMultiForm() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [gameCategory, setGameCategory] = useState('')
  const [game, setGame] = useState('')
  const [multiName, setMultiName] = useState('')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        alert('로그인이 필요합니다.')
        router.push('/login')
      } else {
        setUserId(data.user.id)
      }
    })
  }, [])

  const handleDayChange = (day: string) => {
    setMultiDay(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return

    const { error } = await supabase.from('multis').insert({
      title,
      game_category: gameCategory,
      game,
      multi_name: multiName,
      multi_day: multiDay,
      multi_time: multiTime,
      is_open: isOpen,
      description,
      author_id: userId,
      created_at: new Date().toISOString(),
    })

    if (error) {
      alert(`등록 실패: ${error.message}`)
    } else {
      alert('멀티 공지 등록 완료!')
      router.push('/multis')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md w-full p-6 bg-white shadow-md rounded">
        <h2 className="text-xl font-bold mb-2 text-center">📢 새 공지 등록</h2>

        <select value={game} onChange={(e) => setGame(e.target.value)} required className="border p-2 rounded">
          <option value="">게임을 선택하세요</option>
          <option value="컴페티치오네">컴페티치오네</option>
          <option value="아세토코르사">아세토코르사</option>
          <option value="그란투리스모7">그란투리스모7</option>
          <option value="르망얼티밋">르망얼티밋</option>
          <option value="아이레이싱">아이레이싱</option>
          <option value="알펙터2">알펙터2</option>
        </select>

        <input type="text" placeholder="공지 제목" value={title} onChange={(e) => setTitle(e.target.value)} required className="border p-2 rounded" />
        <input type="text" placeholder="클래스 (예: GT3)" value={multiName} onChange={(e) => setMultiName(e.target.value)} required className="border p-2 rounded" />
        <input type="text" placeholder="트랙" value={gameCategory} onChange={(e) => setGameCategory(e.target.value)} required className="border p-2 rounded" />

        <fieldset className="flex flex-wrap gap-2">
          <legend className="text-sm font-medium">요일</legend>
          {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
            <label key={day} className="text-sm">
              <input type="checkbox" checked={multiDay.includes(day)} onChange={() => handleDayChange(day)} /> {day}
            </label>
          ))}
        </fieldset>

        <input type="text" placeholder="오픈 시간 (예: 20:30)" value={multiTime} onChange={(e) => setMultiTime(e.target.value)} className="border p-2 rounded" />

        <label className="text-sm">
          <input type="checkbox" checked={isOpen} onChange={(e) => setIsOpen(e.target.checked)} className="mr-2" />
          오픈 여부
        </label>

        <textarea placeholder="상세 내용" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 rounded h-32" />

        <button type="submit" className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">등록</button>
      </form>
    </div>
  )
}
