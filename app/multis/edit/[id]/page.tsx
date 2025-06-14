import EditMultiForm from '@/components/EditMultiForm'

// Next.js는 기본적으로 아래와 같은 형태로 expects 합니다.
export default function Page({ params }: { params: { id: string } }) {
  return <EditMultiForm id={params.id} />
}
