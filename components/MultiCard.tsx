'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'

type Multi = Database['public']['Tables']['multis']['Row']

export default function MultiCard({
  multi,
  currentUserId,
}: {
  multi: Multi
  currentUserId: string | null
}) {
  const supabase = createClientComponentClient<Database>()
  const [isOpen, setIsOpen] = useState(multi.is_open)
  const [isLoading, setIsLoading] = useState(false)

  const isAuthor = currentUserId === multi.author_id

  const toggleOpen = async () => {
    if (!isAuthor || isLoading) return

    setIsLoading(true)

    const { error } = await supabase
      .from('multis')
      .update({ is_open: !isOpen } as Database['public']['Tables']['multis']['Update'])
      .eq('id', multi.id)

    if (!error) setIsOpen(!isOpen)
    else alert(`상태 변경 실패: ${error.message}`)

    setIsLoading(false)
  }

  return (
    <div
      className={`border p-4 rounded shadow min-h-[120px] overflow-hidden transition-colors duration-200
        ${isOpen ? 'border-green-400' : 'border-gray-300'}
        bg-white text-black dark:bg-gray-900 dark:text-white dark:border-gray-700`}
    >
      {/* 제목: 외부 링크가 있으면 <a>, 없으면 <Link> */}
      {multi.link ? (
        <a
          href={multi.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-lg font-semibold hover:underline mb-2 block"
        >
          {multi.title}
        </a>
      ) : (
        <Link href={`/multis/${multi.id}`}>
          <h2 className="text-lg font-semibold hover:underline mb-2">{multi.title}</h2>
        </Link>
      )}

      {/* 오픈 시간 + ON/OFF 버튼 */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm">
          <strong>오픈:</strong> {multi.multi_time || '미입력'}
        </p>

        {isAuthor ? (
          <button
            onClick={toggleOpen}
            disabled={isLoading}
            className={`px-2 py-1 rounded text-xs whitespace-nowrap ml-2 transition-colors duration-200
              ${isOpen
                ? 'bg-green-100 text-green-800 font-bold dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}
          >
            {isOpen ? '✅ ON' : '❌ OFF'}
          </button>
        ) : (
          <span
            className={`text-xs ml-2 ${
              isOpen
                ? 'text-green-700 font-bold dark:text-green-300'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            {isOpen ? '✅ ON' : '❌ OFF'}
          </span>
        )}
      </div>

      {/* 기타 정보 */}
      <p className="text-sm">
        <strong>트랙:</strong> {multi.game_track}
      </p>
      <p className="text-sm">
        <strong>레이스:</strong> {multi.multi_race}
      </p>
      <p className="text-sm">
        <strong>클래스:</strong> {multi.multi_class}
      </p>
    </div>
  )
}
