'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// 최대 메시지 개수 제한 (메모리 관리)
const MAX_MESSAGES = 200

interface ChatMessage {
  id: string
  nickname: string
  message: string
  timestamp: Date
  color: string
}

export default function ChatPage() {
  const params = useParams()
  const eventId = params?.eventId as string
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [nickname, setNickname] = useState('')
  const [isJoined, setIsJoined] = useState(false)
  const [userColor, setUserColor] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5

  const colors = useMemo(() => [
    'text-red-400', 'text-blue-400', 'text-green-400', 'text-yellow-400',
    'text-purple-400', 'text-pink-400', 'text-cyan-400', 'text-orange-400'
  ], [])

  const generateTag = useCallback(() => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }, [])

  const generateNickname = useCallback(() => {
    return `ㅇㅇ#${generateTag()}`
  }, [generateTag])

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    const savedNickname = localStorage.getItem(`chat_nickname_${eventId}`)
    const savedColor = localStorage.getItem(`chat_color_${eventId}`)
    
    if (savedNickname) {
      setNickname(savedNickname)
      setUserColor(savedColor || colors[0])
      setIsJoined(true)
    } else {
      setNickname(generateNickname())
      setUserColor(colors[Math.floor(Math.random() * colors.length)])
    }

    loadMessages()
  }, [eventId, colors, generateNickname, loadMessages])

  // 닉네임 동기화: 전역 닉네임(localStorage) 또는 /api/me 기반
  useEffect(() => {
    const syncNickname = async () => {
      try {
        const stored = typeof window !== 'undefined' ? localStorage.getItem('global_nickname') : null
        if (stored && stored.trim()) {
          setNickname(stored)
          return
        }
        const res = await fetch('/api/me')
        if (res.ok) {
          const { user: me } = await res.json()
          if (me?.nickname) {
            setNickname(me.nickname)
            try { localStorage.setItem('global_nickname', me.nickname) } catch {}
          }
        }
      } catch {}
    }
    syncNickname()
  }, [])

  // 실시간 채팅 연결
  const connectRealtimeChat = useCallback(() => {
    if (!isJoined) return

    // 기존 연결이 있으면 닫기
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    const eventSource = new EventSource(`/api/chat/${eventId}/stream`)
    eventSourceRef.current = eventSource
    
    eventSource.onopen = () => {
      setIsConnected(true)
      reconnectAttemptsRef.current = 0
    }

    eventSource.onmessage = (event) => {
      try {
        if (event.data.trim() === '') return
        
        const data = JSON.parse(event.data)
        
        if (data.type === 'message') {
          const newMsg: ChatMessage = {
            id: data.data.id,
            nickname: data.data.nickname,
            message: data.data.message,
            timestamp: new Date(data.data.created_at),
            color: data.data.color
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
      } catch {
        // JSON 파싱 오류 무시
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
      eventSourceRef.current = null

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
    if (isJoined) {
      const cleanup = connectRealtimeChat()
      return () => {
        cleanup()
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

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const joinChat = () => {
    setIsJoined(true)
    localStorage.setItem(`chat_nickname_${eventId}`, nickname)
    localStorage.setItem(`chat_color_${eventId}`, userColor)
    
    const joinMessage: ChatMessage = {
      id: Date.now().toString(),
      nickname: '시스템',
      message: `${nickname}님이 채팅에 참여했습니다!`,
      timestamp: new Date(),
      color: 'text-gray-400'
    }
          setMessages(prev => {
            const updated = [...prev, joinMessage]
            if (updated.length > MAX_MESSAGES) {
              return updated.slice(-MAX_MESSAGES)
            }
            return updated
          })
  }

  const sendMessage = async () => {
    if (newMessage.trim() && isJoined) {
      const messageText = newMessage.trim()
      setNewMessage('')

      try {
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
          // SSE를 통해 메시지가 자동으로 추가됨
        } else {
          setNewMessage(messageText) // 전송 실패 시 메시지 복원
        }
      } catch (error) {
        console.error('메시지 전송 실패:', error)
        setNewMessage(messageText) // 전송 실패 시 메시지 복원
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-pink-500/30 rounded-xl p-8 shadow-2xl max-w-md w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">💬 익명 채팅 참여</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                닉네임
              </label>
              <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg border border-gray-600">
                <div>
                  <div className={`font-medium ${userColor}`}>{nickname}</div>
                </div>
                <div className="text-cyan-400 text-sm">🎮</div>
              </div>
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
              className="w-full px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all font-medium text-lg"
            >
              🚀 채팅 참여하기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-pink-500/30 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">💬 익명 채팅</h1>
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
              onClick={() => window.close()}
              className="px-3 py-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all text-sm"
            >
              ✕ 닫기
            </button>
          </div>
        </div>
      </div>

      {/* 채팅 영역 */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-6xl w-full mx-auto p-4">
        <div className="flex-1 overflow-y-auto bg-gray-800/50 rounded-lg p-4 mb-4 space-y-3">
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
                <div className="bg-gray-700/50 rounded-lg p-3 text-white">
                  {msg.message}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 메시지 입력 영역 */}
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요..."
              className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              maxLength={200}
              autoFocus
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg hover:from-pink-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              전송
            </button>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            💡 Enter로 전송, Shift+Enter로 줄바꿈
          </div>
        </div>
      </div>
    </div>
  )
}
