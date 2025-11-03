// Minimal iRacing Data API client (server-side)
// Docs (summary): Obtain auth token, then fetch JSON endpoints

type TokenInfo = { token: string; expiresAt: number }

let tokenInfo: TokenInfo | null = null

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`iRacing API error ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

export async function getIracingToken(): Promise<string> {
  const email = process.env.IRACING_EMAIL
  const password = process.env.IRACING_PASSWORD
  if (!email || !password) throw new Error('IRACING_EMAIL/IRACING_PASSWORD env not set')

  const now = Date.now()
  if (tokenInfo && tokenInfo.expiresAt > now + 30_000) return tokenInfo.token

  // iRacing members-ng auth
  // POST https://members-ng.iracing.com/auth with JSON { email, password }
  const res = await fetch('https://members-ng.iracing.com/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) throw new Error(`Auth failed ${res.status}`)
  const data = await res.json() as { token: string; expires: number }
  tokenInfo = { token: data.token, expiresAt: now + Math.max(5 * 60_000, (data.expires ?? 5 * 60_000)) }
  return tokenInfo.token
}

export async function irGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const token = await getIracingToken()
  const qs = query ? '?' + new URLSearchParams(Object.entries(query).filter(([_,v]) => v !== undefined).map(([k,v]) => [k, String(v)])).toString() : ''
  const url = `https://members-ng.iracing.com${path}${qs}`
  return fetchJson<T>(url, { headers: { Authorization: `Bearer ${token}` } })
}


