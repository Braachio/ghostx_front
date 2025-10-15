import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { Database } from '@/lib/database.types'
import { supabaseAdmin } from '@/lib/supabaseAdminClient'

export async function POST(req: Request) {
  try {
    // 개발 환경에서만 허용
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: '개발 환경에서만 사용 가능합니다.' },
        { status: 403 }
      )
    }

    const { adminPassword } = await req.json()

    // 간단한 관리자 비밀번호 확인 (개발용)
    const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123'
    
    if (adminPassword !== expectedPassword) {
      return NextResponse.json(
        { error: '관리자 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      )
    }

    // 기존 관리자 중 하나를 사용 (하드코딩된 관리자 ID 사용)
    // 데이터베이스에서 확인된 관리자 ID들 중 하나 사용
    const knownAdminIds = [
      'ea8c7783-ac7d-4c4e-95ca-676bc06c1b73', // vlees
      '5dc2613e-e577-4b75-a97e-ed34221a4c46', // 르끌레르해물탕
      '10c4d5a7-c8c7-49e7-815b-4521f09803b4'  // 엔두장
    ]

    // 첫 번째 관리자 ID 사용
    const adminUid = knownAdminIds[0]
    
    // 관리자 프로필 정보 (하드코딩)
    const profile = {
      id: adminUid,
      email: 'admin@ghostx.com',
      nickname: '관리자',
      role: 'admin',
      agreed_terms: true,
      agreed_privacy: true,
      has_uploaded_data: false
    }

    // 임시 세션 생성 (개발용)
    const mockSession = {
      user: {
        id: adminUid,
        email: profile.email || 'admin@ghostx.com',
        user_metadata: {
          nickname: profile.nickname || '관리자',
          role: 'admin'
        }
      },
      access_token: 'mock_admin_token',
      refresh_token: 'mock_refresh_token'
    }

    // 쿠키에 세션 정보 저장 (개발용)
    const response = NextResponse.json({
      success: true,
      user: mockSession.user,
      message: '관리자로 로그인되었습니다.',
      adminUid: adminUid
    })

    // 개발용 쿠키 설정
    response.cookies.set('sb-access-token', mockSession.access_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7일
    })

    response.cookies.set('sb-refresh-token', mockSession.refresh_token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30일
    })

    return response

  } catch (error) {
    console.error('관리자 로그인 오류:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
