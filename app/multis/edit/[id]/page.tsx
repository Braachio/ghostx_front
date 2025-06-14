// app/multis/edit/[id]/page.tsx
import EditMultiForm from '@/components/EditMultiForm'

interface PageProps {
  params: { id: string }
}

export default function Page({ params }: PageProps) {
  return <EditMultiForm id={params.id} />
}
