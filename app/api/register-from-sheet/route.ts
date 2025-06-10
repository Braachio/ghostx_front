// app/api/register-from-sheet/route.ts
import { fetchSheetData } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'
import { createNoticeIfNotExists } from '@/lib/noticeUtils'

export async function GET() {
  const rows = await fetchSheetData()
  for (const row of rows) await createNoticeIfNotExists(row)
  return NextResponse.json({ message: '등록 완료', count: rows.length })
}
