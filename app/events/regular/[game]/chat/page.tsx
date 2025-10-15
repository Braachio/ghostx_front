'use client'

import { useEffect, useState } from 'react'

interface GameChatPageProps {
  params: Promise<{ game: string }>
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

export default function GameChatPage({ params }: GameChatPageProps) {
  const [game, setGame] = useState<string>('')
  const [messages, setMessages] = useState<Array<{ id: string; nickname: string; message: string; color: string; timestamp: string }>>([])
  const [newMessage, setNewMessage] = useState('')
  const [nickname, setNickname] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [showSettings, setShowSettings] = useState(false)

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

  useEffect(() => {
    if (!game) return

    const gameName = gameNames[game] || game

    // 게임별 채팅 메시지 로드
    const chatKey = `game_chat_${gameName}`
    const savedMessages = localStorage.getItem(chatKey)
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }

    // 게임별 닉네임 로드
    const nicknameKey = `game_nickname_${gameName}`
    const savedNickname = localStorage.getItem(nicknameKey)
    if (savedNickname) {
      setNickname(savedNickname)
    }

    // 게임별 색상 로드
    const colorKey = `game_color_${gameName}`
    const savedColor = localStorage.getItem(colorKey)
    if (savedColor) {
      setColor(savedColor)
    }

    // StorageEvent 리스너 (다른 탭에서의 변경사항 감지)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === chatKey && e.newValue) {
        setMessages(JSON.parse(e.newValue))
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [game])

  const sendMessage = () => {
    if (!newMessage.trim() || !nickname.trim() || !game) return

    const gameName = gameNames[game] || game
    const message = {
      id: Date.now().toString(),
      nickname,
      message: newMessage.trim(),
      color,
      timestamp: new Date().toLocaleTimeString()
    }

    const updatedMessages = [...messages, message].slice(-50) // 최근 50개만 유지
    setMessages(updatedMessages)
    
    // localStorage에 저장
    const chatKey = `game_chat_${gameName}`
    localStorage.setItem(chatKey, JSON.stringify(updatedMessages))
    
    setNewMessage('')
  }

  const saveNickname = () => {
    if (nickname.trim() && game) {
      const gameName = gameNames[game] || game
      const nicknameKey = `game_nickname_${gameName}`
      localStorage.setItem(nicknameKey, nickname.trim())
    }
  }

  const saveColor = () => {
    if (game) {
      const gameName = gameNames[game] || game
      const colorKey = `game_color_${gameName}`
      localStorage.setItem(colorKey, color)
    }
  }

  const gameName = gameNames[game] || game

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white flex flex-col">
      {/* 헤더 */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">💬 {gameName} 채팅</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
            title="설정"
          >
            ⚙️
          </button>
        </div>
        <p className="text-gray-400 text-sm text-center mt-1">
          Chrome 브라우저 사용을 권장합니다. 채팅 기록은 브라우저별로 저장됩니다.
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
                <span className="text-gray-500 text-xs">{msg.timestamp}</span>
              </div>
              <p className="text-white text-sm whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))
        )}
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
                placeholder="닉네임을 입력하세요"
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
          💡 채팅 기록은 브라우저에 저장되며, 다른 탭과 실시간으로 동기화됩니다.
        </div>
      </div>
    </div>
  )
}
