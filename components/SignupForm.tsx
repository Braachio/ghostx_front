'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupForm() {
  const router = useRouter()

  const [nickname, setNickname] = useState('')
  const [emailId, setEmailId] = useState('')
  const [emailDomain, setEmailDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [isCustom, setIsCustom] = useState(false)
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null)
  const [nicknameAvailable, setNicknameAvailable] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const email = `${emailId}@${isCustom ? customDomain : emailDomain}`

  // 이메일 중복 확인
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!emailId || !(emailDomain || customDomain)) {
        return setEmailAvailable(null)
      }

      try {
        const res = await fetch('/api/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const result = await res.json()
        setEmailAvailable(result.available ?? null)
      } catch (err: unknown) {
        const e = err as Error
        setError(e.message || '')
        setEmailAvailable(null)
      }
    }, 500)

    return () => clearTimeout(delay)
  }, [emailId, emailDomain, customDomain])

  // 닉네임 중복 확인
  useEffect(() => {
    const delay = setTimeout(async () => {
      if (!nickname) return setNicknameAvailable(null)

      try {
        const res = await fetch('/api/check-nickname', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nickname }),
        })
        const result = await res.json()
        setNicknameAvailable(result.available ?? null)
      } catch (err: unknown) {
        const e = err as Error
        setError(e.message || '')
        setNicknameAvailable(null)
      }
    }, 500)

    return () => clearTimeout(delay)
  }, [nickname])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      return setError('비밀번호가 일치하지 않습니다.')
    }
    if (emailAvailable === false) {
      return setError('이미 사용 중인 이메일입니다.')
    }
    if (nicknameAvailable === false) {
      return setError('이미 사용 중인 닉네임입니다.')
    }

    setLoading(true)
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
      })

      const result = await res.json()
      if (!res.ok) {
        setError(result.error || '회원가입 실패')
      } else {
        alert('회원가입 성공! 이메일 인증을 완료해 주세요.')
        router.push('/login')
      }
    } catch (err: unknown) {
      const e = err as Error
      setError(e.message || '네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-4 text-center">회원가입</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="닉네임"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          className="border p-2 rounded"
          required
        />
        {nickname && (
          <p className={`text-sm ${nicknameAvailable ? 'text-green-600' : 'text-red-500'}`}>
            {nicknameAvailable === null
              ? '닉네임 확인 중...'
              : nicknameAvailable
              ? '사용 가능한 닉네임입니다.'
              : '이미 사용 중인 닉네임입니다.'}
          </p>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="이메일 아이디"
            value={emailId}
            onChange={e => setEmailId(e.target.value)}
            required
            className="border p-2 rounded w-1/2"
          />
          <span className="self-center">@</span>
          {isCustom ? (
            <input
              type="text"
              placeholder="example.com"
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              required
              className="border p-2 rounded w-1/2"
            />
          ) : (
            <select
              value={emailDomain}
              onChange={e => {
                if (e.target.value === 'custom') {
                  setIsCustom(true)
                  setEmailDomain('')
                } else {
                  setIsCustom(false)
                  setEmailDomain(e.target.value)
                }
              }}
              className="border p-2 rounded w-1/2"
              required
            >
              <option value="">선택</option>
              <option value="gmail.com">gmail.com</option>
              <option value="naver.com">naver.com</option>
              <option value="kakao.com">kakao.com</option>
              <option value="daum.net">daum.net</option>
              <option value="custom">직접입력</option>
            </select>
          )}
        </div>

        {emailId && (emailDomain || customDomain) && (
          <p className={`text-sm ${emailAvailable ? 'text-green-600' : 'text-red-500'}`}>
            {emailAvailable === null
              ? '이메일 확인 중...'
              : emailAvailable
              ? '사용 가능한 이메일입니다.'
              : '이미 사용 중인 이메일입니다.'}
          </p>
        )}

        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '가입 중...' : '회원가입'}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
    </div>
  )
}
