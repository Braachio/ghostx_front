// app/api/multis/[id]/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServerClient'
import { getMultiById, updateMulti, deleteMulti } from '@/lib/multiService'

async function getUserRole(access_token: string | null) {
  if (!access_token) return null

  const { data, error } = await supabaseServer.auth.getUser(access_token)
  if (error || !data.user) return null

  const { data: profile, error: profileError } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  if (profileError || !profile) return null
  return profile.role
}

// GET: 공지 조회
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id)
    const multi = await getMultiById(id)
    if (!multi) {
      return NextResponse.json({ error: '찾을 수 없습니다' }, { status: 404 })
    }
    return NextResponse.json(multi)
  } catch (error) {
    return NextResponse.json(
      { error: '조회 중 오류 발생', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// PATCH: 공지 수정 (admin 권한 필요)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const access_token = request.headers.get('authorization')?.replace('Bearer ', '') || null
    const role = await getUserRole(access_token)

    if (role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    const body = await request.json()
    const updated = await updateMulti(Number(params.id), body)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: '공지 수정 중 오류 발생', details: (error as Error).message },
      { status: 500 }
    )
  }
}

// DELETE: 공지 삭제 (admin 권한 필요)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const access_token = request.headers.get('authorization')?.replace('Bearer ', '') || null
    const role = await getUserRole(access_token)

    if (role !== 'admin') {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
    }

    await deleteMulti(Number(params.id))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: '삭제 중 오류 발생', details: (error as Error).message },
      { status: 500 }
    )
  }
}
