import { getStoredTokens, hasValidAccessToken, saveTokens, getRefreshToken, refreshAccessToken, getTokenWithPassword } from './iracingOAuth'

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
  if (refreshToken) {
    // Refresh token이 있으면 refresh 사용
    console.log('[iRacing OAuth] Refreshing access token using stored refresh token')
    try {
      const refreshed = await refreshAccessToken(refreshToken)
      await saveTokens(refreshed)

      if (!refreshed.access_token) {
        throw new Error('Refresh response에 access_token이 포함되어 있지 않습니다.')
      }

      const expiresAt = refreshed.expires_in
        ? Date.now() + refreshed.expires_in * 1000
        : Date.now() + 5 * 60 * 1000

      return { token: refreshed.access_token, expiresAt }
    } catch (error) {
      console.warn('[iRacing OAuth] Refresh token failed, falling back to password flow:', error)
      // Refresh 실패 시 Password Limited Flow로 폴백
    }
  }

  // Refresh token이 없거나 refresh 실패 시 Password Limited Flow 사용
  console.log('[iRacing OAuth] No refresh token available, attempting Password Limited flow')
  try {
    const tokens = await getTokenWithPassword()
    await saveTokens(tokens)

    if (!tokens.access_token) {
      throw new Error('Password flow response에 access_token이 포함되어 있지 않습니다.')
    }

    const expiresAt = tokens.expires_in
      ? Date.now() + tokens.expires_in * 1000
      : Date.now() + 5 * 60 * 1000

    return { token: tokens.access_token, expiresAt }
  } catch (error) {
    // Password Limited Flow 실패 시 (예: 클라이언트가 설정되지 않음)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[iRacing OAuth] Password Limited flow failed:', errorMessage)
    
    // unsupported_grant_type 에러인 경우 클라이언트 설정이 필요함
    if (errorMessage.includes('unsupported_grant_type')) {
      throw new Error(
        'Password Limited Flow가 클라이언트에서 활성화되지 않았습니다. ' +
        'Nick에게 클라이언트 설정을 요청하세요. ' +
        '현재는 /api/iracing/oauth/login 으로 Authorization Code Flow를 사용할 수 있습니다.'
      )
    }
    
    throw error
  }
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
    // iRacing API는 링크를 반환할 수 있으므로 먼저 응답 확인
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`iRacing API error ${response.status}: ${text}`)
    }

    const initialData = await response.json()
    
    // 응답이 링크를 포함하는 경우 (iRacing API의 일반적인 패턴)
    if (initialData && typeof initialData === 'object' && 'link' in initialData && typeof initialData.link === 'string') {
      console.log(`[iRacing API] Received link, fetching actual data from: ${initialData.link.substring(0, 100)}...`)
      
      // 링크에서 실제 데이터 가져오기
      const dataResponse = await fetch(initialData.link)
      if (!dataResponse.ok) {
        throw new Error(`Failed to fetch data from link: ${dataResponse.status}`)
      }
      
      const actualData = await dataResponse.json()
      console.log(`[iRacing API] Request successful for ${path} (via link)`)
      return actualData as T
    }
    
    // 직접 데이터를 반환하는 경우
    console.log(`[iRacing API] Request successful for ${path}`)
    return initialData as T
  } catch (error) {
    console.error(`[iRacing API] Request failed for ${path}:`, error)
    throw error
  }
}


