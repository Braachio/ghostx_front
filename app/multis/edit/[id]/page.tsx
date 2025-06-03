import EditMultiForm from '@/components/EditMultiForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EditMultiPage({ params }: PageProps) {
  const { id } = await params
  return <EditMultiForm id={id} />
}
