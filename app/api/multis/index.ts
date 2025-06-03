// app/api/multis/index.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabaseClient'
import { checkAdminAuth } from '@/lib/auth'  // 사용자 권한 검사 유틸 가정

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // authorization 헤더가 string | string[] | undefined 타입이라, 안전하게 string | null로 변환
  const authHeader = req.headers.authorization
  const token =
    typeof authHeader === 'string'
      ? authHeader
      : Array.isArray(authHeader)
      ? authHeader[0]
      : null

  const isAdmin = await checkAdminAuth(token)
  if (!isAdmin) {
    return res.status(401).json({ error: '권한이 없습니다.' })
  }

  if (req.method === 'POST') {
    const newMulti = req.body
    const { data, error } = await supabase
      .from('multis')
      .insert([{ ...newMulti, created_at: new Date().toISOString() }])

    if (error || !data) {
      return res.status(500).json({ error: '등록 실패' })
    }

    return res.status(201).json(data[0])  // data가 배열임을 보장하고 null 체크 완료
  }

  res.setHeader('Allow', ['POST'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}
