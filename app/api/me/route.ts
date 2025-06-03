// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function GET(req: NextRequest) {
  // 1. 쿠키에서 토큰 꺼내기
  const token = req.cookies.get('token')?.value

  if (!token) {
    return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
  }

  try {
    // 2. 토큰 디코딩 (검증)
    const decoded = jwt.verify(token, JWT_SECRET)
    return NextResponse.json({ user: decoded }, { status: 200 })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
