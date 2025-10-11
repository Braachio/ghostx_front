'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EventsPage() {
  const router = useRouter()

  useEffect(() => {
    // /events를 /multis로 리다이렉트
    router.replace('/multis')
  }, [router])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">이벤트 페이지로 이동 중...</p>
        </div>
      </div>
    </div>
  )
}
