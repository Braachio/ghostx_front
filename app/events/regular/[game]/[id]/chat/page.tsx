'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { initializeGameNickname, getGameNickname, setGameNickname } from '@/lib/steamProfile'

interface ChatMessage {
  id: string
  message: string
  nickname: string
  color: string
  created_at: string
}

interface ChatPageProps {
  params: Promise<{ game: string; id: string }>
}

export default function ChatPage({ params }: ChatPageProps) {
  const [game, setGame] = useState<string>('')
  const [eventId, setEventId] = useState<string>('')
  const [eventTitle, setEventTitle] = useState<string>('')
  const [gameDisplayName, setGameDisplayName] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [nickname, setNickname] = useState('')
  const [color, setColor] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isEditingNickname, setIsEditingNickname] = useState(false)

  // 색상 옵션들
  const colorOptions = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7',
    '#dda0dd', '#98d8c8', '#f7dc6f', '#bb8fce', '#85c1e9'
  ]

  useEffect(() => {
    const loadParams = async () => {
      const resolvedParams = await params
      setGame(resolvedParams.game)
      setEventId(resolvedParams.id)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (eventId && game) {
      loadEventInfo()
      loadMessages()
      initializeNickname()
      
      // 로컬 스토리지에서 색상 불러오기
      const savedColor = localStorage.getItem('chat_color')
      if (savedColor) setColor(savedColor)
    }
  }, [eventId, game])

  const initializeNickname = async () => {
    if (!game) return
    
    try {
      const gameNickname = await initializeGameNickname(game)
      setNickname(gameNickname)
    } catch (error) {
      console.error('닉네임 초기화 실패:', error)
      setNickname(`게스트_${Math.floor(Math.random() * 9999)}`)
    }
  }

  // 로컬 스토리지 변경 감지 (다른 탭에서 메시지 전송 시)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === `chat_${eventId}`) {
        loadMessages()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [eventId])

  const loadEventInfo = async () => {
    try {
      const response = await fetch('/api/multis')
      if (response.ok) {
        const data = await response.json()
        const event = data.find((e: any) => e.id === eventId)
        if (event) {
          setEventTitle(event.title)
          setGameDisplayName(event.game)
        }
      }
    } catch (error) {
      console.error('이벤트 정보 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = () => {
    try {
      const savedMessages = localStorage.getItem(`chat_${eventId}`)
      if (savedMessages) {
        const parsedMessages = JSON.parse(savedMessages)
        setMessages(parsedMessages)
      } else {
        setMessages([])
      }
    } catch (error) {
      console.error('메시지 로드 중 오류:', error)
      setMessages([])
    }
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !nickname.trim()) return

    setIsLoading(true)
    
    try {
      // 게임별 닉네임과 색상 저장
      if (game) {
        setGameNickname(game, nickname)
      }
      localStorage.setItem('chat_color', color)

      // 새 메시지 생성
      const newMsg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        message: newMessage.trim(),
        nickname: nickname.trim(),
        color: color || colorOptions[0],
        created_at: new Date().toISOString()
      }

      // 기존 메시지에 새 메시지 추가
      const updatedMessages = [...messages, newMsg]
      
      // 최대 100개 메시지만 유지 (메모리 절약)
      const trimmedMessages = updatedMessages.slice(-100)
      
      // 로컬 스토리지에 저장
      localStorage.setItem(`chat_${eventId}`, JSON.stringify(trimmedMessages))
      
      // 상태 업데이트
      setMessages(trimmedMessages)
      setNewMessage('')
      
      // 다른 탭에 변경 알림
      window.dispatchEvent(new StorageEvent('storage', {
        key: `chat_${eventId}`,
        newValue: JSON.stringify(trimmedMessages)
      }))
      
    } catch (error) {
      console.error('메시지 전송 중 오류:', error)
      alert('메시지 전송 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleNicknameSave = () => {
    if (nickname.trim() && game) {
      setGameNickname(game, nickname.trim())
      setIsEditingNickname(false)
    }
  }

  const handleNicknameCancel = () => {
    if (game) {
      const savedNickname = getGameNickname(game)
      if (savedNickname) {
        setNickname(savedNickname)
      }
    }
    setIsEditingNickname(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-purple-400 text-xl">💬 채팅방을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-900/95 border-b border-gray-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              💬 익명 채팅
            </h1>
            <p className="text-gray-400 text-sm">{eventTitle}</p>
            <div className="mt-1 px-2 py-1 bg-blue-900/30 border border-blue-500/30 rounded text-xs text-blue-300">
              💡 최적 경험을 위해 Chrome 브라우저 사용을 권장합니다
            </div>
            <div className="mt-1 px-2 py-1 bg-green-900/30 border border-green-500/30 rounded text-xs text-green-300">
              🎮 {gameDisplayName} 전용 닉네임으로 채팅합니다
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href={`/events/regular/${game}/${eventId}`}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              ← 이벤트로 돌아가기
            </Link>
            <button
              onClick={() => window.close()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              창 닫기
            </button>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-16">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">첫 번째 메시지를 작성해보세요!</h3>
              <p className="text-gray-400 mb-4">익명으로 자유롭게 소통하세요 🚀</p>
              <div className="max-w-md mx-auto p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  📌 <strong>브라우저별 채팅 기록</strong><br/>
                  채팅 기록은 브라우저별로 다르게 저장됩니다.<br/>
                  최적의 경험을 위해 Chrome 사용을 권장합니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0"
                    style={{ backgroundColor: msg.color }}
                  >
                    {msg.nickname.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-white" style={{ color: msg.color }}>
                        {msg.nickname}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.created_at).toLocaleString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 입력 영역 */}
      <div className="bg-gray-900/95 border-t border-gray-700 p-4">
        <div className="max-w-4xl mx-auto">
          {/* 닉네임 설정/편집 영역 */}
          <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-300">
                🎮 {gameDisplayName} 닉네임
              </h3>
              {!isEditingNickname && (
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs transition-colors"
                >
                  편집
                </button>
              )}
            </div>
            
            {isEditingNickname ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="인게임 닉네임을 입력하세요"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none text-sm"
                  maxLength={20}
                  autoFocus
                />
                <button
                  onClick={handleNicknameSave}
                  className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={handleNicknameCancel}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                >
                  취소
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{nickname}</span>
                <span className="text-xs text-gray-400">
                  (방장이 식별하기 쉬운 닉네임으로 설정하세요)
                </span>
              </div>
            )}
          </div>

          {/* 색상 선택 */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              💬 메시지 색상
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            >
              <option value="">색상 선택</option>
              {colorOptions.map((colorOption, index) => (
                <option key={index} value={colorOption}>
                  색상 {index + 1}
                </option>
              ))}
            </select>
          </div>
          
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="메시지를 입력하세요 (Shift+Enter로 줄바꿈)"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
              rows={3}
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || !nickname.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {isLoading ? '전송중...' : '전송'}
            </button>
          </form>
          
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <span>Shift + Enter로 줄바꿈, Enter로 전송</span>
            <span>{newMessage.length}/500</span>
          </div>
        </div>
      </div>
    </div>
  )
}
