import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { Database } from 'lib/database.types'

// GET - 빵장 신청 목록 조회 (관리자만)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'event_manager'].includes(profile.role)) {
      return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
    }

    // 쿼리 파라미터
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // 신청서 조회
    let query = supabase
      .from('event_manager_applications')
      .select(`
        *,
        user:profiles!event_manager_applications_user_id_fkey(nickname, email),
        recommender:profiles!event_manager_applications_recommender_id_fkey(nickname),
        reviewer:profiles!event_manager_applications_reviewed_by_fkey(nickname)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: applications, error } = await query

    if (error) {
      console.error('신청서 조회 오류:', error)
      return NextResponse.json({ error: '신청서 조회에 실패했습니다.' }, { status: 500 })
    }

    // 전체 개수 조회
    let countQuery = supabase
      .from('event_manager_applications')
      .select('id', { count: 'exact', head: true })

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count } = await countQuery

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('빵장 신청 목록 조회 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}

// POST - 빵장 신청
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
    }

    const body = await req.json()
    const { gallery_nickname, gallery_gallog_id, gallery_verification_code } = body

    // 필수 필드 확인
    
    if (!gallery_nickname) {
      return NextResponse.json({ error: '심레이싱게임갤러리 닉네임은 필수입니다.' }, { status: 400 })
    }
    
    if (!gallery_gallog_id) {
      return NextResponse.json({ error: '갤로그 식별 코드는 필수입니다.' }, { status: 400 })
    }
    
    if (!gallery_verification_code) {
      return NextResponse.json({ error: '갤러리 인증 코드는 필수입니다.' }, { status: 400 })
    }

    // 이미 신청했는지 확인
    const { data: existingApplication } = await supabase
      .from('event_manager_applications')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved'])
      .single()

    if (existingApplication) {
      if (existingApplication.status === 'pending') {
        return NextResponse.json({ error: '이미 신청한 빵장 신청이 있습니다.' }, { status: 400 })
      }
      if (existingApplication.status === 'approved') {
        return NextResponse.json({ error: '이미 빵장 권한이 있습니다.' }, { status: 400 })
      }
    }


    // 갤로그 인증 코드 검증
    const verificationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/gallog-verification?code=${gallery_verification_code}`, {
      headers: {
        'Cookie': req.headers.get('cookie') || ''
      }
    })

    if (!verificationResponse.ok) {
      const errorData = await verificationResponse.json()
      return NextResponse.json({ 
        error: errorData.error || '갤로그 인증 코드가 올바르지 않습니다.' 
      }, { status: 400 })
    }

    const verificationData = await verificationResponse.json()
    if (!verificationData.verified) {
      return NextResponse.json({ 
        error: '갤로그 인증이 완료되지 않았습니다.' 
      }, { status: 400 })
    }

    // 신청서 생성
    const { data: application, error: insertError } = await supabase
      .from('event_manager_applications')
      .insert({
        user_id: user.id,
        gallery_nickname,
        gallery_gallog_id,
        gallery_verification_code,
        gallery_verified: true
      })
      .select()
      .single()

    if (insertError) {
      console.error('신청서 생성 오류:', insertError)
      return NextResponse.json({ error: '신청서 생성에 실패했습니다.' }, { status: 500 })
    }

    // profiles 테이블에 갤로그 정보 업데이트
    const { error: profileUpdateError } = await supabase
      .from('profiles')
      .update({
        gallery_nickname,
        gallery_gallog_id
      })
      .eq('id', user.id)

    if (profileUpdateError) {
      console.error('프로필 업데이트 오류:', profileUpdateError)
      // 프로필 업데이트 실패해도 신청은 성공으로 처리
    }

    return NextResponse.json({ 
      success: true, 
      message: '빵장 신청이 완료되었습니다. 관리자 검토 후 결과를 알려드리겠습니다.',
      application 
    })

  } catch (error) {
    console.error('빵장 신청 오류:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
