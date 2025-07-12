export default function PrivacyPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold mb-4">개인정보 수집 및 이용 안내</h1>

      <p>
        본 서비스는 아래와 같은 개인정보를 수집하며, 해당 정보는 오직 서비스 제공 및 품질 향상을 위한 목적으로만 사용됩니다.
      </p>

      <p className="font-semibold">📌 수집 항목</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>이메일 주소, 닉네임</li>
        <li>주행 분석 데이터 및 피드백 이력</li>
        <li>접속기록(IP), 쿠키, 브라우저 정보</li>
      </ul>

      <p className="font-semibold">📌 수집 목적</p>
      <ul className="list-disc list-inside space-y-1 ml-4">
        <li>회원 식별 및 계정 관리</li>
        <li>AI 피드백 제공 및 개인화 분석</li>
        <li>통계 분석 및 서비스 개선</li>
      </ul>

      <p>
        모든 개인정보는 보안적으로 안전하게 저장되며, 사용자는 언제든지 자신의 정보 삭제를 요청할 수 있습니다.
      </p>
    </div>
  )
}
