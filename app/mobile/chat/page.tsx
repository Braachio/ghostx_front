'use client'

import MobileChat from '@/components/mobile/MobileChat'

export default function MobileChatPage() {
  // MobileChat handles auth and presence internally; user can be null
  return (
    <div className="fixed inset-0 bg-gray-900" style={{ height: '100vh', height: '100dvh' }}>
      <MobileChat user={null} language="ko" />
    </div>
  )
}
