-- profiles 테이블에 갤로그 정보 필드 추가
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gallery_nickname TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gallery_gallog_id TEXT;

-- 빵장 신청 시스템을 위한 테이블 생성
CREATE TABLE IF NOT EXISTS event_manager_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gallery_nickname TEXT NOT NULL,
  gallery_gallog_id TEXT NOT NULL,
  gallery_verification_code TEXT NOT NULL,
  gallery_verified BOOLEAN DEFAULT FALSE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_event_manager_applications_user_id ON event_manager_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_manager_applications_status ON event_manager_applications(status);
CREATE INDEX IF NOT EXISTS idx_event_manager_applications_created_at ON event_manager_applications(created_at);

-- RLS 정책 설정
ALTER TABLE event_manager_applications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 신청서만 조회 가능
CREATE POLICY "Users can view their own applications" ON event_manager_applications
  FOR SELECT USING (auth.uid() = user_id);

-- 사용자는 자신의 신청서만 생성 가능
CREATE POLICY "Users can create their own applications" ON event_manager_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 사용자는 자신의 신청서만 수정 가능 (pending 상태일 때만)
CREATE POLICY "Users can update their own pending applications" ON event_manager_applications
  FOR UPDATE USING (auth.uid() = user_id AND status = 'pending');

-- 관리자는 모든 신청서 조회 가능
CREATE POLICY "Admins can view all applications" ON event_manager_applications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'event_manager')
    )
  );

-- 관리자는 모든 신청서 수정 가능
CREATE POLICY "Admins can update all applications" ON event_manager_applications
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'event_manager')
    )
  );

-- 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_manager_applications_updated_at 
  BEFORE UPDATE ON event_manager_applications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
