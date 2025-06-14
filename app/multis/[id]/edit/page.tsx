import EditMultiForm from '@/components/EditMultiForm'

interface PageProps {
  params: {
    id: string
  }
}

export default function EditMultiPage({ params }: PageProps) {
  return <EditMultiForm id={params.id} />
}
