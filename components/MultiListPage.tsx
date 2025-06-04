"use client"

import { useEffect, useState } from 'react'
import MultiCard from './MultiCard'
import type { Database } from '@/lib/database.types'

type Multi = Database['public']['Tables']['multis']['Row']

export default function MultiListPage({
  simplified = false,
  currentUserId = null,
}: {
  simplified?: boolean
  currentUserId?: string | null
}) {
  const [grouped, setGrouped] = useState<Record<string, Multi[]>>({})

  useEffect(() => {
    const fetchMultis = async () => {
      const res = await fetch('/api/multis')
      const data: Multi[] = await res.json()

      const groupedByGame: Record<string, Multi[]> = {}
      data.forEach((multi) => {
        if (!groupedByGame[multi.game]) {
          groupedByGame[multi.game] = []
        }
        groupedByGame[multi.game].push(multi)
      })

      setGrouped(groupedByGame)
    }

    fetchMultis()
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {Object.keys(grouped).length === 0 ? (
        <p className="text-gray-500">등록된 공지가 없습니다.</p>
      ) : (
        Object.entries(grouped).map(([game, notices]) => (
          <div key={game} className="mb-10">
            <h2 className="text-xl font-semibold mb-4 border-b pb-1">{game}</h2>
            <ul className="space-y-4">
              {notices.map((multi) => (
                <li key={multi.id}>
                  <MultiCard multi={multi} currentUserId={currentUserId} />
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  )
}
