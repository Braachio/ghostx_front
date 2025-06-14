import EditMultiForm from '@/components/EditMultiForm'

interface Props {
  params: { id: string }
}

export default function Page({ params }: Props) {
  return <EditMultiForm id={params.id} />
}
