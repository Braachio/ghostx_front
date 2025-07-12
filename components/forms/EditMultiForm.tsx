'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentWeekNumber, getWeekRange } from '@/app/utils/dateUtils'

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
  year: number
  week: number
}

export default function EditMultiForm({ id }: { id: string }) {
  const router = useRouter()
  const currentWeekInfo = getCurrentWeekNumber()

  const [title, setTitle] = useState('')
  const [game, setGame] = useState('')
  const [multiRace, setMultiRace] = useState('')
  const [multiClass, setMultiClass] = useState('')
  const [gameTrack, setGameTrack] = useState('')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [description, setDescription] = useState('')
  const [link, setLink] = useState('')
  const [year, setYear] = useState(currentWeekInfo.year)
  const [week, setWeek] = useState(currentWeekInfo.week)

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const res = await fetch(`/api/multis/${id}`)
        if (!res.ok) throw new Error('❌ 데이터 불러오기 실패')

        const json = await res.json()
        const data = (json.data ?? json) as MultisType

        setTitle(data.title ?? '')
        setGame(String(data.game ?? ''))
        setMultiRace(data.multi_race ?? '')
        setMultiClass(data.multi_class ?? '')
        setGameTrack(data.game_track ?? '')
        setMultiDay(data.multi_day ?? [])
        setMultiTime(data.multi_time ?? '')
        setDescription(data.description ?? '')
        setLink(data.link ?? '')
        setYear(data.year ?? currentWeekInfo.year)
        setWeek(data.week ?? currentWeekInfo.week)
      } catch (error) {
        console.error('공지 불러오기 실패:', error)
      }
    }

    fetchNotice()
  }, [currentWeekInfo, id])

  const handleDayChange = (day: string) => {
    setMultiDay((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const access_token = localStorage.getItem('access_token')

    const body: MultisType = {
      title,
      game,
      multi_race: multiRace,
      multi_class: multiClass,
      multi_day: multiDay,
      multi_time: multiTime,
      description,
      game_track: gameTrack,
      year,
      week,
      link,
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
      router.push('/myposts')
    } else {
      alert('수정 실패')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md w-full p-6 bg-white dark:bg-gray-800 shadow-md rounded"
      >
        <h2 className="text-xl font-bold mb-2 text-center text-gray-800 dark:text-white">
          ✏️ 공지 수정
        </h2>

        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          required
          className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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
          className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <input
          type="text"
          placeholder="레이스 (예: 스프린트)"
          value={multiRace}
          onChange={(e) => setMultiRace(e.target.value)}
          maxLength={9}
          required
          className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <input
          type="text"
          placeholder="클래스 (예: GT3)"
          value={multiClass}
          onChange={(e) => setMultiClass(e.target.value)}
          maxLength={9}
          required
          className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <input
          type="text"
          placeholder="트랙"
          value={gameTrack}
          onChange={(e) => setGameTrack(e.target.value)}
          maxLength={9}
          required
          className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <fieldset className="flex flex-wrap gap-2 text-gray-800 dark:text-gray-200">
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

        <label className="text-sm text-gray-800 dark:text-gray-200">
          오픈 시간:
          <input
            type="time"
            value={multiTime}
            onChange={(e) => setMultiTime(e.target.value)}
            className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </label>

        <label className="text-sm text-gray-800 dark:text-gray-200">
          주차 선택:
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
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

        <input
          type="url"
          placeholder="공지 링크 (선택)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <button
          type="submit"
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
        >
          수정하기
        </button>
      </form>
    </div>
  )
}
