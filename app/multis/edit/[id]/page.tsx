// app/multis/edit/[id]/page.tsx
import EditMultiForm from '@/components/EditMultiForm'

type Props = {
  params: {
    id: string
  }
}

export default function Page(props: Props) {
  const { id } = props.params
  return <EditMultiForm id={id} />
}
