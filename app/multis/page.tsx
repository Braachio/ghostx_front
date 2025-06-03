'use client'

import MultiListPage from '@/components/MultiListPage'
import Link from 'next/link'

export default function MultisPage() {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">📢 공지 모음</h1>
        <Link href="/">
          <button className="px-4 py-2 bg-gray-500 text-white rounded">홈으로</button>
        </Link>
      </div>
      <MultiListPage />
    </div>
  )
}
