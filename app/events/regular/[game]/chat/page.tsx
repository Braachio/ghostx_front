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
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

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
  const loadMessages = useCallback(async () => {
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
        setMessages(formattedMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('메시지 로드 중 오류:', error)
      setMessages([])
    }
  }, [game])

  // 실시간 채팅 연결
  const connectRealtimeChat = useCallback(() => {
    if (!game) return

    // 기존 연결이 있으면 닫기
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    const eventSource = new EventSource(`/api/chat/game/${game}/stream`)
    eventSourceRef.current = eventSource
    
    eventSource.onopen = () => {
      setIsConnected(true)
      reconnectAttemptsRef.current = 0
    }

    eventSource.onmessage = (event) => {
      try {
        if (event.data.trim() === '') return
        
        const data = JSON.parse(event.data)
        
        if (data.type === 'connected') {
          console.log('SSE 연결 확인됨')
        } else if (data.type === 'message') {
          const newMsg: ChatMessage = {
            id: data.data.id,
            nickname: data.data.nickname,
            message: data.data.message,
            timestamp: new Date(data.data.created_at),
            color: data.data.color || '#ffffff'
          }
          
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMsg.id)) {
              return prev
            }
            const updated = [...prev, newMsg]
            if (updated.length > MAX_MESSAGES) {
              return updated.slice(-MAX_MESSAGES)
            }
            return updated
          })
        }
      } catch (error) {
        console.error('SSE 메시지 처리 오류:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE 연결 오류:', error, eventSource.readyState)
      setIsConnected(false)
      
      if (eventSource.readyState === EventSource.CLOSED) {
        eventSource.close()
        eventSourceRef.current = null

        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
          reconnectAttemptsRef.current++
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (game) {
              connectRealtimeChat()
            }
          }, delay)
        }
      }
    }

    return () => {
      eventSource.close()
      eventSourceRef.current = null
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      setIsConnected(false)
    }
  }, [game])

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

    // 메시지 로드
    loadMessages()

    // 실시간 연결 시작
    const cleanup = connectRealtimeChat()
    
    return () => {
      if (cleanup) {
        cleanup()
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [game, gameName, loadMessages, connectRealtimeChat])

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
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">💬 {gameName} 채팅</h1>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400">
                {isConnected ? '실시간 연결됨' : '연결 중...'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="설정"
          >
            ⚙️
          </button>
        </div>
        <p className="text-gray-400 text-sm text-center mt-1">
          모든 브라우저와 실시간으로 동기화됩니다.
        </p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-400">첫 메시지를 남겨보세요!</p>
            <p className="text-gray-500 text-sm mt-2">
              {gameName} 관련 이야기를 자유롭게 나누어보세요.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm" style={{ color: msg.color }}>
                  {msg.nickname}
                </span>
                <span className="text-gray-500 text-xs">{formatTime(msg.timestamp)}</span>
              </div>
              <p className="text-white text-sm whitespace-pre-wrap break-words">{msg.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 설정 패널 */}
      {showSettings && (
        <div className="bg-gray-800 border-t border-gray-700 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">⚙️ 채팅 설정</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-300 mb-1">닉네임</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                onBlur={saveNickname}
                placeholder="인게임 닉네임을 입력하세요"
                maxLength={20}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-300 mb-1">메시지 색상</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  onBlur={saveColor}
                  className="w-10 h-10 bg-gray-700 border border-gray-600 rounded-lg cursor-pointer"
                />
                <span className="text-sm text-gray-400">미리보기:</span>
                <span className="text-sm font-semibold" style={{ color }}>
                  {nickname || '닉네임'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowSettings(false)}
              className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-500 transition-colors"
            >
              설정 닫기
            </button>
          </div>
        </div>
      )}

      {/* 입력 영역 */}
      <div className="bg-gray-800 border-t border-gray-700 p-4">
        {/* 메시지 입력 */}
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            placeholder={nickname ? "메시지를 입력하세요... (Shift+Enter로 줄바꿈)" : "먼저 설정에서 닉네임을 입력해주세요"}
            rows={3}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm resize-none"
            disabled={!nickname.trim()}
            maxLength={200}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || !nickname.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            전송
          </button>
        </div>

        {/* 안내 메시지 */}
        <div className="text-xs text-gray-500 text-center mt-2">
          💡 모든 브라우저와 실시간으로 동기화되며, 채팅 기록이 서버에 저장됩니다.
        </div>
      </div>
    </div>
  )
}
