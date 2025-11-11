import { NextRequest, NextResponse } from 'next/server'
import { TtlCache } from '@/lib/ttlCache'

type Snapshot = {
  metric: 'irating'
  snapshotAt: string
  global: Array<{ bin: number; count: number }>
  byCountry?: Record<string, Array<{ bin: number; count: number }>>
}

const latest = new TtlCache<Snapshot>(24 * 60 * 60_000)

export async function POST(req: NextRequest) {
  // Admin placeholder: save last snapshot in-memory
  try {
    const body = (await req.json()) as Snapshot
    if (body.metric !== 'irating') return NextResponse.json({ error: 'metric' }, { status: 400 })
    latest.set('latest', body, 24 * 60 * 60_000)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 })
  }
}

export async function GET() {
  const snap = latest.get('latest')
  return NextResponse.json(snap || null)
}


