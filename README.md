This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## 🚀 로컬 개발 환경 설정

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```bash
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
```

### 2. Steam API 키 발급

1. [Steam Web API Key](https://steamcommunity.com/dev/apikey) 페이지 방문
2. Steam 계정으로 로그인
3. 도메인 이름 입력 (로컬 개발용: `localhost`)
4. API 키 복사하여 `STEAM_WEB_API_KEY`에 설정

### 3. Supabase 설정

1. [Supabase](https://supabase.com) 프로젝트 생성
2. 프로젝트 설정 > API에서 다음 값들 복사:
   - `NEXT_PUBLIC_SUPABASE_URL`: Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: anon public key
   - `SUPABASE_SERVICE_ROLE_KEY`: service_role secret key

### 4. 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
