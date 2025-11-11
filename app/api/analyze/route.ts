// app/api/your-endpoint/route.ts
import { API_URL } from '@/lib/constants'
import { DRIVING_ANALYSIS_ENABLED, DRIVING_ANALYSIS_DISABLED_MESSAGE } from '@/lib/featureFlags'

export async function POST(req: Request) {
  if (!DRIVING_ANALYSIS_ENABLED) {
    return new Response(JSON.stringify({ error: DRIVING_ANALYSIS_DISABLED_MESSAGE }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { file_url } = await req.json()

    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file_url }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return new Response(JSON.stringify({ error: errorText }), { status: 500 })
    }

    const result = await response.json()
    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
    })
  }
}
