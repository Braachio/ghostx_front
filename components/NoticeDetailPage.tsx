'use client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

export default function NoticeDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const handleDelete = async () => {
    const ok = confirm('정말 삭제하시겠습니까?')
    if (!ok) return
    await fetch(`/api/game-notices/${id}`, { method: 'DELETE' })
    router.push('/multis')
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Link href={`/game-notices/${id}/edit`}>
        <button className="px-4 py-2 bg-yellow-500 text-white rounded">수정</button>
    </Link>

      <div className="mt-6">
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          삭제
        </button>
      </div>
    </div>
  )
}
