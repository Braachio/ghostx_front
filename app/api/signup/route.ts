import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { username, password } = await req.json()

  const hashedPassword = await bcrypt.hash(password, 10)

  const { error } = await supabaseAdmin
    .from('profiles')
    .insert({ username, password: hashedPassword })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
