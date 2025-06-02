'use client'

import { useState } from 'react'

export default function CreateMultiForm() {
  const [title, setTitle] = useState('')
  const [gameCategory, setGameCategory] = useState('')
  const [game, setGame] = useState('')
  const [multiName, setMultiName] = useState('')
  const [multiDay, setMultiDay] = useState<string[]>([])
  const [multiTime, setMultiTime] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState('')

  const handleDayChange = (day: string) => {
    if (multiDay.includes(day)) {
      setMultiDay(multiDay.filter(d => d !== day))
    } else {
      setMultiDay([...multiDay, day])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const body = {
      title,
      game_category: gameCategory,
      game,
      multi_name: multiName,
      multi_day: multiDay,
      multi_time: multiTime,
      is_open: isOpen,
      description,
      // author_id: 로그인 유저 id 삽입 필요
    }

    const res = await fetch('/api/multis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      alert('멀티 공지 등록 완료!')
      // 초기화 혹은 리다이렉트 등
    } else {
      alert('등록 실패')
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
      
      <input type="text" placeholder="공지 제목" value={title} onChange={e => setTitle(e.target.value)} required />
      <input type="text" placeholder="클래스 (예: GT3, 포뮬러e 등)" value={multiName} onChange={e => setMultiName(e.target.value)} required />
      <input type="text" placeholder="트랙" value={gameCategory} onChange={e => setGameCategory(e.target.value)} required />

      <fieldset>
        <legend>요일</legend>
        {['월', '화', '수', '목', '금', '토', '일'].map(day => (
          <label key={day} className="mr-2">
            <input type="checkbox" checked={multiDay.includes(day)} onChange={() => handleDayChange(day)} /> {day}
          </label>
        ))}
      </fieldset>

      <input type="text" placeholder="오픈 시간 (예: 20:30)" value={multiTime} onChange={e => setMultiTime(e.target.value)} />
      <label>
        <input type="checkbox" checked={isOpen} onChange={e => setIsOpen(e.target.checked)} /> 오픈 여부
      </label>

      <textarea placeholder="상세 내용" value={description} onChange={e => setDescription(e.target.value)} />

      <button type="submit" className="bg-blue-600 text-white py-2 rounded">등록</button>
    </form>
  )
}
