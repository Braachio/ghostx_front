# 🚀 배포 가이드 (Vercel)

## 📋 필수 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수들을 설정해야 합니다:

### 🔐 Supabase 설정
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 🌐 사이트 URL
```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

### 🎮 Steam API (선택사항)
```bash
STEAM_WEB_API_KEY=your-steam-web-api-key
```

## 🗄️ 데이터베이스 마이그레이션

### 1. Supabase 대시보드 접속
- [Supabase Dashboard](https://app.supabase.com) 로그인
- 프로젝트 선택

### 2. SQL Editor에서 마이그레이션 실행

#### 기본 마이그레이션 (이미 실행했다면 스킵)
```sql
-- DATABASE_MIGRATION.sql 내용 실행
```

#### 이벤트 날짜 마이그레이션 (이미 실행했다면 스킵)
```sql
-- DATABASE_MIGRATION_EVENT_DATE.sql 내용 실행
```

#### ⭐ 이벤트 템플릿 마이그레이션 (새로 추가됨)
```sql
-- DATABASE_MIGRATION_EVENT_TEMPLATES.sql 내용 실행
```

### 3. 테이블 확인
다음 테이블들이 생성되었는지 확인:
- `multis` (기존 테이블에 새 컬럼 추가)
- `event_templates` (새 테이블)

## 🎯 Vercel 배포 설정

### 1. Vercel 프로젝트 연결
```bash
# Vercel CLI 설치 (선택사항)
npm i -g vercel

# 프로젝트 배포
vercel --prod
```

### 2. 환경 변수 설정
Vercel 대시보드 → Project Settings → Environment Variables에서 설정

### 3. 빌드 설정 확인
- **Framework Preset**: Next.js
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

## 🔧 추가 설정

### 1. 도메인 설정 (선택사항)
- Vercel 대시보드 → Domains
- 커스텀 도메인 추가

### 2. 환경별 설정
- **Production**: 모든 환경 변수 설정
- **Preview**: Production과 동일한 설정 권장
- **Development**: 로컬 개발용 (선택사항)

## 🧪 배포 후 테스트

### 1. 기본 기능 테스트
- [ ] 메인 페이지 로딩
- [ ] 로그인/회원가입
- [ ] 이벤트 목록 표시
- [ ] 이벤트 등록/수정

### 2. 새 기능 테스트
- [ ] 이벤트 타입별 필터링
- [ ] 관리자 페이지 접근
- [ ] 이벤트 템플릿 관리
- [ ] 자동 상태 정리

### 3. 관리자 기능 테스트
- [ ] `/admin` 페이지 접근
- [ ] `/admin/event-templates` 템플릿 관리
- [ ] `/admin/flash-events` 기습 이벤트 관리
- [ ] `/admin/cleanup-events` 수동 정리
- [ ] `/admin/schedule` 스케줄 뷰

## 🚨 문제 해결

### 빌드 실패 시
1. **환경 변수 누락 확인**
2. **TypeScript 오류 확인**
3. **의존성 문제 확인**

### 런타임 오류 시
1. **Supabase 연결 확인**
2. **데이터베이스 스키마 확인**
3. **API 엔드포인트 확인**

### 이벤트 정리 오류 시
1. **Supabase 권한 확인**
2. **데이터베이스 마이그레이션 확인**
3. **시간대 설정 확인**

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Vercel Function Logs
2. Supabase Database Logs
3. 브라우저 개발자 도구 Console

---

**배포 완료 후 `https://your-domain.vercel.app`에서 사이트 확인!** 🎉
