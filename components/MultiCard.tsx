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
  onDeleted?: () => void
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
      .update({ is_open: !isOpen })
      .eq('id', multi.id)

    if (!error) setIsOpen(!isOpen)
    else alert(`상태 변경 실패: ${error.message}`)

    setIsLoading(false)
  }

  return (
    <div className="border p-4 rounded shadow mb-3 bg-white">
      <Link href={`/multis/${multi.id}`}>
        <h2 className="text-lg font-semibold hover:underline">{multi.title}</h2>
      </Link>
      <p className="text-sm text-gray-600 mb-1">{new Date(multi.created_at).toLocaleString()}</p>
      <div className="flex items-center gap-4">
        {isAuthor ? (
          <button
            onClick={toggleOpen}
            disabled={isLoading}
            className={`px-3 py-1 rounded text-sm ${
              isOpen ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isOpen ? '✅ 서버 ON (클릭 시 OFF)' : '❌ 서버 OFF (클릭 시 ON)'}
          </button>
        ) : (
          <span className="text-sm text-gray-500">
            {isOpen ? '✅ 서버 ON' : '❌ 서버 OFF'}
          </span>
        )}
      </div>
      <p>🧭 <strong>클래스:</strong> {multi.multi_name}</p>
      <p>📅 <strong>요일:</strong> {multi.multi_day?.join(', ')}</p>
      <p>🕒 <strong>시간:</strong> {multi.multi_time}</p>
      <p className="my-2 whitespace-pre-line text-gray-700">{multi.description}</p>
    </div>
  )
}
