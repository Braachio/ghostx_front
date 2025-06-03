import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function GET() {
  const plain = 'qwer'
  const hash = '$2a$10$Y7nUuPi04onqp6vWJkq1PevZrJHPlX.yKeRE06aEGXLyZaxIxjhFa'

  const match = await bcrypt.compare(plain, hash)

  return NextResponse.json({ plain, hash, match })
}
