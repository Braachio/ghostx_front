import { getStoredTokens, hasValidAccessToken, saveTokens, getRefreshToken, refreshAccessToken } from './iracingOAuth'

// Minimal iRacing Data API client (server-side)
// Docs (summary): Obtain auth token, then fetch JSON endpoints

type TokenInfo = { token: string; expiresAt: number }

// Mock 모드 확인: IRACING_MOCK이 명시적으로 'true'로 설정되어 있거나, OAuth 클라이언트 정보가 없으면 Mock 모드
export const IRACING_MOCK = (() => {
  const mockEnv = (process.env.IRACING_MOCK || '').trim().toLowerCase()
  const clientId = process.env.IRACING_CLIENT_ID
  const clientSecret = process.env.IRACING_CLIENT_SECRET

  console.log('[iRacing API] Environment check:')
  console.log('[iRacing API]   IRACING_MOCK:', mockEnv || '(not set)')
  console.log('[iRacing API]   IRACING_CLIENT_ID configured:', !!clientId)
  console.log('[iRacing API]   IRACING_CLIENT_SECRET configured:', !!clientSecret)

  if (mockEnv === 'true') {
    console.log('[iRacing API] → Mock mode: IRACING_MOCK=true')
    return true
  }

  if (!clientId || !clientSecret) {
    console.warn('[iRacing API] → Mock mode: OAuth client credentials not set (IRACING_CLIENT_ID/SECRET)')
    return true
  }

  console.log('[iRacing API] → Real API mode: OAuth credentials configured')
  return false
})()

let tokenInfo: TokenInfo | null = null

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`iRacing API error ${res.status}: ${await res.text()}`)
  }
  return res.json() as Promise<T>
}

async function refreshWithStoredToken(): Promise<TokenInfo> {
  const stored = await getStoredTokens()

  if (hasValidAccessToken(stored)) {
    const expiresAt = stored.expires_at ? new Date(stored.expires_at).getTime() : Date.now() + 5 * 60 * 1000
    return { token: stored.access_token!, expiresAt }
  }

  const refreshToken = getRefreshToken(stored)
  if (!refreshToken) {
    throw new Error('iRacing access token이 만료되었고 refresh token이 없습니다. /api/iracing/oauth/login 으로 다시 인증을 진행하세요.')
  }

  console.log('[iRacing OAuth] Refreshing access token using stored refresh token')
  const refreshed = await refreshAccessToken(refreshToken)
  await saveTokens(refreshed)

  if (!refreshed.access_token) {
    throw new Error('Refresh response에 access_token이 포함되어 있지 않습니다.')
  }

  const expiresAt = refreshed.expires_in
    ? Date.now() + refreshed.expires_in * 1000
    : Date.now() + 5 * 60 * 1000

  return { token: refreshed.access_token, expiresAt }
}

export async function getIracingToken(): Promise<string> {
  if (IRACING_MOCK) {
    console.warn('[iRacing API] Mock mode enabled - using mock token')
    return 'mock-token'
  }

  const now = Date.now()
  if (tokenInfo && tokenInfo.expiresAt > now + 30_000) {
    console.log('[iRacing API] Using cached token (expires in', Math.floor((tokenInfo.expiresAt - now) / 1000), 'seconds)')
    return tokenInfo.token
  }

  console.log('[iRacing API] Loading token from storage or refreshing via OAuth')
  const stored = await getStoredTokens()

  if (hasValidAccessToken(stored) && stored?.expires_at) {
    const expiresMs = new Date(stored.expires_at).getTime()
    tokenInfo = { token: stored.access_token!, expiresAt: expiresMs }
    return tokenInfo.token
  }

  const refreshed = await refreshWithStoredToken()
  tokenInfo = refreshed
  return refreshed.token
}

export async function irGet<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  if (IRACING_MOCK) {
    throw new Error('IRACING_MOCK is enabled. Set IRACING_CLIENT_ID and IRACING_CLIENT_SECRET environment variables and remove IRACING_MOCK to use real iRacing API.')
  }

  const token = await getIracingToken()

  // 쿼리 파라미터 생성 (빈 값 제외)
  let qs = ''
  if (query && Object.keys(query).length > 0) {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        params.append(k, String(v))
      }
    })
    qs = params.toString()
    if (qs) {
      qs = '?' + qs
    }
  }

  const url = `https://members-ng.iracing.com${path}${qs}`

  console.log(`[iRacing API] GET ${path}${qs}`)
  console.log(`[iRacing API] Full URL: ${url}`)
  console.log(`[iRacing API] Authorization header: Bearer ${token.substring(0, 20)}...`)

  try {
    const result = await fetchJson<T>(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    console.log(`[iRacing API] Request successful for ${path}`)
    return result
  } catch (error) {
    console.error(`[iRacing API] Request failed for ${path}:`, error)
    throw error
  }
}


