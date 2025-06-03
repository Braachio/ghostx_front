import { NextResponse } from 'next/server'
import { getMultiById, updateMulti, deleteMulti } from '@/lib/multiService'

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const data = await getMultiById(Number(id))
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json(
      { error: '공지 조회 중 오류 발생', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await req.json()
    const updated = await updateMulti(Number(id), body)
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: '공지 수정 중 오류 발생', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    await deleteMulti(Number(id))
    return new Response(null, { status: 204 })
  } catch (error) {
    return NextResponse.json(
      { error: '공지 삭제 중 오류 발생', details: (error as Error).message },
      { status: 500 }
    )
  }
}
