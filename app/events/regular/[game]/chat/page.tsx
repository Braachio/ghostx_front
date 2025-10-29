'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'

interface GameChatPageProps {
  params: Promise<{ game: string }>
}

interface ChatMessage {
  id: string
  nickname: string
  message: string
  timestamp: Date
  color: string
}

// 게임 이름 매핑
const gameNames: Record<string, string> = {
  'iracing': '아이레이싱',
  'assettocorsa': '아세토코르사',
  'gran-turismo7': '그란투리스모7',
  'automobilista2': '오토모빌리스타2',
  'competizione': '컴페티치오네',
  'lemans': '르망얼티밋',
  'f1-25': 'F1 25',
  'ea-wrc': 'EA WRC'
}

// 최대 메시지 개수 제한
const MAX_MESSAGES = 200

export default function GameChatPage({ params }: GameChatPageProps) {
  const [game, setGame] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [nickname, setNickname] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [showSettings, setShowSettings] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params
        setGame(resolvedParams.game)
      } catch (error) {
        console.error('Params loading error:', error)
      }
    }
    loadParams()
  }, [params])

  const gameName = useMemo(() => gameNames[game] || game, [game])

  // 메시지 로드 (서버에서) - 모든 게임별 채팅 표시
  const loadMessages = useCallback(async (isInitialLoad = false) => {
    if (!game) return

    try {
      const response = await fetch(`/api/chat/game/${game}?limit=100`)
      if (response.ok) {
        const apiMessages = await response.json()
        const formattedMessages: ChatMessage[] = apiMessages.map((msg: { id: string; nickname: string; message: string; created_at: string; color: string }) => ({
          id: msg.id,
          nickname: msg.nickname,
          message: msg.message,
          timestamp: new Date(msg.created_at),
          color: msg.color || '#ffffff'
        }))
        
        if (isInitialLoad) {
          // 초기 로드 시 모든 메시지 설정
          setMessages(formattedMessages)
        } else {
          // 폴링 시 새 메시지만 추가
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMessages = formattedMessages.filter(msg => !existingIds.has(msg.id))
            
            if (newMessages.length > 0) {
              const updated = [...prev, ...newMessages].sort((a, b) => 
                a.timestamp.getTime() - b.timestamp.getTime()
              )
              if (updated.length > MAX_MESSAGES) {
                return updated.slice(-MAX_MESSAGES)
              }
              return updated
            }
            return prev
          })
        }
      } else {
        if (isInitialLoad) {
          setMessages([])
        }
      }
    } catch (error) {
      console.error('메시지 로드 중 오류:', error)
      if (isInitialLoad) {
        setMessages([])
      }
    }
  }, [game])

  // 폴링 방식으로 새 메시지 확인 (1.5초마다)
  const startPolling = useCallback(() => {
    if (!game) return

    // 기존 폴링 중지
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }

    setIsConnected(true)

    // 1.5초마다 새 메시지 확인
    pollingIntervalRef.current = setInterval(() => {
      loadMessages(false)
    }, 1500)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      setIsConnected(false)
    }
  }, [game, loadMessages])

  useEffect(() => {
    if (!game) return

    // localStorage에서 닉네임과 색상 로드
    const savedNickname = localStorage.getItem(`game_nickname_${gameName}`)
    const savedColor = localStorage.getItem(`game_color_${gameName}`)
    
    if (savedNickname) {
      setNickname(savedNickname)
    }
    if (savedColor) {
      setColor(savedColor)
    }

    // 초기 메시지 로드
    loadMessages(true)

    // 폴링 시작
    const cleanup = startPolling()
    
    return () => {
      if (cleanup) {
        cleanup()
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
    }
  }, [game, gameName, loadMessages, startPolling])

  // 스크롤 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!newMessage.trim() || !nickname.trim() || !game) return

    const messageText = newMessage.trim()
    setNewMessage('')

    // 낙관적 업데이트: 전송 즉시 UI에 표시
    const tempId = `temp_${Date.now()}_${Math.random()}`
    const optimisticMessage: ChatMessage = {
      id: tempId,
      nickname,
      message: messageText,
      timestamp: new Date(),
      color: color || '#ffffff'
    }

    setMessages(prev => {
      const updated = [...prev, optimisticMessage]
      if (updated.length > MAX_MESSAGES) {
        return updated.slice(-MAX_MESSAGES)
      }
      return updated
    })

    try {
      const response = await fetch(`/api/chat/game/${game}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname,
          message: messageText,
          color
        })
      })

      if (response.ok) {
        const sentMessage = await response.json()
        
        // 서버 응답으로 받은 실제 메시지로 임시 메시지 교체
        setMessages(prev => {
          // 임시 메시지 제거
          const filtered = prev.filter(msg => msg.id !== tempId)
          
          // 실제 메시지 추가 (중복 체크)
          const actualMessage: ChatMessage = {
            id: sentMessage.id,
            nickname: sentMessage.nickname,
            message: sentMessage.message,
            timestamp: new Date(sentMessage.created_at),
            color: sentMessage.color || '#ffffff'
          }
          
          if (!filtered.some(msg => msg.id === actualMessage.id)) {
            const updated = [...filtered, actualMessage]
            if (updated.length > MAX_MESSAGES) {
              return updated.slice(-MAX_MESSAGES)
            }
            return updated
          }
          
          return filtered
        })
      } else {
        // 전송 실패 시 임시 메시지 제거 및 입력 복원
        setMessages(prev => prev.filter(msg => msg.id !== tempId))
        setNewMessage(messageText)
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      // 전송 실패 시 임시 메시지 제거 및 입력 복원
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
      setNewMessage(messageText)
    }
  }

  const saveNickname = () => {
    if (nickname.trim() && game) {
      localStorage.setItem(`game_nickname_${gameName}`, nickname.trim())
    }
  }

  const saveColor = () => {
    if (game) {
      localStorage.setItem(`game_color_${gameName}`, color)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return '방금'
    if (minutes < 60) return `${minutes}분 전`
    
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 닉네임 첫 글자로 아바타 생성
  const getAvatarLetter = (nickname: string) => {
    return nickname.charAt(0).toUpperCase()
  }

  // 내 메시지인지 확인 (현재는 모든 메시지가 다른 사람 메시지로 표시)
  const isMyMessage = (msgNickname: string) => {
    return msgNickname === nickname
  }

  // 온라인 접속자 목록 (최근 5분 이내 메시지를 보낸 사람들)
  const onlineParticipants = useMemo(() => {
    const now = new Date()
    const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000
    
    const activeUsers = new Map<string, { nickname: string; color: string; lastSeen: Date }>()
    
    messages.forEach(msg => {
      const msgTime = msg.timestamp.getTime()
      if (msgTime >= fiveMinutesAgo) {
        const existing = activeUsers.get(msg.nickname)
        if (!existing || msgTime > existing.lastSeen.getTime()) {
          activeUsers.set(msg.nickname, {
            nickname: msg.nickname,
            color: msg.color,
            lastSeen: msg.timestamp
          })
        }
      }
    })
    
    return Array.from(activeUsers.values()).sort((a, b) => 
      b.lastSeen.getTime() - a.lastSeen.getTime()
    )
  }, [messages])

  if (!game) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0e1621] text-white flex flex-col">
      {/* 헤더 - 텔레그램 스타일 */}
      <div className="bg-[#17212b] border-b border-gray-700/50 px-4 py-3 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-700/50 rounded-full transition-colors"
            >
              ←
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white">
                {gameName.charAt(0)}
              </div>
              <div>
                <button
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="text-left hover:opacity-80 transition-opacity"
                >
                  <h1 className="text-base font-semibold">{gameName} 채팅</h1>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                    <span className="text-xs text-gray-400">
                      {onlineParticipants.length}명 접속 중
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className="p-2 text-gray-400 hover:bg-gray-700/50 rounded-full transition-colors relative"
              title="접속자 목록"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {onlineParticipants.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
                  {onlineParticipants.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:bg-gray-700/50 rounded-full transition-colors"
              title="설정"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
        </div>
      </div>

      {/* 메시지 영역 - 텔레그램 스타일 배경 */}
      <div 
        className="flex-1 overflow-y-auto px-3 py-4 space-y-2"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 119, 198, 0.03) 0%, transparent 50%)',
          backgroundColor: '#0e1621'
        }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-gray-700/30 mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">💬</span>
            </div>
            <p className="text-gray-400 text-lg font-medium">첫 메시지를 남겨보세요!</p>
            <p className="text-gray-500 text-sm mt-2">
              {gameName} 관련 이야기를 자유롭게 나누어보세요.
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMine = isMyMessage(msg.nickname)
            const prevMsg = index > 0 ? messages[index - 1] : null
            const showAvatar = !prevMsg || prevMsg.nickname !== msg.nickname || 
              (msg.timestamp.getTime() - prevMsg.timestamp.getTime()) > 300000 // 5분 이상 차이
            
            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end group`}
              >
                {/* 아바타 */}
                {showAvatar && !isMine && (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0 mb-1"
                    style={{ backgroundColor: msg.color }}
                  >
                    {getAvatarLetter(msg.nickname)}
                  </div>
                )}
                {!showAvatar && !isMine && <div className="w-8 flex-shrink-0" />}
                {isMine && <div className="w-8 flex-shrink-0" />}
                
                {/* 메시지 버블 */}
                <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%] ${isMine ? 'mr-0' : 'ml-0'}`}>
                  {!isMine && showAvatar && (
                    <span className="text-sm text-gray-400 mb-1 px-1 font-medium" style={{ color: msg.color }}>
                      {msg.nickname}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                      isMine
                        ? 'bg-[#3390ec] text-white rounded-br-sm'
                        : 'bg-[#182533] text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-base whitespace-pre-wrap break-words leading-relaxed">
                      {msg.message}
                    </p>
                    <div className={`flex items-center gap-1.5 mt-1.5 justify-end ${isMine ? 'text-blue-100' : 'text-gray-400'}`}>
                      <span className="text-[11px] leading-none opacity-70">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 접속자 목록 모달 */}
      {showParticipants && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setShowParticipants(false)}
        >
          <div 
            className="bg-[#17212b] rounded-t-2xl sm:rounded-2xl w-full sm:w-96 max-h-[80vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50">
              <h3 className="text-lg font-semibold text-white">접속자 목록</h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1.5 hover:bg-gray-700/50 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4">
              {onlineParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">접속자가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {onlineParticipants.map((participant) => (
                    <div
                      key={participant.nickname}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-700/30 transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white flex-shrink-0"
                        style={{ backgroundColor: participant.color }}
                      >
                        {getAvatarLetter(participant.nickname)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-medium text-white truncate">
                            {participant.nickname}
                          </span>
                          <div className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></div>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {formatTime(participant.lastSeen)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 설정 패널 - 텔레그램 스타일 */}
      {showSettings && (
        <div className="bg-[#17212b] border-t border-gray-700/50 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">채팅 설정</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="p-1.5 hover:bg-gray-700/50 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-2">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onBlur={saveNickname}
                placeholder="인게임 닉네임을 입력하세요"
                maxLength={20}
                className="w-full px-4 py-2.5 bg-[#242f3d] border border-gray-600/30 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-2">아바타 색상</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  onBlur={saveColor}
                  className="w-12 h-12 bg-[#242f3d] border border-gray-600/30 rounded-xl cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {nickname ? getAvatarLetter(nickname) : '?'}
                  </div>
                  <span className="text-sm text-gray-400">미리보기</span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-gray-700/50">
              <p className="text-xs text-gray-500">
                💡 모든 브라우저와 실시간으로 동기화되며, 채팅 기록이 서버에 저장됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 입력 영역 - 텔레그램 스타일 */}
      {!showSettings && (
        <div className="bg-[#17212b] border-t border-gray-700/50 p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={nickname ? "메시지 입력..." : "먼저 설정에서 닉네임을 입력해주세요"}
                rows={1}
                style={{
                  maxHeight: '120px',
                  resize: 'none',
                }}
                className="w-full px-4 py-2.5 bg-[#242f3d] border border-gray-600/30 rounded-2xl text-white text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-500"
                disabled={!nickname.trim()}
                maxLength={200}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`
                }}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() || !nickname.trim()}
              className="w-10 h-10 rounded-full bg-[#3390ec] text-white flex items-center justify-center hover:bg-[#2a7dd6] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0 disabled:bg-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
