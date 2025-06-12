'use client'

import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import EditNoticeForm, { Notice } from '@/components/EditNoticeForm'

export default function EditGameNoticePage() {
  const { id } = useParams() as { id: string }
  const [notice, setNotice] = useState<Notice | null>(null)

  useEffect(() => {
    const fetchNotice = async () => {
      const res = await fetch(`/api/game-notices/${id}`)
      const data = await res.json()
      setNotice(data)
    }
    fetchNotice()
  }, [id])

  if (!notice) return <p className="text-center mt-10">불러오는 중...</p>

  return (
    <div className="max-w-2xl mx-auto p-6">
      <EditNoticeForm id={id} defaultData={notice} />
    </div>
  )
}
