import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // m.ghostx.site 또는 m.* 서브도메인으로 접근하는 경우
  if (hostname.startsWith('m.')) {
    // 루트 경로(/)인 경우 모바일 페이지로 리다이렉트
    if (url.pathname === '/') {
      url.pathname = '/mobile'
      return NextResponse.redirect(url)
    }
    // 다른 경로들은 그대로 유지 (예: /mobile/settings 등)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 다음 경로들 제외:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

