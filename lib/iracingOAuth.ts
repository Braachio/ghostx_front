import { supabaseAdmin } from './supabaseAdmin'

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

function buildTokenRequest(body: Record<string, string>) {
  const params = new URLSearchParams(body)
  return fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
}

function requireClientConfig() {
  const client_id = process.env.IRACING_CLIENT_ID
  const client_secret = process.env.IRACING_CLIENT_SECRET
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
