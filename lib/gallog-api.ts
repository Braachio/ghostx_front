/**
 * 갤로그(DCinside 갤로그) 웹 스크래핑 모듈
 * Puppeteer를 사용하여 실제 브라우저처럼 동작
 */

interface GallogApiConfig {
  baseUrl: string
  sessionCookie?: string
  userAgent: string
}

// interface VisitMessage {
//   gallogId: string  // 갤로그 식별 코드 (예: comic1164)
//   message: string
//   password?: string
//   isSecret?: boolean
// }

export class GallogApi {
  private config: GallogApiConfig

  constructor(config?: Partial<GallogApiConfig>) {
    this.config = {
      baseUrl: 'https://gall.dcinside.com',
      userAgent: process.env.VERCEL 
        ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      sessionCookie: process.env.DCINSIDE_SESSION_COOKIE,
      ...config
    }
    
    // Vercel 환경 변수 디버깅 로그
    console.log('Vercel 갤로그 API 환경 변수 확인:', {
      hasSessionCookie: !!this.config.sessionCookie,
      cookieLength: this.config.sessionCookie?.length || 0,
      cookiePreview: this.config.sessionCookie?.substring(0, 50) + '...' || 'undefined',
      environment: process.env.VERCEL ? 'Vercel' : 'Local',
      cookieContainsPHPSESSID: this.config.sessionCookie?.includes('PHPSESSID') || false,
      cookieContainsPHPSESSKEY: this.config.sessionCookie?.includes('PHPSESSKEY') || false,
      rawEnvVar: process.env.DCINSIDE_SESSION_COOKIE ? 'EXISTS' : 'MISSING',
      envVarLength: process.env.DCINSIDE_SESSION_COOKIE?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV
    })
  }

  /**
   * 갤로그 방명록에 메시지 전송 (자동 방식)
   * 개선된 웹 스크래핑 방식 사용
   * @param gallogId 갤로그 식별 코드 (예: comic1164)
   * @param message 전송할 메시지
   * @param options 추가 옵션
   */
  async sendVisitMessage(gallogId: string, message: string, options: {
    password?: string
    isSecret?: boolean
  } = {}): Promise<{ success: boolean; error?: string; method?: string }> {
    
    console.log('갤로그 방명록 전송 (자동 방식):', {
      gallogId,
      message: message.substring(0, 50) + '...',
      isSecret: options.isSecret
    })

    // 개선된 웹 스크래핑 방식 시도
    console.log('자동 웹 스크래핑 방식 시도')
    const scrapingResult = await this.tryWebScrapingMethod(gallogId, message, options)
    
    if (scrapingResult.success) {
      console.log('✅ 자동 웹 스크래핑 방식 성공')
      return { ...scrapingResult, method: 'Auto' }
    }
    
    console.log('❌ 자동 웹 스크래핑 방식 실패:', scrapingResult.error)
    
    return { 
      success: false, 
      error: `자동 전송 실패: ${scrapingResult.error}`,
      method: 'Failed'
    }
  }

