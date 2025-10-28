import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl.clone()

  // m.ghostx.site 또는 m.* 서브도메인으로 접근하는 경우
  if (hostname.startsWith('m.')) {
    // 이미 /mobile 경로에 있으면 리다이렉트하지 않음
    if (!url.pathname.startsWith('/mobile')) {
      url.pathname = `/mobile${url.pathname}`
      return NextResponse.redirect(url)
    }
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

