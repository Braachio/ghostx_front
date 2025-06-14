import EditMultiForm from '@/components/EditMultiForm'

<<<<<<< HEAD
export default function EditMultiRoutePage({ params }: { params: { id: string } }) {
  return <EditMultiForm id={params.id} />
}
=======
interface PageProps {
  params: { id: string }
}

export default function EditMultiPage({ params }: PageProps) {
  const { id } = params
  return <EditMultiForm id={id} />
}
>>>>>>> 58233e0 (Add root layout for Next.js app directory)
