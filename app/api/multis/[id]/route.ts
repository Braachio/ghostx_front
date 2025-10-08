import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

// GET /api/multis/[id] - 단일 멀티 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params

    console.log(`단일 멀티 조회 요청 - ID: ${id}`)

    const { data, error } = await supabase
      .from('multis')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error(`멀티 조회 실패 - ID: ${id}, Error:`, error.message)
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.log(`멀티 조회 성공 - ID: ${id}, Title: ${data?.title}`)
    return NextResponse.json({ data })
  } catch (e: any) {
    console.error(`멀티 조회 예외:`, e?.message)
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 })
  }
}

// PATCH /api/multis/[id] - 멀티 수정
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params
    const body = await req.json()

    const { error } = await supabase
      .from('multis')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: '이벤트가 수정되었습니다.' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 })
  }
}

// DELETE /api/multis/[id] - 멀티 삭제
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    const { id } = await params

    const { error } = await supabase
      .from('multis')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || '서버 오류' }, { status: 500 })
  }
}

