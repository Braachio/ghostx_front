export default function CookiesPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 text-sm leading-relaxed">
      <h1 className="text-2xl font-bold mb-4">쿠키 사용 안내</h1>

      <p>
        Ghost-X는 사용자 경험 개선과 분석 기능 강화를 위해 최소한의 쿠키를 사용합니다. 쿠키는 사용자의 브라우저에 저장되며, 웹사이트 이용을 보다 원활하게 돕습니다.
      </p>

      <p className="font-semibold">📌 사용 중인 쿠키 유형</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>필수 쿠키:</strong> 로그인 상태 유지, 보안 토큰 저장 등 서비스 운영에 반드시 필요한 쿠키
        </li>
        <li>
          <strong>성능 쿠키:</strong> 방문자 수, 페이지 반응 속도 등의 통계 분석을 위한 익명 데이터 수집
        </li>
      </ul>

      <p className="font-semibold">📌 쿠키 거부 및 설정</p>
      <p>
        사용자는 브라우저 설정을 통해 쿠키 저장을 거부하거나 삭제할 수 있습니다. 다만, 필수 쿠키를 차단할 경우 일부 기능이 정상적으로 작동하지 않을 수 있습니다.
      </p>

      <p className="text-xs text-gray-500 mt-4">
        본 안내는 사전 고지 없이 변경될 수 있으며, 변경 사항은 본 페이지를 통해 공지됩니다.
      </p>
    </div>
  )
}
