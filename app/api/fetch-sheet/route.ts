// app/api/fetch-sheet/route.ts
import { NextResponse } from 'next/server'
import { fetchSheetData } from '@/lib/fetchSheetData'

export async function GET() {
  try {
    const data = await fetchSheetData()
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('❌ 시트 데이터 불러오기 실패:', error)
    return NextResponse.json({ success: false, error: '데이터 불러오기 실패' }, { status: 500 })
  }
}
