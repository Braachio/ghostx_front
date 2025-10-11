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
  const [gameTrack, setGameTrack] = useState('')
  const [game, setGame] = useState('')
  const [multiRace, setMultiRace] = useState('')
  const [multiClass, setMultiClass] = useState('')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [link, setLink] = useState('')

  const [anonymousNickname, setAnonymousNickname] = useState('')
  const [anonymousPassword, setAnonymousPassword] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [supabase])

  const handleDayChange = (day: string) => {
    setMultiDay(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 익명 사용자의 경우 유효성 검증
    if (!userId) {
      if (!anonymousNickname || !/^\d{4}$/.test(anonymousPassword)) {
        alert('닉네임과 4자리 숫자 비밀번호를 입력해주세요.')
        return
      }
    }

    const { error } = await supabase.from('multis').insert({
      title,
      game_track: gameTrack,
      game,
      multi_race: multiRace,
      multi_class: multiClass,
      multi_day: multiDay,
      multi_time: multiTime,
      link,
      event_date: eventDate || null,
      author_id: userId,
      anonymous_nickname: userId ? null : anonymousNickname,
      anonymous_password: userId ? null : anonymousPassword,
      created_at: new Date().toISOString(),
    })

    if (error) {
      alert(`등록 실패: ${error.message}`)
    } else {
      alert('✅ 멀티 공지 등록 완료!')
      router.push('/multis')
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 max-w-md w-full p-6 bg-white dark:bg-gray-800 shadow-md rounded"
      >
        <h2 className="text-xl font-bold mb-2 text-center text-gray-800 dark:text-white">📢 새 공지 등록</h2>

        {!userId && (
          <>
            <input
              type="text"
              placeholder="닉네임 (익명 작성 시)"
              value={anonymousNickname}
              onChange={(e) => setAnonymousNickname(e.target.value)}
              maxLength={10}
              required
              className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <input
              type="password"
              placeholder="숫자 비밀번호 (4자리)"
              value={anonymousPassword}
              onChange={(e) => setAnonymousPassword(e.target.value)}
              pattern="\d{4}"
              title="숫자 4자리 입력"
              required
              className="border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </>
        )}

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
          <option value="EA WRC">EA WRC</option>
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
          이벤트 날짜:
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="border p-2 rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="날짜를 선택하세요"
          />
        </label>

        <input
          type="url"
          placeholder="공지 링크 입력 (예: https://example.com)"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          className="w-full border p-2 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
        >
          등록
        </button>
      </form>
    </div>
  )
}
