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
  const [selectedGame, setSelectedGame] = useState('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
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
        setMessages(formattedMessages)
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
    const nickname = user?.nickname || 'Anonymous'
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
    setMessageText('')

    try {
      const response = await fetch(`/api/chat/game/${selectedGame}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nickname,
          message: messageText,
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
      }
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      setMessages(prev => prev.filter(msg => msg.id !== tempId))
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

  // 스크롤을 맨 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
    <div className="bg-gray-900 rounded-2xl overflow-hidden h-[600px] flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-white">{t[language].chat}</h3>
            <select
              value={selectedGame}
              onChange={(e) => setSelectedGame(e.target.value)}
              className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600"
            >
              <option value="all">{t[language].allGames}</option>
              <option value="iracing">iRacing</option>
              <option value="assetto-corsa">Assetto Corsa</option>
              <option value="f1-23">F1 23</option>
              <option value="gran-turismo">Gran Turismo</option>
            </select>
          </div>
          <button
            onClick={() => setShowParticipants(true)}
            className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {onlineParticipants.length}
          </button>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

      {/* 입력 영역 */}
      <div className="bg-gray-800 px-4 py-3 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={t[language].sendMessage}
            className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
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
    </div>
  )
}