  /**
   * API 방식으로 갤로그 방명록 전송 시도
   */
  private async tryApiMethod(gallogId: string, message: string, options: {
    password?: string
    isSecret?: boolean
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // 갤로그 방명록 작성 API 엔드포인트 (갤로그 전용 API)
      const url = `https://gallog.dcinside.com/${gallogId}/guestbook`
      
      // 갤로그 방명록 작성 시 사용되는 폼 데이터 구조
      const formData = new URLSearchParams()
      formData.append('memo', message) // 방명록 내용
      formData.append('password', options.password || '1234') // 방명록 비밀번호
      formData.append('is_secret', options.isSecret ? '1' : '0') // 비밀글 여부

      console.log('API 방식 - 갤로그 방명록 전송 시도:', {
        gallogId,
        url,
        formDataString: formData.toString(),
        hasSessionCookie: !!this.config.sessionCookie,
        cookieLength: this.config.sessionCookie?.length || 0,
        cookiePreview: this.config.sessionCookie?.substring(0, 100) + '...' || 'undefined',
        cookieContainsPHPSESSID: this.config.sessionCookie?.includes('PHPSESSID') || false,
        cookieContainsPHPSESSKEY: this.config.sessionCookie?.includes('PHPSESSKEY') || false,
        cookieContainsGID: this.config.sessionCookie?.includes('GID') || false
      })

      const requestHeaders = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': this.config.userAgent,
        'Referer': `https://gallog.dcinside.com/${gallogId}/guestbook`,
        'Origin': 'https://gallog.dcinside.com',
        'Cookie': this.config.sessionCookie || '',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }

      console.log('API 방식 - 갤로그 API 요청 상세:', {
        url,
        method: 'POST',
        headers: requestHeaders,
        bodyLength: Buffer.from(formData.toString(), 'utf8').length,
        environment: process.env.VERCEL ? 'Vercel' : 'Local'
      })

      const response = await fetch(url, {
        method: 'POST',
        headers: requestHeaders,
        body: Buffer.from(formData.toString(), 'utf8')
      })

      console.log('API 방식 - 갤로그 API 응답:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (response.ok) {
        const responseText = await response.text()
        console.log('API 방식 - 갤로그 API 응답 내용:', responseText.substring(0, 200))
        
        // 성공 여부 확인
        if (responseText.includes('성공') || responseText.includes('완료') || response.status === 200) {
          return { success: true }
        } else {
          return { 
            success: false, 
            error: 'API 응답에서 성공 메시지를 찾을 수 없습니다' 
          }
        }
      } else {
        // 에러 응답 내용도 로깅
        const errorText = await response.text()
        console.log('API 방식 - 갤로그 API 에러 응답:', {
          status: response.status,
          statusText: response.statusText,
          errorContent: errorText.substring(0, 500)
        })
        
        // 403 Forbidden의 경우 로그인 문제일 가능성
        if (response.status === 403) {
          return { 
            success: false, 
            error: `로그인이 필요합니다. 갤로그에 로그인한 후 세션 쿠키를 다시 설정해주세요. (${response.status} ${response.statusText})` 
          }
        }
        
        return { 
          success: false, 
          error: `API 오류: ${response.status} ${response.statusText}` 
        }
      }

    } catch (error) {
      console.error('API 방식 오류:', error)
      return { 
        success: false, 
        error: `API 호출 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      }
    }
  }

  /**
   * 웹 스크래핑 방식으로 갤로그 방명록 전송 시도
   */
  private async tryWebScrapingMethod(gallogId: string, message: string, options: {
    password?: string
    isSecret?: boolean
  }): Promise<{ success: boolean; error?: string }> {
    let browser;
    try {
      // Puppeteer 동적 import (오류 처리 포함)
      let puppeteer;
      try {
        puppeteer = await import('puppeteer')
      } catch (importError) {
        throw new Error(`Puppeteer 모듈을 찾을 수 없습니다: ${importError instanceof Error ? importError.message : '알 수 없는 오류'}`)
      }
      
      console.log('웹 스크래핑 방식 - 갤로그 방명록 전송 시도:', {
        gallogId,
        message: message.substring(0, 50) + '...',
        isSecret: options.isSecret
      })

      // 개선된 Chrome 실행 옵션
      const launchOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-extensions',
          '--disable-plugins',
          '--disable-default-apps',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--mute-audio',
          '--no-default-browser-check',
          '--no-pings',
          '--password-store=basic',
          '--use-mock-keychain'
        ]
      }

      // 환경별 Chrome 경로 설정
      if (process.env.VERCEL) {
        // Vercel 환경 - 동적으로 Chrome 경로 찾기
        const fs = await import('fs')
        const path = await import('path')
        
        const possiblePaths = [
          '/tmp/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome-linux64/chrome',
          '/tmp/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome-linux64/chrome-linux64/chrome',
          '/tmp/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome-linux64/chrome-linux64/chrome-linux64/chrome'
        ]
        
        let chromePath = null
        for (const possiblePath of possiblePaths) {
          if (fs.existsSync(possiblePath)) {
            chromePath = possiblePath
            break
          }
        }
        
        if (chromePath) {
          launchOptions.executablePath = chromePath
          console.log('Vercel 환경: Chrome 경로 발견:', chromePath)
        } else {
          console.log('Vercel 환경: Chrome 경로를 찾을 수 없음, 기본 경로 사용')
          launchOptions.executablePath = '/tmp/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome-linux64/chrome'
        }
      } else {
        // 로컬 환경 (Windows)
        const { platform, homedir } = await import('os')
        if (platform() === 'win32') {
          launchOptions.executablePath = 'C:\\Users\\josan\\.cache\\puppeteer\\chrome\\win64-141.0.7390.122\\chrome-win64\\chrome.exe'
          console.log('로컬 Windows 환경: Chrome 경로 설정:', launchOptions.executablePath)
        } else {
          // Linux/Mac 환경
          launchOptions.executablePath = homedir() + '/.cache/puppeteer/chrome/linux-141.0.7390.122/chrome-linux64/chrome'
          console.log('로컬 Linux/Mac 환경: Chrome 경로 설정:', launchOptions.executablePath)
        }
      }

      console.log('웹 스크래핑 방식 - 브라우저 실행 옵션:', launchOptions)

      // 브라우저 실행
      browser = await puppeteer.launch(launchOptions)
      
      // 브라우저 연결 상태 확인
      const pages = await browser.pages()
      console.log('브라우저 실행 완료, 기존 페이지 수:', pages.length)
      
      // 갤로그 방명록 페이지로 이동
      const url = `https://gallog.dcinside.com/${gallogId}/guestbook`
      
      // 안정적인 페이지 생성 및 로딩
      let page;
      let retryCount = 0
      const maxRetries = 3
      
      while (retryCount < maxRetries) {
        try {
          // 새로운 페이지 생성
          page = await browser.newPage()
          console.log(`페이지 생성 완료 (시도 ${retryCount + 1}/${maxRetries})`)
          
          // User-Agent 설정
          await page.setUserAgent(this.config.userAgent)
          
          // 쿠키 설정
          if (this.config.sessionCookie) {
            const cookies = this.parseCookies(this.config.sessionCookie)
            await page.setCookie(...cookies)
            console.log('쿠키 설정 완료')
          }
          
          // 페이지 로딩 (더 안정적인 방식)
          console.log('페이지 로딩 시작:', url)
          
          // 페이지 로딩 전 대기
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          await page.goto(url, { 
            waitUntil: 'networkidle0',
            timeout: 60000
          })
          
          // 추가 대기 시간
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          // 페이지 로딩 확인
          const pageTitle = await page.title()
          const currentUrl = page.url()
          console.log('페이지 로딩 완료:', { title: pageTitle, url: currentUrl })
          
          // 페이지가 정상적으로 로드되었는지 확인
          if (currentUrl.includes('gallog.dcinside.com')) {
            console.log('갤로그 페이지 로딩 성공')
            break
          } else {
            throw new Error(`잘못된 페이지로 리다이렉트됨: ${currentUrl}`)
          }
          
        } catch (error) {
          retryCount++
          console.log(`페이지 로딩 재시도 ${retryCount}/${maxRetries}:`, error)
          
          // 페이지 정리
          if (page) {
            try {
              await page.close()
            } catch (closeError) {
              console.log('페이지 정리 중 오류:', closeError)
            }
          }
          
          if (retryCount >= maxRetries) {
            throw error
          }
          
          // 재시도 전 대기
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      console.log('웹 스크래핑 방식 - 갤로그 페이지 로드 완료:', url)
      
      // 페이지 디버깅을 위한 추가 정보
      const pageTitle = await page.title()
      const pageUrl = page.url()
      console.log('페이지 정보:', { title: pageTitle, url: pageUrl })
      
      // 로그인 상태 확인
      const loginStatus = await page.evaluate(() => {
        // 갤로그에서 로그인 상태를 확인하는 방법
        const loginElements = document.querySelectorAll('a[href*="login"], .login, .user-info')
        return {
          hasLoginElements: loginElements.length > 0,
          loginElementsCount: loginElements.length,
          pageContent: document.body.innerText.substring(0, 200)
        }
      })
      console.log('로그인 상태 확인:', loginStatus)
      
      // 페이지의 모든 input과 textarea 요소 확인
      const allInputs = await page.$$eval('input, textarea', elements => 
        elements.map(el => ({
          tagName: el.tagName,
          type: el.type,
          name: el.name,
          id: el.id,
          className: el.className
        }))
      )
      console.log('페이지의 모든 input/textarea 요소:', allInputs)
      
      // 방명록 작성 폼 찾기 및 입력 (다양한 셀렉터 시도)
      let commentElement;
      try {
        // 1차 시도: 일반적인 셀렉터
        commentElement = await page.waitForSelector('textarea[name="comment"], input[name="comment"]', { timeout: 5000 })
      } catch {
        console.log('1차 셀렉터 실패, 2차 시도...')
        try {
          // 2차 시도: 갤로그 특화 셀렉터
          commentElement = await page.waitForSelector('textarea, input[type="text"]', { timeout: 5000 })
        } catch {
          console.log('2차 셀렉터 실패, 3차 시도...')
          // 3차 시도: 더 넓은 범위의 셀렉터
          commentElement = await page.waitForSelector('textarea, input', { timeout: 5000 })
        }
      }
      
      // 방명록 내용 입력
      if (commentElement) {
        await commentElement.type(message)
        console.log('방명록 내용 입력 완료')
      } else {
        throw new Error('방명록 입력 요소를 찾을 수 없습니다')
      }
      
      // 비밀번호 입력
      if (options.password) {
        const passwordElement = await page.$('input[name="password"]')
        if (passwordElement) {
          await passwordElement.type(options.password)
          console.log('비밀번호 입력 완료')
        }
      }
      
      // 비밀글 체크박스 클릭 (다양한 셀렉터 시도)
      if (options.isSecret) {
        let secretCheckbox;
        try {
          // 1차 시도: 일반적인 비밀글 체크박스
          secretCheckbox = await page.$('input[name="secret"], input[type="checkbox"]')
        } catch {
          console.log('1차 비밀글 체크박스 셀렉터 실패, 2차 시도...')
          // 2차 시도: 갤로그 특화 셀렉터
          secretCheckbox = await page.$('input[type="checkbox"], input[value="1"]')
        }
        
        if (secretCheckbox) {
          await secretCheckbox.click()
          console.log('비밀글 체크박스 클릭 완료')
        } else {
          console.log('비밀글 체크박스를 찾을 수 없습니다. 계속 진행합니다.')
        }
      }
      
      // 등록 버튼 클릭 (다양한 셀렉터 시도)
      let submitButton;
      try {
        // 1차 시도: 일반적인 submit 버튼
        submitButton = await page.$('button[type="submit"], input[type="submit"]')
        console.log('1차 submit 버튼 셀렉터 시도')
      } catch {
        console.log('1차 submit 버튼 셀렉터 실패, 2차 시도...')
        // 2차 시도: 텍스트 기반 셀렉터
        submitButton = await page.$('button:contains("등록"), button:contains("작성"), button:contains("전송")')
        console.log('2차 submit 버튼 셀렉터 시도')
      }
      
      if (submitButton) {
        await submitButton.click()
        console.log('등록 버튼 클릭 완료')
      } else {
        // 3차 시도: 모든 버튼 중에서 찾기
        const allButtons = await page.$$eval('button, input[type="submit"]', buttons => 
          buttons.map(btn => ({
            tagName: btn.tagName,
            type: btn.type,
            text: btn.textContent?.trim(),
            value: btn.value
          }))
        )
        console.log('페이지의 모든 버튼:', allButtons)
        throw new Error('등록 버튼을 찾을 수 없습니다')
      }
      
      // 응답 대기
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // 성공 여부 확인
      const currentUrl = page.url()
      const pageContent = await page.content()
      
      console.log('웹 스크래핑 방식 - 갤로그 방명록 작성 완료:', {
        currentUrl,
        hasSuccessMessage: pageContent.includes('성공') || pageContent.includes('완료')
      })
      
      // 성공 여부 판단
      const isSuccess = currentUrl.includes('guestbook') && 
                      (pageContent.includes('성공') || pageContent.includes('완료') || 
                       !pageContent.includes('오류') && !pageContent.includes('실패'))
      
      return { success: isSuccess }

    } catch (error) {
      console.error('웹 스크래핑 방식 오류:', error)
      return { 
        success: false, 
        error: `웹 스크래핑 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
      }
    } finally {
      if (browser) {
        try {
          console.log('브라우저 종료 중...')
          await browser.close()
          console.log('브라우저 종료 완료')
        } catch (closeError) {
          console.log('브라우저 종료 중 오류:', closeError)
        }
      }
    }
  }

  /**
   * 쿠키 문자열을 파싱하여 Puppeteer 쿠키 객체로 변환
   */
  private parseCookies(cookieString: string) {
    return cookieString.split(';').map(cookie => {
      const [name, value] = cookie.trim().split('=')
      return {
        name: name,
        value: value || '',
        domain: '.dcinside.com',
        path: '/'
      }
    })
  }

  /**
   * 갤로그 방명록 전송 테스트
   * @param gallogId 갤로그 식별 코드
   */
  async testVisitMessage(gallogId: string): Promise<{ success: boolean; error?: string }> {
    const testMessage = `테스트 메시지 - ${new Date().toLocaleString()}`
    return this.sendVisitMessage(gallogId, testMessage, { isSecret: true })
  }

  /**
   * 갤로그 방명록에 인증 코드 전송
   * @param gallogId 갤로그 식별 코드
   * @param verificationCode 인증 코드
   */
  async sendVerificationCode(gallogId: string, verificationCode: string): Promise<{ success: boolean; error?: string }> {
    const message = `빵장 신청 인증 코드: ${verificationCode}\n\n이 코드를 빵장 신청 페이지에 입력해주세요.\n\n전송 시간: ${new Date().toLocaleString()}`
    
    return this.sendVisitMessage(gallogId, message, { 
      isSecret: true,
      password: '1234'
    })
  }

  /**
   * 갤로그 API 연결 테스트
   */
  async testConnection(gallogId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`갤로그 API 연결 테스트: ${gallogId}`)
      
      // 테스트 메시지 전송
      const testMessage = `테스트 메시지 - ${new Date().toLocaleString('ko-KR')}`
      const result = await this.sendVisitMessage(gallogId, testMessage, { isSecret: true })
      
      return result
    } catch (error) {
      console.error('갤로그 API 테스트 실패:', error)
      return {
        success: false,
        error: `갤로그 API 테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      }
    }
  }
}

// 갤로그 API 인스턴스 생성
export const gallogApi = new GallogApi({
  baseUrl: 'https://gall.dcinside.com',
  sessionCookie: process.env.DCINSIDE_SESSION_COOKIE,
  userAgent: 'GhostX-Bot/1.0'
})

// 갤로그 API 테스트 함수
export async function testGallogApi(gallogId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('갤로그 API 테스트 시작:', gallogId)
    
    // 테스트 메시지 전송
    const result = await gallogApi.testVisitMessage(gallogId)
    
    console.log('갤로그 API 테스트 결과:', result)
    return result
    
  } catch (error) {
    console.error('갤로그 API 테스트 오류:', error)
    return { 
      success: false, 
      error: `테스트 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}` 
    }
  }
}
