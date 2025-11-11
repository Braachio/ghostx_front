import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 12,
          background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 50%, #a855f7 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0f172a',
          borderRadius: '30%',
          fontWeight: 900,
          letterSpacing: '0.08em',
        }}
      >
        GPX
      </div>
    ),
    {
      ...size,
    }
  )
}
