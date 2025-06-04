'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'
import Link from 'next/link'

type Multi = Database['public']['Tables']['multis']['Row']

export default function MultiCard({
  multi,
  currentUserId,
  onDeleted,
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

  const handleDelete = async () => {
    if (!isAuthor) return
    if (!confirm('정말 삭제하시겠습니까?')) return

    const { error } = await supabase.from('multis').delete().eq('id', multi.id)
    if (error) {
      alert('삭제 실패')
    } else {
      alert('삭제 완료')
      onDeleted?.()
    }
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
            {isOpen ? '✅ 서버 ON (클릭 시 비공개)' : '❌ 서버 OFF (클릭 시 공개)'}
          </button>
        ) : (
          <span className="text-sm text-gray-500">
            {isOpen ? '✅ 서버 ON' : '❌ 서버 OFF'}
          </span>
        )}

        {isAuthor && (
          <>
            <Link href={`/multis/${multi.id}/edit`}>
              <button className="bg-yellow-500 text-white px-3 py-1 rounded text-sm">수정</button>
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 text-white px-3 py-1 rounded text-sm"
            >
              삭제
            </button>
          </>
        )}
      </div>
      <p>🧭 <strong>멀티명:</strong> {multi.multi_name}</p>
      <p>📅 <strong>요일:</strong> {multi.multi_day?.join(', ')}</p>
      <p>🕒 <strong>시간:</strong> {multi.multi_time}</p>
      <p className="my-2 whitespace-pre-line text-gray-700">{multi.description}</p>
    </div>
  )
}
