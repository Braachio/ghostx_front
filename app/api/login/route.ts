// app/api/login/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export async function POST(req: Request) {
  const { username, password } = await req.json()

  console.log('입력 username:', username)
  console.log('입력 password:', password)

  // 사용자 조회
  const { data: user, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 401 })
  }

  console.log('DB에서 찾은 유저:', user)
  console.log('DB 저장된 해시:', user.password)

  // 비밀번호 비교
  const passwordMatch = await bcrypt.compareSync(password, user.password)
  console.log('비밀번호 비교 결과:', passwordMatch)

  if (!passwordMatch) {
    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 401 })
  }

  // JWT 발급
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  })

  // 쿠키 저장
  const response = NextResponse.json({ success: true })
  response.cookies.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  return response
}
