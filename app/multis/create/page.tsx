// app/multis/new/page.tsx
import CreateMultiForm from '@/components/CreateMultiForm'

export default function NewMultiPage() {
  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">멀티 공지 등록</h1>
      <CreateMultiForm />
    </main>
  )
}
