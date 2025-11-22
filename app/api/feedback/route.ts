import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, subject, message } = body

    // 필수 필드 검증
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: '모든 필드는 필수입니다.' },
        { status: 400 }
      )
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 이메일 전송 (실제 구현에서는 Nodemailer, SendGrid 등을 사용)
    // 여기서는 콘솔에 로그만 출력
    console.log('📧 피드백 이메일 수신:')
    console.log('보낸이:', name, `<${email}>`)
    console.log('제목:', subject)
    console.log('내용:', message)
    console.log('수신 시간:', new Date().toISOString())

    // 실제 이메일 전송을 위한 코드 (예시)
    /*
    const nodemailer = require('nodemailer')
    
    const transporter = nodemailer.createTransporter({
      service: 'gmail', // 또는 다른 이메일 서비스
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    })

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // 관리자 이메일
      subject: `[피드백] ${subject}`,
      html: `
        <h2>새로운 피드백이 도착했습니다</h2>
        <p><strong>보낸이:</strong> ${name} (${email})</p>
        <p><strong>제목:</strong> ${subject}</p>
        <p><strong>내용:</strong></p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${message}</div>
        <p><strong>수신 시간:</strong> ${new Date().toLocaleString('ko-KR')}</p>
      `
    }

    await transporter.sendMail(mailOptions)
    */

    return NextResponse.json({ 
      success: true, 
      message: '피드백이 성공적으로 전송되었습니다.' 
    })

  } catch (error) {
    console.error('피드백 전송 실패:', error)
    return NextResponse.json(
      { error: '피드백 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}









