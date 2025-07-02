// app/track/[track]/sector/[sector]/page.tsx
import SectorRanking from '@/components/SectorRanking'

export default async function SectorPage({
  params,
}: {
  params: { track: string; sector: string }
}) {
  const { track, sector } = params
  const sectorNumber = parseInt(sector, 10)

  if (isNaN(sectorNumber)) {
    return <div>❌ 유효하지 않은 섹터 번호입니다.</div>
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <SectorRanking track={track} sector={sectorNumber} />
    </div>
  )
}
