'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWeekNumber, getWeekRange } from '@/app/utils/dateUtils'

export default function EditMultiForm({ id }: { id: string }) {
  const router = useRouter()
  const currentWeekInfo = getCurrentWeekNumber()

  const [title, setTitle] = useState('')
  const [gameTrack, setGameTrack] = useState('')
  const [game, setGame] = useState('')
  const [multiClass, setMultiClass] = useState('')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [description, setDescription] = useState('')
  const [year, setYear] = useState(currentWeekInfo.year)
  const [week, setWeek] = useState(currentWeekInfo.week)

  useEffect(() => {
    const fetchNotice = async () => {
      const res = await fetch(`/api/multis/${id}`)
      const json = await res.json()
      const data = json.data

      setTitle(data.title)
      setGame(data.game)
      setMultiClass(data.multi_class)
      setMultiDay(data.multi_day || [])
      setMultiTime(data.multi_time || '')
      setDescription(data.description || '')
      setGameTrack(data.game_track || '')
      setYear(data.year || currentWeekInfo.year)
      setWeek(data.week || currentWeekInfo.week)
    }

    fetchNotice()
  }, [currentWeekInfo.week, currentWeekInfo.year, id])

  const handleDayChange = (day: string) => {
    setMultiDay(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const access_token = localStorage.getItem('access_token')

    const body = {
      title,
      game,
      multi_class: multiClass,
      multi_day: multiDay,
      multi_time: multiTime,
      description,
      game_track: gameTrack,
      year,
      week,
    }

    const res = await fetch(`/api/multis/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      alert('수정 완료!')
      router.push('/multis')
    } else {
      alert('수정 실패')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md w-full p-6 bg-white shadow-md rounded"
      >
        <h2 className="text-xl font-bold mb-2 text-center">✏️ 공지 수정</h2>

        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          required
          className="border p-2 rounded"
        >
          <option value="">게임을 선택하세요</option>
          <option value="컴페티치오네">컴페티치오네</option>
          <option value="아세토코르사">아세토코르사</option>
          <option value="그란투리스모7">그란투리스모7</option>
          <option value="르망얼티밋">르망얼티밋</option>
          <option value="아이레이싱">아이레이싱</option>
          <option value="알펙터2">알펙터2</option>
        </select>

        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={9}
          required
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="클래스 (예: GT3)"
          value={multiClass}
          onChange={(e) => setMultiClass(e.target.value)}
          maxLength={9}
          required
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="트랙"
          value={gameTrack}
          onChange={(e) => setGameTrack(e.target.value)}
          maxLength={9}
          required
          className="border p-2 rounded"
        />

        <fieldset className="flex flex-wrap gap-2">
          <legend className="text-sm font-medium">요일</legend>
          {['월', '화', '수', '목', '금', '토', '일'].map((day) => (
            <label key={day} className="text-sm">
              <input
                type="checkbox"
                checked={multiDay.includes(day)}
                onChange={() => handleDayChange(day)}
              />{' '}
              {day}
            </label>
          ))}
        </fieldset>

        <label className="text-sm">
          오픈 시간:
          <input
            type="time"
            value={multiTime}
            onChange={(e) => setMultiTime(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        <label className="text-sm">
          주차 선택:
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="border p-2 rounded w-full"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const w = currentWeekInfo.week + i
              const { start, end } = getWeekRange(currentWeekInfo.year, w)
              const label = `${w}주차 (${start} ~ ${end})${w === currentWeekInfo.week ? ' (이번주)' : ''}`
              return (
                <option key={w} value={w}>
                  {label}
                </option>
              )
            })}
          </select>
        </label>

        <textarea
          placeholder="상세 내용"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded h-32"
        />

        <button
          type="submit"
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          수정하기
        </button>
      </form>
    </div>
  )
}
