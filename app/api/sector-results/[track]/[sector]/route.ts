// app/api/sector-results/[track]/[sector]/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(
  req: Request,
  { params }: { params: { track: string; sector: string } }
) {
  const supabase = createRouteHandlerClient({ cookies })
  const { track, sector } = params

  const { data, error } = await supabase
    .from('sector_results')
    .select('*')
    .eq('track', track)
    .eq('sector', parseInt(sector)) // sector는 number로 저장되었으므로

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
