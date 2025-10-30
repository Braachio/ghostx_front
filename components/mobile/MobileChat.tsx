'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

interface ChatMessage {
  id: string
  userId: string | null
  nickname: string
  message: string
  timestamp: Date
  color: string
}

interface OnlineParticipant {
  userId: string
  steamId: string | null
  nickname: string
  color: string
  lastSeen: Date
}

interface MobileChatProps {
  user: {
    id: string
    nickname: string
    email: string
    role: string
  } | null
  language: 'ko' | 'en'
}

export default function MobileChat({ user, language }: MobileChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isSteamUser, setIsSteamUser] = useState<boolean>(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [onlineParticipants, setOnlineParticipants] = useState<OnlineParticipant[]>([])
  const [showParticipants, setShowParticipants] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [currentNickname, setCurrentNickname] = useState<string>('')
  const [pendingNickname, setPendingNickname] = useState<string>('')
  const [selectedGame, setSelectedGame] = useState('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClientComponentClient<Database>()

  const t = {
    ko: {
      chat: '채팅',
      sendMessage: '메시지 전송',
      onlineUsers: '접속자',
      steamLoginRequired: 'Steam 로그인이 필요합니다',
      loginWithSteam: 'Steam으로 로그인',
      selectGame: '게임 선택',
      allGames: '전체 게임',
      participants: '접속자 목록',
      close: '닫기'
    },
    en: {
      chat: 'Chat',
      sendMessage: 'Send Message',
      onlineUsers: 'Online',
      steamLoginRequired: 'Steam login required',
      loginWithSteam: 'Login with Steam',
      selectGame: 'Select Game',
      allGames: 'All Games',
      participants: 'Participants',
      close: 'Close'
    }
  }

  // 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        setIsAuthenticated(false)
        setIsSteamUser(false)
        setIsLoading(false)
        return
      }

      setIsAuthenticated(true)
      setCurrentUserId(user.id)

      // Steam 사용자인지 확인
      const isSteamUser = 
        user.app_metadata?.provider === 'steam' || 
        user.user_metadata?.provider === 'steam' ||
        user.identities?.some(identity => identity.provider === 'steam') ||
        user.email?.includes('steam') ||
        user.user_metadata?.steam_id ||
        user.app_metadata?.steam_id

      setIsSteamUser(isSteamUser)
      // 프로필 닉네임 로드
      try {
        const meRes = await fetch('/api/me')
        if (meRes.ok) {
          const { user: me } = await meRes.json()
          if (me?.nickname) {
            setCurrentNickname(me.nickname)
            setPendingNickname(me.nickname)
          }
        }
      } catch {}
      setIsLoading(false)
    }

    checkAuth()
  }, [supabase])

  // 메시지 로드
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/game/${selectedGame}`)
      if (response.ok) {
        const apiMessages = await response.json()
        const formattedMessages: ChatMessage[] = apiMessages.map((msg: {
          id: string
          user_id: string | null
          nickname: string
          message: string
          created_at: string
          color: string
        }) => ({
          id: msg.id,
          userId: msg.user_id,
          nickname: msg.nickname,
          message: msg.message,
          timestamp: new Date(msg.created_at),
          color: msg.color || '#ffffff'
        }))
        // 최신 순으로 정렬 후 최근 200개만 유지
        setMessages(formattedMessages.slice(-200))
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error)
    }
  }, [selectedGame])

  // 접속자 목록 로드
  const loadParticipants = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/game/${selectedGame}/presence`)
      if (response.ok) {
        const participants = await response.json()
        setOnlineParticipants(participants)
      }
    } catch (error) {
      console.error('접속자 목록 로드 실패:', error)
    }
  }, [selectedGame])

  // 메시지 전송
  const sendMessage = async () => {
    if (!messageText.trim() || !isSteamUser) return

    const tempId = `temp-${Date.now()}`
    const nickname = currentNickname || user?.nickname || 'Anonymous'
    const color = '#3B82F6'

    // 낙관적 UI 업데이트
    const optimisticMessage: ChatMessage = {
      id: tempId,
      userId: currentUserId,
      nickname,
      message: messageText,
      timestamp: new Date(),
      color
    }

    setMessages(prev => [...prev, optimisticMessage])
    const messageToSend = messageText
    setMessageText('')

    try {
      const response = await fetch(`/api/chat/game/${selectedGame}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          message: messageToSend,
          color
        }),
      })

      if (response.ok) {
        const sentMessage = await response.json()
        // 실제 메시지로 교체
        setMessages(prev => 
          prev.map(msg => 
            msg.id === tempId 
              ? {
                  id: sentMessage.id,
                  userId: sentMessage.user_id || currentUserId,
                  nickname: sentMessage.nickname,
                  message: sentMessage.message,
                  timestamp: new Date(sentMessage.created_at),
                  color: sentMessage.color || '#ffffff'
                }
              : msg
          )
        )
      } else {
        // 실패 시 낙관적 메시지 제거
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        const errorData = await response.json()
        alert(errorData.error || '메시지 전송에 실패했습니다.')
        setMessageText(messageToSend) // 메시지 복원
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setMessageText(messageToSend) // 메시지 복원
    }
  }

  // 폴링으로 메시지 업데이트
  useEffect(() => {
    if (!isAuthenticated) return

    const fetchData = async () => {
      await loadMessages()
      await loadParticipants()
    }

    fetchData()

    const interval = setInterval(fetchData, 1500)

    return () => clearInterval(interval)
  }, [isAuthenticated, loadMessages, loadParticipants])

  // 수동 스크롤 모드: 버튼으로만 하단 이동
  const [showScrollToBottom, setShowScrollToBottom] = useState(false)
  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current
    if (!el) return
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 20
    setShowScrollToBottom(!nearBottom)
  }
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    setShowScrollToBottom(false)
  }

  // 키보드 등장 시에도 헤더가 보이도록 시각적 뷰포트 높이에 맞춰 컨테이너 높이 조정
  useEffect(() => {
    const vv: VisualViewport | undefined =
      typeof window !== 'undefined' && 'visualViewport' in window
        ? window.visualViewport
        : undefined
    if (!vv || !containerRef.current) return

    const applyHeight = () => {
      if (!containerRef.current) return
      const h = Math.max(0, Math.floor(vv.height))
      containerRef.current.style.height = `${h}px`
      containerRef.current.style.maxHeight = `${h}px`
    }

    applyHeight()
    vv.addEventListener('resize', applyHeight)
    vv.addEventListener('scroll', applyHeight)
    return () => {
      vv.removeEventListener('resize', applyHeight)
      vv.removeEventListener('scroll', applyHeight)
    }
  }, [])

  const isMyMessage = (msg: ChatMessage) => {
    if (!currentUserId) return false
    return msg.userId === currentUserId
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isSteamUser) {
    return (
      <div className="bg-gray-900 rounded-2xl p-6 text-center">
        <div className="text-4xl mb-4">🎮</div>
        <h3 className="text-lg font-bold mb-2 text-cyan-400">
          {t[language].steamLoginRequired}
        </h3>
        <p className="text-gray-300 mb-4 text-sm">
          {language === 'ko' 
            ? '채팅에 참여하려면 Steam 로그인이 필요합니다.' 
            : 'Steam login is required to participate in chat.'
          }
        </p>
        <a
          href="/api/auth/steam"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all"
        >
          <span>🚀</span>
          {t[language].loginWithSteam}
        </a>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="h-full w-full bg-gray-900 flex flex-col overflow-hidden" style={{ height: '100%', maxHeight: '100%' }}>
      {/* 헤더 - 고정 */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex-shrink-0 z-10" style={{ flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">{t[language].chat}</h3>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600"
            >
              <option value="all">{t[language].allGames}</option>
              <option value="lemans">르망얼티밋</option>
              <option value="f1-25">F1 25</option>
              <option value="competizione">컴페티치오네</option>
              <option value="iracing">아이레이싱</option>
              <option value="ea-wrc">EA WRC</option>
              <option value="assettocorsa">아세토코르사</option>
              <option value="automobilista2">오토모빌리스타2</option>
              <option value="gran-turismo7">그란투리스모7</option>
              <option value="rfactor2">알펙터2</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowParticipants(true)}
              className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              {onlineParticipants.length}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-sm text-gray-300 hover:text-white transition-colors border border-gray-600 rounded px-2 py-1"
            >
              닉네임: {currentNickname || '설정'}
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 영역 - 스크롤 가능 */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto p-4 space-y-3" 
        style={{ 
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {messages.map((msg, index) => {
          const prevMsg = index > 0 ? messages[index - 1] : null
          const isMine = isMyMessage(msg)
          const showAvatar = !prevMsg || !prevMsg.userId || !msg.userId || prevMsg.userId !== msg.userId || 
            (msg.timestamp.getTime() - prevMsg.timestamp.getTime()) > 300000

          return (
            <div
              key={msg.id}
              className={`flex ${isMine ? 'flex-row-reverse' : 'flex-row'} ${isMine ? 'items-end' : 'items-start'} gap-2`}
            >
              {!isMine && showAvatar && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {msg.nickname.charAt(0).toUpperCase()}
                </div>
              )}
              {!isMine && !showAvatar && <div className="w-8"></div>}
              
              <div className={`max-w-[70%] ${isMine ? 'mr-2' : 'ml-2'}`}>
                {!isMine && showAvatar && (
                  <div className="text-xs text-gray-400 mb-1 px-1">
                    {msg.nickname}
                  </div>
                )}
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-700 text-white rounded-bl-md'
                  }`}
                  style={{ color: isMine ? undefined : msg.color }}
                >
                  {msg.message}
                </div>
                <div className={`text-xs text-gray-500 mt-1 ${isMine ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString('ko-KR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 하단으로 이동 버튼 */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute right-4 bottom-24 z-20 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-full shadow-lg"
        >
          ↓
        </button>
      )}

      {/* 입력 영역 - 키보드 위 고정 */}
      <div 
        className="bg-gray-800 px-4 py-3 border-t border-gray-700" 
        style={{ 
          flexShrink: 0,
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))'
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            onFocus={() => {
              // 키보드가 올라올 때 메시지 영역 스크롤을 맨 아래로
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
              }, 300)
            }}
            placeholder={t[language].sendMessage}
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-base"
            style={{ fontSize: 16 }}
          />
          <button
            onClick={sendMessage}
            disabled={!messageText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold"
          >
            전송
          </button>
        </div>
      </div>

      {/* 접속자 목록 모달 */}
      {showParticipants && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">{t[language].participants}</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {onlineParticipants.map((participant) => (
                <div key={participant.userId} className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-sm font-bold">
                    {participant.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-white text-sm font-medium">{participant.nickname}</div>
                    <div className="text-gray-400 text-xs">온라인</div>
                  </div>
                </div>
              ))}
              {onlineParticipants.length === 0 && (
                <div className="text-gray-400 text-center py-4">
                  {language === 'ko' ? '접속자가 없습니다.' : 'No participants online.'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 닉네임 설정 모달 */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">닉네임 설정</h3>
              <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={pendingNickname}
                onChange={(e) => setPendingNickname(e.target.value)}
                placeholder="닉네임"
                className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 text-base"
                style={{ fontSize: 16 }}
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    const trimmed = pendingNickname.trim()
                    if (!trimmed) return
                    // 중복 확인(선택)
                    try {
                      const dup = await fetch('/api/check-nickname', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nickname: trimmed })
                      })
                      const dupJson = await dup.json()
                      if (dup.ok && dupJson.available === false && trimmed !== currentNickname) {
                        alert('이미 사용 중인 닉네임입니다.')
                        return
                      }
                    } catch {}

                    const res = await fetch('/api/update-nickname', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ nickname: trimmed })
                    })
                    if (res.ok) {
                      setCurrentNickname(trimmed)
                      try { localStorage.setItem('global_nickname', trimmed) } catch {}
                      setShowSettings(false)
                    } else {
                      const j = await res.json().catch(() => ({}))
                      alert(j.error || '닉네임 저장 실패')
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
