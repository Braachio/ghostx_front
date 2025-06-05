// ✅ CreateMultiForm.tsx (최종본)
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import { getWeekRange, getCurrentWeekNumber } from '@/app/utils/dateUtils'

export default function CreateMultiForm() {
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [gameTrack, setGameTrack] = useState('')
  const [game, setGame] = useState('')
  const [multiClass, setMultiClass] = useState('')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [description, setDescription] = useState('')
  const currentWeekInfo = getCurrentWeekNumber()
  const [week, setWeek] = useState<number>(currentWeekInfo.week)

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        alert('로그인이 필요합니다.')
        router.push('/login')
      } else {
        setUserId(data.user.id)
      }
    })
  }, [router, supabase.auth])

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
      game_track: gameTrack,
      game,
      multi_class: multiClass,
      multi_day: multiDay,
      multi_time: multiTime,
      description,
      week,
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
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md w-full p-6 bg-white shadow-md rounded"
      >
        <h2 className="text-xl font-bold mb-2 text-center">\ud83d\udce2 \uc0c8 \uacf5\uc9c0 \ub4f1\ub85d</h2>

        <select
          value={game}
          onChange={(e) => setGame(e.target.value)}
          required
          className="border p-2 rounded"
        >
          <option value="">\uac8c\uc784\uc744 \uc120\ud0dd\ud558\uc138\uc694</option>
          <option value="\ucf64\ud398\ud2f0\uce58\uc624\ub124">\ucf64\ud398\ud2f0\uce58\uc624\ub124</option>
          <option value="\uc544\uc138\ud1a0\ucf54\ub974\uc0ac">\uc544\uc138\ud1a0\ucf54\ub974\uc0ac</option>
          <option value="\uadf8\ub780\ud22c\ub9ac\uc2a4\ubaa87">\uadf8\ub780\ud22c\ub9ac\uc2a4\ubaa87</option>
          <option value="\ub974\ub9cc\uc5bc\ud2f0\ubc84\ud2b8">\ub974\ub9cc\uc5bc\ud2f0\ubc84\ud2b8</option>
          <option value="\uc544\uc774\ub808\uc774\uc2f1">\uc544\uc774\ub808\uc774\uc2f1</option>
          <option value="\uc54c\ud398\ud1302">\uc54c\ud398\ud1302</option>
        </select>

        <input
          type="text"
          placeholder="\uc81c\ubaa9"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="\ud074\ub798\uc2a4 (\uc608: GT3)"
          value={multiClass}
          onChange={(e) => setMultiClass(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <input
          type="text"
          placeholder="\ud2b8\ub799"
          value={gameTrack}
          onChange={(e) => setGameTrack(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <fieldset className="flex flex-wrap gap-2">
          <legend className="text-sm font-medium">\uc694\uc77c</legend>
          {['\uc6d4', '\ud654', '\uc218', '\ubaa9', '\uae08', '\ud1a0', '\uc77c'].map((day) => (
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
          \uc624\ud508 \uc2dc\uac04:
          <input
            type="time"
            value={multiTime}
            onChange={(e) => setMultiTime(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </label>

        <label className="text-sm">
          \uc8fc\ucc28 \uc120\ud0dd:
          <select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            className="border p-2 rounded w-full"
          >
            {Array.from({ length: 5 }, (_, i) => {
              const w = currentWeekInfo.week + i
              const { start, end } = getWeekRange(2025, w)
              const label = `${w}\uc8fc\ucc28 (${start} ~ ${end})${w === currentWeekInfo.week ? ' (\uc774\ubcf4\ub0b4)' : ''}`
              return (
                <option key={w} value={w}>
                  {label}
                </option>
              )
            })}
          </select>
        </label>

        <textarea
          placeholder="\uc0c1\uc138 \ub0b4\uc6a9"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded h-32"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          \ub4f1\ub85d
        </button>
      </form>
    </div>
  )
}
