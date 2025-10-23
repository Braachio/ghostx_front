import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 64,
  height: 64,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 32,
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 50%, #06b6d4 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '12px',
          fontWeight: '900',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        GX
      </div>
    ),
    {
      ...size,
    }
  )
}
