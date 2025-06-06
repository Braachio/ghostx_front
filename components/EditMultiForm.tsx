'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function EditMultiForm({ id }: { id: string }) {
  const router = useRouter()

  const [title, setTitle] = useState('')
  const [gameTrack, setGameTrack] = useState('')
  const [game, setGame] = useState('')
  const [multiClass, setMultiClass] = useState('')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')

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
      setIsOpen(data.is_open)
      setDescription(data.description || '')
      setGameTrack(data.game_track || '')
    }

    fetchNotice()
  }, [id])

  const handleDayChange = (day: string) => {
    if (multiDay.includes(day)) {
      setMultiDay(multiDay.filter(d => d !== day))
    } else {
      setMultiDay([...multiDay, day])
    }
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
      is_open: isOpen,
      description,
      game_track: gameTrack,
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
      <select value={game} onChange={e => setGame(e.target.value)} required>
        <option value="">게임을 선택하세요</option>
        <option value="컴페티치오네">컴페티치오네</option>
        <option value="아세토코르사">아세토코르사</option>
        <option value="그란투리스모7">그란투리스모7</option>
        <option value="르망얼티밋">르망얼티밋</option>
        <option value="아이레이싱">아이레이싱</option>
        <option value="알펙터2">알펙터2</option>
      </select>

      <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
      <input type="text" value={multiClass} onChange={e => setMultiClass(e.target.value)} required />
      <input type="text" value={gameTrack} onChange={e => setGameTrack(e.target.value)} required />

      <fieldset>
        <legend>요일</legend>
        {['월', '화', '수', '목', '금', '토', '일'].map(day => (
          <label key={day} className="mr-2">
            <input type="checkbox" checked={multiDay.includes(day)} onChange={() => handleDayChange(day)} /> {day}
          </label>
        ))}
      </fieldset>

      <input type="text" value={multiTime} onChange={e => setMultiTime(e.target.value)} />
      <label>
        <input type="checkbox" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} /> 오픈 여부
      </label>

      <textarea value={description} onChange={e => setDescription(e.target.value)} />

      <button type="submit" className="bg-green-600 text-white py-2 rounded">수정하기</button>
    </form>
  )
}
