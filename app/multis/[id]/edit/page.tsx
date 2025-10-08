// /app/multis/[id]/edit/page.tsx
'use client'

import { useParams } from 'next/navigation'
import EditMultiForm from '@/components/forms/EditMultiForm'

export default function EditMultiPage() {
  const params = useParams()
  const id = params?.id as string

  if (!id) {
    return <div className="flex items-center justify-center min-h-screen text-white">ID를 찾을 수 없습니다.</div>
  }

  return <EditMultiForm id={id} />
}
