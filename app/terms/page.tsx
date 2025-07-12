// ✅ /terms/page.tsx
export default function TermsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">이용약관</h1>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        본 서비스는 시뮬레이션 레이싱 주행 데이터를 기반으로 피드백을 제공하는 플랫폼입니다.
        사용자는 주행 데이터에 대한 권리를 보유하며, 본 서비스는 해당 데이터를 분석, 피드백 생성, 통계적 연구 및 향후 기능 개선을 위해 사용할 수 있습니다.

        이용자는 다음 행위를 해서는 안 됩니다:
        - 타인의 계정을 무단으로 사용하거나 명의를 도용하는 행위
        - 주행 데이터 또는 AI 피드백을 무단으로 복제, 배포, 상업적으로 사용하는 행위
        - 본 서비스의 운영을 방해하는 행위

        서비스는 사전 고지 없이 기능을 변경하거나 중단할 수 있으며, 서비스 이용에 따른 책임은 사용자 본인에게 있습니다.
      </p>
    </div>
  )
}
