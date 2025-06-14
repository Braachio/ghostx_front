import EditMultiForm from '@/components/EditMultiForm'

interface PageProps {
  params: { id: string }
}

export default function EditMultiPage({ params }: PageProps) {
  const { id } = params
  return <EditMultiForm id={id} />
}