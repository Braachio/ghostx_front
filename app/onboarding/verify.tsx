export default function VerifyEmailPage() {
  return (
    <div className="p-6 max-w-md mx-auto text-center">
      <h2 className="text-xl font-bold mb-4">📩 이메일 인증이 필요합니다</h2>
      <p>가입한 이메일 주소로 인증 메일이 전송되었습니다.</p>
      <p className="mt-2 text-gray-500">메일을 열어 ‘이메일 인증’을 완료해 주세요.</p>
    </div>
  )
}
