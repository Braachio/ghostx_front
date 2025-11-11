import { NextResponse } from 'next/server'

/**
 * iRacing API 디버깅 엔드포인트
 * 환경 변수와 인증 상태를 확인할 수 있습니다.
 */
export async function GET() {
  try {
    let email = (process.env.IRACING_EMAIL || '').trim()
    let password = (process.env.IRACING_PASSWORD || '').trim()
    
    // 따옴표 제거
    if (email.startsWith('"') && email.endsWith('"')) email = email.slice(1, -1)
    if (email.startsWith("'") && email.endsWith("'")) email = email.slice(1, -1)
    if (password.startsWith('"') && password.endsWith('"')) password = password.slice(1, -1)
    if (password.startsWith("'") && password.endsWith("'")) password = password.slice(1, -1)
    
    const envCheck = {
      IRACING_MOCK: process.env.IRACING_MOCK || '(not set)',
      IRACING_EMAIL: {
        set: !!email,
        length: email.length,
        preview: email ? `${email.substring(0, 3)}***@${email.includes('@') ? email.split('@')[1] : '***'}` : 'NOT SET',
        hasAt: email.includes('@'),
        rawLength: (process.env.IRACING_EMAIL || '').length,
      },
      IRACING_PASSWORD: {
        set: !!password,
        length: password.length,
        rawLength: (process.env.IRACING_PASSWORD || '').length,
        hasQuotes: (process.env.IRACING_PASSWORD || '').startsWith('"') || (process.env.IRACING_PASSWORD || '').startsWith("'"),
      },
    }
    
    // 실제 인증 테스트
    let authTest: {
      success: boolean
      error?: string
      response?: any
      diagnostic?: any
    } | null = null
    
    if (email && password) {
      try {
        const authUrl = 'https://members-ng.iracing.com/auth'
        
        // 요청 본문 준비
        const requestBody = { email, password }
        
        // 디버깅: 요청 정보 (비밀번호는 마스킹)
        const diagnostic = {
          url: authUrl,
          emailLength: email.length,
          passwordLength: password.length,
          emailDomain: email.includes('@') ? email.split('@')[1] : 'N/A',
          passwordFirstChar: password ? password[0] : 'N/A',
          passwordLastChar: password ? password[password.length - 1] : 'N/A',
          passwordHasSpecialChars: /[!@#$%^&*(),.?":{}|<>]/.test(password),
          requestBodyKeys: Object.keys(requestBody),
        }
        
        const res = await fetch(authUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'GPX/1.0',
          },
          body: JSON.stringify(requestBody),
        })
        
        const data = await res.json()
        
        authTest = {
          success: res.ok && data.authcode !== 0 && !data.message?.toLowerCase().includes('failure'),
          response: {
            status: res.status,
            authcode: data.authcode,
            message: data.message,
            verificationRequired: data.verificationRequired,
            inactive: data.inactive,
            hasToken: !!(data.token || (data.authcode && data.authcode !== 0)),
            allResponseKeys: Object.keys(data),
          },
          diagnostic,
        }
        
        if (!authTest.success) {
          authTest.error = data.message || `authcode: ${data.authcode}`
          
          // 추가 진단 정보
          if (data.authcode === 0) {
            authTest.diagnostic = {
              ...authTest.diagnostic,
              possibleCauses: [
                '레거시 인증이 활성화되지 않음 - https://oauth.iracing.com/accountmanagement/ 확인',
                '비밀번호가 잘못됨 - https://members.iracing.com 에서 직접 로그인 테스트',
                '계정이 비활성화됨 - inactive: ' + data.inactive,
                '구독이 만료됨 - 계정 상태 확인 필요',
                '2FA 활성화 후 레거시 인증 미활성화',
              ],
            }
          }
        }
      } catch (error) {
        authTest = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    }
    
    return NextResponse.json({
      environment: envCheck,
      authTest,
      recommendations: [
        !email && '❌ IRACING_EMAIL 환경 변수를 설정하세요.',
        !password && '❌ IRACING_PASSWORD 환경 변수를 설정하세요.',
        email && !email.includes('@') && '❌ 이메일 형식이 올바르지 않습니다.',
        password && password.length < 8 && '⚠️ 비밀번호가 너무 짧습니다.',
        authTest && !authTest.success && [
          '❌ 인증 실패: 다음 사항을 확인하세요:',
          '   1. 레거시 인증 활성화: https://oauth.iracing.com/accountmanagement/ → Security → Enable Legacy Authentication',
          '   2. 레거시 인증 활성화 후 서버 재시작 (Ctrl+C 후 npm run dev)',
          '   3. iRacing 웹사이트(https://members.iracing.com)에서 직접 로그인 테스트',
          '   4. 비밀번호가 정확한지 확인 (특수문자, 대소문자)',
          '   5. 계정이 활성화되어 있고 구독이 만료되지 않았는지 확인',
          '   6. 레거시 인증 활성화 후 몇 분 기다린 후 재시도',
        ],
        authTest && authTest.success && '✅ 인증 성공!',
      ].filter(Boolean).flat(),
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

