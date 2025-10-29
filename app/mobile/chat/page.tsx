'use client'

import MobileChat from '@/components/mobile/MobileChat'

export default function MobileChatPage() {
  // MobileChat handles auth and presence internally; user can be null
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 text-white px-4 py-24">
      <div className="max-w-lg mx-auto">
        <MobileChat user={null} language="ko" />
      </div>
    </div>
  )
}
