'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/lib/database.types'

interface GameInterestModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
}

const GAME_OPTIONS = [
  { id: 'iracing', name: 'iRacing', icon: '🏁' },
  { id: 'assetto_corsa', name: 'Assetto Corsa', icon: '🏎️' },
  { id: 'assetto_corsa_competizione', name: 'Assetto Corsa Competizione', icon: '🏆' },
  { id: 'f1_2023', name: 'F1 2023', icon: '🏎️' },
  { id: 'f1_2024', name: 'F1 2024', icon: '🏎️' },
  { id: 'gran_turismo', name: 'Gran Turismo', icon: '🏁' },
  { id: 'forza_motorsport', name: 'Forza Motorsport', icon: '🏎️' },
  { id: 'forza_horizon', name: 'Forza Horizon', icon: '🌅' },
  { id: 'dirt_rally', name: 'Dirt Rally', icon: '🌲' },
  { id: 'project_cars', name: 'Project CARS', icon: '🏁' },
  { id: 'automobilista', name: 'Automobilista', icon: '🏎️' },
  { id: 'r_factor', name: 'rFactor 2', icon: '🏁' },
]

export default function GameInterestModal({ isOpen, onClose, onComplete }: GameInterestModalProps) {
  const [selectedGames, setSelectedGames] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient<Database>()

  const handleGameToggle = (gameId: string) => {
    setSelectedGames(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    )
  }

  const handleSave = async () => {
    if (selectedGames.length === 0) {
      setError('최소 하나의 게임을 선택해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 현재 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setError('사용자 정보를 가져올 수 없습니다.')
        return
      }

      // 관심게임 데이터 저장
      const { error: saveError } = await supabase
        .from('user_interest_games')
        .upsert(
          selectedGames.map(gameId => ({
            user_id: user.id,
            game_id: gameId,
            created_at: new Date().toISOString()
          })),
          { onConflict: 'user_id,game_id' }
        )

      if (saveError) {
        console.error('관심게임 저장 오류:', saveError)
        setError('관심게임 저장에 실패했습니다.')
        return
      }

      onComplete()
    } catch (err) {
      console.error('관심게임 설정 오류:', err)
      setError('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">관심 게임 설정</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <p className="text-gray-300 mb-6">
            어떤 레이싱 게임에 관심이 있으신가요?<br />
            선택한 게임의 멀티 이벤트를 추천해드립니다.
          </p>

          <div className="space-y-3 mb-6">
            {GAME_OPTIONS.map((game) => (
              <label
                key={game.id}
                className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedGames.includes(game.id)
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedGames.includes(game.id)}
                  onChange={() => handleGameToggle(game.id)}
                  className="sr-only"
                />
                <span className="text-2xl mr-3">{game.icon}</span>
                <span className="font-medium">{game.name}</span>
              </label>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-500 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
            >
              나중에 설정
            </button>
            <button
              onClick={handleSave}
              disabled={loading || selectedGames.length === 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
