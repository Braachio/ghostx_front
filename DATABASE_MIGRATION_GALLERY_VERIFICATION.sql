-- 갤로그 인증 코드 저장 테이블
CREATE TABLE IF NOT EXISTS gallery_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gallery_nickname TEXT NOT NULL,
  verification_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_gallery_verification_codes_user_id ON gallery_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_verification_codes_code ON gallery_verification_codes(verification_code);
CREATE INDEX IF NOT EXISTS idx_gallery_verification_codes_expires_at ON gallery_verification_codes(expires_at);

-- RLS 정책 설정
ALTER TABLE gallery_verification_codes ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 인증 코드만 조회 가능
CREATE POLICY "Users can view their own verification codes" ON gallery_verification_codes
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 인증 코드만 생성 가능
CREATE POLICY "Users can create their own verification codes" ON gallery_verification_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 만료된 인증 코드 자동 삭제를 위한 함수
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM gallery_verification_codes 
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 만료된 인증 코드 정리 (매일 실행)
-- 실제 운영에서는 pg_cron 확장을 사용하여 스케줄링
