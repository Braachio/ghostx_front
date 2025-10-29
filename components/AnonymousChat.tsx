'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface ChatMessage {
  id: string
  nickname: string
  message: string
  timestamp: Date
  color: string
}

interface AnonymousChatProps {
  eventId: string
}

// 사용자 색상 생성 (컴포넌트 외부로 이동)
const colors = [
  'text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400',
  'text-purple-400', 'text-pink-400', 'text-cyan-400', 'text-orange-400'
]

// 최대 메시지 개수 제한 (메모리 관리)
const MAX_MESSAGES = 200

export default function AnonymousChat({ eventId }: AnonymousChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [nickname, setNickname] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [userColor, setUserColor] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const loadMessages = useCallback(async () => {
    try {
      // 최신 100개만 로드
      const response = await fetch(`/api/chat/${eventId}?limit=100`)
      if (response.ok) {
        const apiMessages = await response.json()
        const formattedMessages: ChatMessage[] = apiMessages.map((msg: { id: string; nickname: string; message: string; created_at: string; color: string }) => ({
          id: msg.id,
          nickname: msg.nickname,
          message: msg.message,
          timestamp: new Date(msg.created_at),
          color: msg.color
        }))
        setMessages(formattedMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('메시지 로드 중 오류:', error)
      setMessages([])
    }
  }, [eventId])

  // 실시간 채팅 연결
  const connectRealtimeChat = useCallback(() => {
    if (!isJoined) return

    // 기존 연결이 있으면 닫기
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // 재연결 타임아웃 초기화
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    const eventSource = new EventSource(`/api/chat/${eventId}/stream`)
    eventSourceRef.current = eventSource
    
    eventSource.onopen = () => {
      setIsConnected(true)
      reconnectAttemptsRef.current = 0 // 연결 성공 시 재시도 횟수 초기화
    }

    eventSource.onmessage = (event) => {
      try {
        // Keepalive 메시지 무시
        if (event.data.trim() === '') return

        const data = JSON.parse(event.data)
        
        if (data.type === 'connected') {
          // 연결 확인 메시지
        } else if (data.type === 'message') {
          const newMsg: ChatMessage = {
            id: data.data.id,
            nickname: data.data.nickname,
            message: data.data.message,
            timestamp: new Date(data.data.created_at),
            color: data.data.color
          }
          
          setMessages(prev => {
            // 중복 메시지 방지
            if (prev.some(msg => msg.id === newMsg.id)) {
              return prev
            }
            // 최대 메시지 개수 제한 (오래된 메시지 제거)
            const updated = [...prev, newMsg]
            if (updated.length > MAX_MESSAGES) {
              return updated.slice(-MAX_MESSAGES)
            }
            return updated
          })
        }
      } catch (error) {
        // JSON 파싱 오류 무시 (keepalive 등)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
      eventSourceRef.current = null

      // Exponential backoff로 재연결 시도
      if (isJoined && reconnectAttemptsRef.current < maxReconnectAttempts) {
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000)
        reconnectAttemptsRef.current++
        
        reconnectTimeoutRef.current = setTimeout(() => {
          if (isJoined) {
            connectRealtimeChat()
          }
        }, delay)
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
  }, [eventId, isJoined])

  useEffect(() => {
    // 저장된 닉네임과 색상 확인
    const savedNickname = localStorage.getItem(`chat_nickname_${eventId}`)
    const savedColor = localStorage.getItem(`chat_color_${eventId}`)
    
    if (savedNickname) {
      setNickname(savedNickname)
      setUserColor(savedColor || colors[0])
      setIsJoined(true)
    } else {
      // 닉네임을 빈 문자열로 시작 (사용자가 직접 입력)
      setNickname('')
      setUserColor(colors[Math.floor(Math.random() * colors.length)])
    }

    // 기존 메시지 로드 (실제로는 API에서 가져올 예정)
    loadMessages()
  }, [eventId, loadMessages])

  // 자동 스크롤 기능 제거 - 사용자가 직접 스크롤 제어

  // 실시간 채팅 연결 관리
  useEffect(() => {
    if (isJoined) {
      const cleanup = connectRealtimeChat()
      return () => {
        cleanup()
        // 컴포넌트 언마운트 시 모든 리소스 정리
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current)
        }
      }
    }
  }, [isJoined, connectRealtimeChat])

  const joinChat = () => {
    setIsJoined(true)
    localStorage.setItem(`chat_nickname_${eventId}`, nickname)
    localStorage.setItem(`chat_color_${eventId}`, userColor)
    
    // 입장 메시지 추가
    const joinMessage: ChatMessage = {
      id: Date.now().toString(),
      nickname: '시스템',
      message: `${nickname}님이 채팅에 참여했습니다!`,
      timestamp: new Date(),
      color: 'text-gray-400'
    }
    setMessages(prev => [...prev, joinMessage])
  }

  const sendMessage = async () => {
    if (newMessage.trim() && isJoined) {
      const messageText = newMessage.trim()
      setNewMessage('')

      try {
        // API로 메시지 전송
        const response = await fetch(`/api/chat/${eventId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nickname,
            message: messageText,
            color: userColor
          })
        })

        if (response.ok) {
          const sentMessage = await response.json()
          const formattedMessage: ChatMessage = {
            id: sentMessage.id,
            nickname: sentMessage.nickname,
            message: sentMessage.message,
            timestamp: new Date(sentMessage.created_at),
            color: sentMessage.color
          }
          // SSE를 통해 메시지가 자동으로 추가되므로 여기서는 추가하지 않음
        } else {
          // 전송 실패 시 사용자에게 알림
          setNewMessage(messageText) // 입력 메시지 복원
        }
      } catch (error) {
        console.error('메시지 전송 중 오류:', error)
        setNewMessage(messageText) // 입력 메시지 복원
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isJoined) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-black border border-pink-500/30 rounded-xl p-6 shadow-2xl shadow-pink-500/10">
        <h3 className="text-lg font-bold text-white mb-4">💬 익명 채팅 참여</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              닉네임
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-400">
              💡 F1 25의 경우 인게임 닉네임과 동일하게 입력하세요
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              닉네임 색상
            </label>
            <div className="flex flex-wrap gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setUserColor(color)}
                  className={`px-3 py-1 rounded-lg border-2 transition-all ${
                    userColor === color
                      ? 'border-pink-400 bg-pink-500/20'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <span className={`text-sm font-medium ${color}`}>색상</span>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={joinChat}
            disabled={!nickname.trim()}
            className="w-full px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚀 채팅 참여하기
          </button>
        </div>
      </div>
    )
  }

  // 채팅 참여자 목록 추출 (중복 제거, 메모이제이션)
  const uniqueParticipants = useMemo(() => {
    return Array.from(
      new Set(messages.map(msg => msg.nickname).filter(nick => nick !== '시스템'))
    )
  }, [messages])

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black border border-pink-500/30 rounded-xl p-6 shadow-2xl shadow-pink-500/10">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-white">💬 익명 채팅</h3>
          <span className="px-2 py-1 bg-pink-600/20 text-pink-300 rounded-full text-xs font-medium">
            {uniqueParticipants.length}명
          </span>
          {/* 연결 상태 표시 */}
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-xs text-gray-400">
              {isConnected ? '실시간 연결됨' : '연결 중...'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${userColor.replace('text-', 'bg-')}`}></div>
            <span className={`text-sm font-medium ${userColor}`}>{nickname}</span>
          </div>
          <button
            onClick={() => window.open(`/chat/${eventId}`, '_blank', 'width=1200,height=800')}
            className="px-3 py-1 bg-cyan-600/20 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition-all text-sm"
          >
            🪟 새 탭
          </button>
        </div>
      </div>

      {/* 채팅 참여자 목록 */}
      {uniqueParticipants.length > 0 && (
        <div className="mb-3 p-3 bg-gray-800/50 rounded-lg">
          <div className="text-xs text-gray-400 mb-2">💬 채팅 참여자 ({uniqueParticipants.length}명)</div>
          <div className="flex flex-wrap gap-2">
            {uniqueParticipants.map((participantNick, index) => {
              const participantColor = messages.find(m => m.nickname === participantNick)?.color || 'text-gray-400'
              return (
                <span key={index} className={`text-xs px-2 py-1 bg-gray-700/50 rounded ${participantColor}`}>
                  {participantNick}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* 채팅 메시지 영역 */}
      <div className="h-96 overflow-y-auto bg-gray-800/50 rounded-lg p-4 mb-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            아직 메시지가 없습니다. 첫 메시지를 보내보세요!
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium ${msg.color}`}>
                  {msg.nickname}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-2 text-white text-sm whitespace-pre-wrap break-words">
                {msg.message}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 메시지 입력 영역 */}
      <div className="flex gap-2">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          rows={2}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
          maxLength={200}
        />
        <button
          onClick={sendMessage}
          disabled={!newMessage.trim()}
          className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          전송
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        💡 Enter로 전송, Shift+Enter로 줄바꿈
      </div>
    </div>
  )
}
