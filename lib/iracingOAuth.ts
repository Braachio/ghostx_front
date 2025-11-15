import { supabaseAdmin } from './supabaseAdmin'
import crypto from 'node:crypto'

const TABLE_NAME = 'iracing_tokens'
const TOKEN_ID = 'data-api'

export type StoredTokenRecord = {
  access_token: string | null
  refresh_token: string | null
  expires_at: string | null
  scope?: string | null
  token_type?: string | null
}

export type OAuthTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}

function computeExpiresAt(expiresIn?: number | null): string | null {
  if (!expiresIn) return null
  return new Date(Date.now() + expiresIn * 1000).toISOString()
}

export async function getStoredTokens(): Promise<StoredTokenRecord | null> {
  const { data, error } = await supabaseAdmin
    .from(TABLE_NAME)
    .select('access_token, refresh_token, expires_at, scope, token_type')
    .eq('id', TOKEN_ID)
    .maybeSingle()

  if (error) {
    console.error('[iRacing OAuth] Failed to load stored tokens:', error.message)
    return null
  }

  return data ?? null
}

export async function saveTokens(tokens: OAuthTokenResponse) {
  const expires_at = computeExpiresAt(tokens.expires_in)
  const payload = {
    id: TOKEN_ID,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at,
    scope: tokens.scope ?? null,
    token_type: tokens.token_type ?? 'Bearer',
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabaseAdmin.from(TABLE_NAME).upsert(payload, { onConflict: 'id' })
  if (error) {
    console.error('[iRacing OAuth] Failed to save tokens:', error.message)
    throw error
  }
}

export function hasValidAccessToken(record: StoredTokenRecord | null): record is StoredTokenRecord & { access_token: string } {
  if (!record || !record.access_token) return false
  if (!record.expires_at) return true
  const expiresMs = new Date(record.expires_at).getTime()
  return expiresMs > Date.now() + 30_000 // 30초 여유
}

export function getRefreshToken(record: StoredTokenRecord | null): string | null {
  return record?.refresh_token ?? null
}

const TOKEN_ENDPOINT = 'https://oauth.iracing.com/oauth2/token'

/**
 * iRacing OAuth의 마스킹 알고리즘
 * client_secret은 client_id로, password는 username으로 마스킹해야 함
 * 참고: https://oauth.iracing.com/oauth2/book/token_endpoint.html#password-limited-grant
 */
function maskSecret(secret: string, id: string): string {
  const normalizedId = id.trim().toLowerCase()
  const combined = `${secret}${normalizedId}`
  const hash = crypto.createHash('sha256').update(combined).digest()
  return hash.toString('base64')
}

function buildTokenRequest(body: Record<string, string>) {
  // URLSearchParams는 자동으로 인코딩하므로, 이미 인코딩된 값이 있으면 디코딩 후 다시 인코딩
  const decodedBody: Record<string, string> = {}
  for (const [key, value] of Object.entries(body)) {
    // 값에 %가 포함되어 있고 디코딩 가능하면 디코딩 (이중 인코딩 방지)
    if (value.includes('%')) {
      try {
        const decoded = decodeURIComponent(value)
        // 디코딩 후 다시 인코딩하면 URLSearchParams가 처리
        decodedBody[key] = decoded
      } catch {
        // 디코딩 실패하면 원본 사용
        decodedBody[key] = value
      }
    } else {
      decodedBody[key] = value
    }
  }
  
  const params = new URLSearchParams(decodedBody)
  return fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
}

function requireClientConfig() {
  // 환경 변수에서 값 읽기 (공백 제거)
  const client_id = process.env.IRACING_CLIENT_ID?.trim()
  const client_secret = process.env.IRACING_CLIENT_SECRET?.trim()
  if (!client_id || !client_secret) {
    throw new Error('IRACING_CLIENT_ID 또는 IRACING_CLIENT_SECRET 환경 변수가 설정되지 않았습니다.')
  }
  return { client_id, client_secret }
}

export async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokenResponse> {
  const { client_id, client_secret } = requireClientConfig()
  const res = await buildTokenRequest({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id,
    client_secret,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[iRacing OAuth] Failed to exchange code: ${res.status} ${text}`)
  }

  return (await res.json()) as OAuthTokenResponse
}

export async function refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
  const { client_id, client_secret } = requireClientConfig()
  const res = await buildTokenRequest({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id,
    client_secret,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`[iRacing OAuth] Failed to refresh token: ${res.status} ${text}`)
  }

  return (await res.json()) as OAuthTokenResponse
}

/**
 * Password Limited Flow를 사용하여 토큰 획득
 * 
 * iRacing의 Password Limited Grant는 Resource Owner Password Credentials Grant 기반입니다.
 * 이 flow는:
 * - 클라이언트가 3명 미만의 사용자만 허용해야 함
 * - 사용자가 사전에 등록되어 있어야 함
 * - 클라이언트 시크릿을 비밀로 유지해야 함
 * 
 * 참고: https://oauth.iracing.com/oauth2/book/error_unsupported_grant_type.html
 * 
 * NOTE: 클라이언트가 Password Limited Flow를 사용하도록 설정되어 있어야 합니다.
 * Nick에게 클라이언트 설정을 요청해야 할 수 있습니다.
 */
export async function getTokenWithPassword(): Promise<OAuthTokenResponse> {
  const { client_id, client_secret } = requireClientConfig()
  
  // 환경 변수에서 값 읽기 (공백 제거)
  const username = process.env.IRACING_USERNAME?.trim()
  const password = process.env.IRACING_PASSWORD?.trim()
  
  if (!username || !password) {
    throw new Error('IRACING_USERNAME 또는 IRACING_PASSWORD 환경 변수가 설정되지 않았습니다.')
  }

  // 환경 변수 값 확인 (디버깅용, 실제 값은 로그하지 않음)
  console.log('[iRacing OAuth] Environment check:', {
    username_set: !!username,
    password_set: !!password,
    username_length: username?.length,
    password_length: password?.length,
    username_has_percent: username?.includes('%'),
    password_has_percent: password?.includes('%'),
  })

  // Password Limited Grant 요청
  // 참고: https://oauth.iracing.com/oauth2/book/token_endpoint.html#password-limited-grant
  // 
  // 중요 사항:
  // 1. grant_type은 'password_limited'를 사용해야 함
  // 2. client_secret은 client_id로 마스킹해야 함
  // 3. password는 username으로 마스킹해야 함
  // 4. scope는 optional이지만 포함 가능
  
  // 마스킹 수행
  const maskedClientSecret = maskSecret(client_secret, client_id)
  const maskedPassword = maskSecret(password, username)
  
  console.log('[iRacing OAuth] Password Limited Grant request (masked):', {
    grant_type: 'password_limited',
    username: username,
    client_id: client_id,
    has_masked_password: !!maskedPassword,
    has_masked_client_secret: !!maskedClientSecret,
  })

  const requestBody = {
    grant_type: 'password_limited',
    client_id,
    client_secret: maskedClientSecret,
    username,
    password: maskedPassword,
    scope: 'iracing.auth',
  }

  const res = await buildTokenRequest(requestBody)
  
  if (!res.ok) {
    const text = await res.text()
    console.error('[iRacing OAuth] Password Limited Grant failed:', {
      status: res.status,
      statusText: res.statusText,
      body: text,
    })
    
    const errorMsg = `[iRacing OAuth] Failed to get token with password: ${res.status} ${text}`
    throw new Error(errorMsg)
  }

  const result = await res.json() as OAuthTokenResponse
  console.log('[iRacing OAuth] Password Limited Grant success')
  return result
}