import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, saveTokens } from '@/lib/iracingOAuth'

export async function GET(request: NextRequest) {
  const redirectUri = process.env.IRACING_REDIRECT_URI
  if (!redirectUri) {
    return NextResponse.json({ error: 'IRACING_REDIRECT_URI 환경 변수가 설정되지 않았습니다.' }, { status: 500 })
  }

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')
  const returnedState = url.searchParams.get('state')
  const storedState = request.cookies.get('iracing_oauth_state')?.value

  if (error) {
    console.error('[iRacing OAuth] Authorization error:', error)
    return NextResponse.redirect('/?oauth=error')
  }

  if (!code) {
    console.error('[iRacing OAuth] Missing authorization code in callback')
    return NextResponse.redirect('/?oauth=missing_code')
  }

  if (!storedState || returnedState !== storedState) {
    console.error('[iRacing OAuth] State mismatch. Possible CSRF attempt.')
    const res = NextResponse.redirect('/?oauth=state_mismatch')
    res.cookies.delete('iracing_oauth_state')
    return res
  }

  try {
    const tokens = await exchangeCodeForTokens(code, redirectUri)
    await saveTokens(tokens)
    console.log('[iRacing OAuth] Tokens saved successfully')
    const res = NextResponse.redirect('/?oauth=success')
    res.cookies.delete('iracing_oauth_state')
    return res
  } catch (err) {
    console.error('[iRacing OAuth] Token exchange failed:', err)
    const res = NextResponse.redirect('/?oauth=token_error')
    res.cookies.delete('iracing_oauth_state')
    return res
  }
}
