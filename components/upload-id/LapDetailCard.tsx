'use client'
import React, { useState } from 'react'
import type { LapMeta } from '@/types/upload'

interface Props {
  lapList: LapMeta[]
  selectedLapId: string
  setLapList: React.Dispatch<React.SetStateAction<LapMeta[]>>
}


export default function LapDetailCard({ lapList, selectedLapId, setLapList }: Props) {
  const [newName, setNewName] = useState('')
  const [updating, setUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const handleSaveName = async (lapId: string, name: string) => {
    setUpdating(true)
    try {
      const res = await fetch('/api/update-lap-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lap_id: lapId, display_name: name }),
      })

      if (!res.ok) {
        console.error('이름 업데이트 실패')
        return
      }

      setLapList(prev => prev.map(lap => (lap.id === lapId ? { ...lap, display_name: name } : lap)))
      setIsEditing(false)
      setNewName('')
    } catch (err) {
      console.error('저장 중 오류:', err)
    } finally {
      setUpdating(false)
    }
  }

  const selected = lapList.find(l => l.id === selectedLapId)
  if (!selected) return null

  return (
    <div className="border border-gray-600 p-4 rounded bg-gray-800 w-full max-w-[500px]">
      <div className="flex items-center justify-between mb-4">
        <div className="font-medium text-lg text-white">
          {selected.display_name
            ? `${selected.display_name} (${selected.track} - ${selected.car})`
            : `${selected.track} - ${selected.car}`}
        </div>
        <button
          onClick={() => {
            setIsEditing(!isEditing)
            setNewName(selected.display_name || '')
          }}
          className="text-sm text-blue-400 hover:underline"
        >
          {isEditing ? '취소' : '이름 수정'}
        </button>
      </div>

      {isEditing && (
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="새 이름 입력"
            className="flex-1 border border-gray-600 bg-gray-700 text-white px-2 py-1 rounded text-sm"
          />
          <button
            onClick={() => handleSaveName(selected.id, newName)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
            disabled={updating}
          >
            💾 저장
          </button>
        </div>
      )}

      <div className="flex justify-between items-start flex-wrap gap-2 mt-2">
        <div className="text-base text-white">
          🕒 랩타임: {formatLapTime(selected.lap_time ?? 0)}
        </div>
        <div className="text-sm text-gray-300">
          업로드일: {new Date(selected.created_at).toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function formatLapTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = (seconds % 60).toFixed(3)
  return `${mins}:${secs.padStart(6, '0')}`
}
