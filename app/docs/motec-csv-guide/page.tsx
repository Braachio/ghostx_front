// app/docs/motec-csv-guide/page.tsx
import fs from 'fs'
import path from 'path'
import { remark } from 'remark'
import html from 'remark-html'

export const dynamic = 'force-dynamic' // Next.js 14+ app router용

export default async function MotecCsvGuidePage() {
  // 파일 경로
  const filePath = path.join(process.cwd(), 'public', 'docs', 'motec_csv_guide.md')

  // 파일 읽기
  const fileContent = fs.readFileSync(filePath, 'utf8')

  // Markdown → HTML 변환
  const processed = await remark().use(html).process(fileContent)
  const contentHtml = processed.toString()

  return (
    <div className="prose dark:prose-invert max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">MoTeC CSV 변환 가이드</h1>
      <div dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </div>
  )
}
