'use client'

import { useParams } from 'next/navigation'
import { JSX, useEffect, useState } from 'react'

// 링크, 이미지 등을 처리하는 간단한 parser
function parseContent(content: string): JSX.Element[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const lines = content.split('\n')

  return lines.map((line, i) => {
    const parts = line.split(urlRegex)

    return (
      <p key={i} className="mb-2">
        {parts.map((part, index) => {
          if (urlRegex.test(part)) {
            if (/\.(jpeg|jpg|png|gif|webp)$/.test(part)) {
              // 이미지 URL
              return (
                <img
                  key={index}
                  src={part}
                  alt="첨부 이미지"
                  className="my-4 max-w-full rounded shadow"
                />
              )
            } else {
              // 일반 링크
              return (
                <a
                  key={index}
                  href={part}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline"
                >
                  {part}
                </a>
              )
            }
          } else {
            return <span key={index}>{part}</span>
          }
        })}
      </p>
    )
  })
}

export default function NoticeDetailPage() {
  const params = useParams()
  const id =
    typeof params.id === 'string'
      ? params.id
      : Array.isArray(params.id)
      ? params.id[0]
      : ''

  const [notice, setNotice] = useState<{ title: string; content: string } | null>(null)

  useEffect(() => {
    if (!id) return

    const fetchNotice = async () => {
      const res = await fetch(`/api/game-notices/${id}`)
      if (!res.ok) return

      try {
        const data = await res.json()
        setNotice({ title: data.title, content: data.content })
      } catch (error) {
        console.error('❌ JSON 파싱 실패:', error)
      }
    }

    fetchNotice()
  }, [id])

  if (!notice) return <div className="text-center mt-10">로딩 중...</div>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{notice.title}</h1>
      <div className="text-gray-800">{parseContent(notice.content)}</div>
    </div>
  )
}
