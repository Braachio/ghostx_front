// app/multis/create/page.tsx
import CreateMultiForm from '@/components/CreateMultiForm'

export default function CreateMultiPage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">멀티 공지 등록</h1>
      <CreateMultiForm />
    </main>
  )
}
