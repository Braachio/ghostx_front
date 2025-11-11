import { NextResponse } from 'next/server'

export async function GET() {
  if (!process.env.IRACING_CLIENT_ID || !process.env.IRACING_REDIRECT_URI) {
    return NextResponse.json({
      error: 'IRACING_CLIENT_ID 또는 IRACING_REDIRECT_URI 환경 변수가 설정되지 않았습니다.',
    }, { status: 500 })
  }

  const state = crypto.randomUUID()

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.IRACING_CLIENT_ID,
    redirect_uri: process.env.IRACING_REDIRECT_URI,
    scope: 'iracing.auth',
    audience: 'data-server',
    state,
  })

  const redirectUrl = `https://oauth.iracing.com/oauth2/authorize?${params.toString()}`
  const response = NextResponse.redirect(redirectUrl)
  response.cookies.set('iracing_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 300,
    path: '/',
  })

  return response
}
