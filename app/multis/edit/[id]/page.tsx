import EditMultiForm from '@/components/EditMultiForm'

export default function EditMultiPage({
  params,
}: {
  params: { id: string }
}) {
  return <EditMultiForm id={params.id} />
}
