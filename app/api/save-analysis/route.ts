import { createClient } from '@supabase/supabase-js'
import { DRIVING_ANALYSIS_ENABLED, DRIVING_ANALYSIS_DISABLED_MESSAGE } from '@/lib/featureFlags'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  if (!DRIVING_ANALYSIS_ENABLED) {
    return new Response(JSON.stringify({ error: DRIVING_ANALYSIS_DISABLED_MESSAGE }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const data = await req.json()

  const { error } = await supabase.from('analysis_results').insert([
    {
      file_url: data.file_url,
      num_laps: data.num_laps,
      avg_lap_time: data.avg_lap_time,
      best_lap_time: data.best_lap_time,
      sector1_avg: data.sector_avg.sector1,
      sector2_avg: data.sector_avg.sector2,
      sector3_avg: data.sector_avg.sector3,
      avg_throttle: data.avg_throttle,
      avg_brake: data.avg_brake,
      avg_speed: data.avg_speed,
      created_at: new Date().toISOString(),
    },
  ])

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ message: '저장 성공' }))
}
