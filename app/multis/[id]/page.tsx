// ✅ app/multis/[id]/page.tsx
'use client'

import { useParams } from 'next/navigation'
import MultiDetailPage from '@/components/MultiDetailPage'

export default function MultiDetailRoutePage() {
  const params = useParams()
  const id = params?.id as string

  if (!id) {
    return <div className="flex items-center justify-center min-h-screen text-white">ID를 찾을 수 없습니다.</div>
  }

  return <MultiDetailPage />
}
