import { NextResponse } from 'next/server'

export async function GET() {
  console.log('=== /api/test GET 요청 ===')
  return NextResponse.json({ 
    message: 'API 테스트 성공', 
    timestamp: new Date().toISOString(),
    data: ['test1', 'test2', 'test3']
  })
}