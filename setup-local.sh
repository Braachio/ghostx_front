#!/bin/bash

# 로컬 개발 환경 설정 스크립트
echo "🚀 GhostX 로컬 개발 환경 설정"
echo "================================"

# .env.local 파일 생성
if [ ! -f .env.local ]; then
    echo "📝 .env.local 파일을 생성합니다..."
    cat > .env.local << 'EOF'
# 로컬 개발 환경 변수
# Steam API 키 (https://steamcommunity.com/dev/apikey 에서 발급)
STEAM_WEB_API_KEY=your_steam_api_key_here

# Supabase 설정 (프로젝트 설정에서 확인)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# 사이트 URL (로컬 개발용)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 갤로그 인증용 (선택사항)
DCINSIDE_SESSION_COOKIE=your_session_cookie_here

# 개발 환경 설정
NODE_ENV=development
EOF
    echo "✅ .env.local 파일이 생성되었습니다."
else
    echo "⚠️  .env.local 파일이 이미 존재합니다."
fi

echo ""
echo "📋 다음 단계를 따라 설정을 완료하세요:"
echo ""
echo "1. Steam API 키 발급:"
echo "   - https://steamcommunity.com/dev/apikey 방문"
echo "   - Steam 계정으로 로그인"
echo "   - 도메인 이름: localhost"
echo "   - API 키를 .env.local의 STEAM_WEB_API_KEY에 설정"
echo ""
echo "2. Supabase 설정:"
echo "   - https://supabase.com 프로젝트 생성"
echo "   - 프로젝트 설정 > API에서 값들 복사"
echo "   - .env.local의 Supabase 관련 변수들에 설정"
echo ""
echo "3. 개발 서버 실행:"
echo "   npm run dev"
echo ""
echo "4. 브라우저에서 http://localhost:3000 접속"
echo ""
echo "🔧 환경 변수 설정 후 개발 서버를 재시작하세요!"
