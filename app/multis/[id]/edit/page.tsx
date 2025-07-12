// /app/multis/[id]/edit/page.tsx
'use client'

import { useParams } from 'next/navigation'
import EditMultiForm from '@/components/forms/EditMultiForm'

export default function EditMultiPage() {
  const params = useParams()
  const id = params?.id as string

  return <EditMultiForm id={id} />
}
