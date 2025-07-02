// app/api/sector-results/[track]/[sector]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  // Extract dynamic params from the URL
  const pathSegments = req.nextUrl.pathname.split('/')
  const track = decodeURIComponent(pathSegments[pathSegments.length - 2])
  const sectorStr = pathSegments[pathSegments.length - 1]
  const sector = parseInt(sectorStr)

  if (isNaN(sector)) {
    return NextResponse.json({ error: 'Invalid sector number' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('sector_results')
    .select('*')
    .eq('track', track)
    .eq('sector', sector)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
