# Figma 디자인 시스템 가이드

이 문서는 ghostx 프로젝트를 위한 Figma 디자인 시스템 구축 가이드입니다.

## 📋 목차
1. [색상 팔레트](#색상-팔레트)
2. [타이포그래피](#타이포그래피)
3. [스페이싱 시스템](#스페이싱-시스템)
4. [컴포넌트 목록](#컴포넌트-목록)
5. [브레이크포인트](#브레이크포인트)
6. [Figma 설정 가이드](#figma-설정-가이드)

---

## 🎨 색상 팔레트

### Primary Colors (주요 색상)
프로젝트의 주요 브랜드 색상으로, 그라디언트와 강조에 사용됩니다.

#### Cyan (시안)
- **Cyan-400**: `#22D3EE` - 텍스트 강조, 호버 상태
- **Cyan-500**: `#06B6D4` - 테두리, 구분선
- **Cyan-600**: `#0891B2` - 버튼 배경
- **Cyan-700**: `#0E7490` - 버튼 호버

#### Blue (블루)
- **Blue-400**: `#60A5FA` - 텍스트 강조
- **Blue-500**: `#3B82F6` - 기본 액션
- **Blue-600**: `#2563EB` - 버튼 배경
- **Blue-700**: `#1D4ED8` - 버튼 호버

#### Purple (퍼플)
- **Purple-400**: `#A78BFA` - 텍스트 강조
- **Purple-500**: `#8B5CF6` - 테두리, 구분선
- **Purple-600**: `#7C3AED` - 버튼 배경
- **Purple-700**: `#6D28D9` - 버튼 호버

### Secondary Colors (보조 색상)

#### Green (그린) - 상시 서버
- **Green-400**: `#4ADE80` - 텍스트 강조
- **Green-500**: `#22C55E` - 테두리
- **Green-600**: `#16A34A` - 버튼 배경

#### Pink (핑크) - 채팅, 투표
- **Pink-400**: `#F472B6` - 텍스트 강조
- **Pink-500**: `#EC4899` - 테두리
- **Pink-600**: `#DB2777` - 버튼 배경

### Neutral Colors (중립 색상)

#### Background (배경)
- **Black**: `#000000` - 메인 배경
- **Gray-900**: `#111827` - 섹션 배경
- **Gray-800**: `#1F2937` - 카드 배경, 드롭다운
- **Gray-700**: `#374151` - 테두리, 입력 필드
- **Gray-600**: `#4B5563` - 비활성 요소

#### Text (텍스트)
- **White**: `#FFFFFF` - 주요 텍스트
- **Gray-300**: `#D1D5DB` - 일반 텍스트
- **Gray-400**: `#9CA3AF` - 보조 텍스트
- **Gray-500**: `#6B7280` - 비활성 텍스트

### Gradient (그라디언트)
주요 버튼과 카드에 사용되는 그라디언트:

1. **Primary Gradient**: `from-cyan-600 via-blue-600 to-purple-600`
   - 시작: `#0891B2` (Cyan-600)
   - 중간: `#2563EB` (Blue-600)
   - 끝: `#7C3AED` (Purple-600)

2. **Cyan Gradient**: `from-cyan-600 to-blue-600`
   - 시작: `#0891B2`
   - 끝: `#2563EB`

3. **Purple Gradient**: `from-purple-600 to-pink-600`
   - 시작: `#7C3AED`
   - 끝: `#DB2777`

---

## 📝 타이포그래피

### Font Family
- **Primary**: Arial, Helvetica, sans-serif
- **Sans**: Geist Sans (변수 폰트)
- **Mono**: Geist Mono (코드용)

### Font Sizes
- **4xl**: `2.25rem` (36px) - 메인 타이틀
- **3xl**: `1.875rem` (30px) - 섹션 타이틀
- **2xl**: `1.5rem` (24px) - 카드 타이틀
- **xl**: `1.25rem` (20px) - 부제목
- **lg**: `1.125rem` (18px) - 본문 강조
- **base**: `1rem` (16px) - 기본 본문
- **sm**: `0.875rem` (14px) - 보조 텍스트
- **xs**: `0.75rem` (12px) - 캡션

### Font Weights
- **Bold**: `700` - 타이틀
- **Semibold**: `600` - 부제목, 버튼
- **Medium**: `500` - 강조 텍스트
- **Regular**: `400` - 본문

### Line Heights
- **Tight**: `1.25` - 타이틀
- **Normal**: `1.5` - 본문
- **Relaxed**: `1.75` - 긴 텍스트

---

## 📏 스페이싱 시스템

### Base Unit: 4px

### Spacing Scale
- **1**: `0.25rem` (4px)
- **2**: `0.5rem` (8px)
- **3**: `0.75rem` (12px)
- **4**: `1rem` (16px)
- **6**: `1.5rem` (24px)
- **8**: `2rem` (32px)
- **10**: `2.5rem` (40px)
- **12**: `3rem` (48px)
- **16**: `4rem` (64px)
- **20**: `5rem` (80px)

### Padding (컴포넌트 내부 여백)
- **Small**: `p-2` (8px)
- **Medium**: `p-4` (16px)
- **Large**: `p-6` (24px)
- **XLarge**: `p-8` (32px)

### Gap (요소 간 간격)
- **Small**: `gap-2` (8px)
- **Medium**: `gap-4` (16px)
- **Large**: `gap-6` (24px)
- **XLarge**: `gap-8` (32px)

---

## 🧩 컴포넌트 목록

### Layout Components
1. **FullPageLayout** - 전체 페이지 레이아웃
2. **MainPageLayout** - 메인 페이지 레이아웃
3. **TopNavigation** - 상단 네비게이션
4. **MobileLayout** - 모바일 레이아웃

### Event Components
1. **EventCalendar** - 이벤트 캘린더
2. **EventCard** - 이벤트 카드
3. **EventDetailModal** - 이벤트 상세 모달
4. **EventListPage** - 이벤트 목록 페이지

### UI Components
1. **Button** - 버튼 컴포넌트
2. **Input** - 입력 필드
3. **BrandMark** - 브랜드 마크
4. **AnonymousChat** - 익명 채팅
5. **ParticipantButton** - 참가 버튼

### Dashboard Components
1. **DashboardOverview** - 대시보드 개요
2. **BrakingAnalysis** - 브레이킹 분석
3. **LapTimeChart** - 랩타임 차트
4. **Leaderboard** - 리더보드

### iRacing Components
1. **DriverSummaryCards** - 드라이버 요약 카드
2. **DriverHighlights** - 드라이버 하이라이트
3. **DriverTrendChart** - 드라이버 트렌드 차트

---

## 📱 브레이크포인트

### Mobile First 접근
- **Mobile**: `375px` (기본)
- **Tablet**: `768px` (sm:)
- **Desktop**: `1024px` (md:)
- **Large Desktop**: `1280px` (lg:)
- **XL Desktop**: `1536px` (xl:)

### 주요 브레이크포인트 사용 예시
```css
/* 모바일 기본 */
.class { ... }

/* 태블릿 이상 */
@media (min-width: 768px) { ... }

/* 데스크톱 이상 */
@media (min-width: 1024px) { ... }
```

---

## 🎯 Figma 설정 가이드

### 1. Figma 파일 구조

```
📁 GPX Design System
├── 📄 🎨 Design Tokens
│   ├── Colors
│   ├── Typography
│   ├── Spacing
│   └── Shadows
├── 📄 🧩 Components
│   ├── Buttons
│   ├── Cards
│   ├── Forms
│   └── Navigation
├── 📄 📱 Pages
│   ├── Home
│   ├── Events
│   ├── Dashboard
│   └── Mobile
└── 📄 📐 Layouts
    ├── Desktop (1440px)
    ├── Tablet (768px)
    └── Mobile (375px)
```

### 2. Color Styles 생성

Figma에서 Color Styles를 생성할 때:

1. **Primary Colors**
   - `Primary/Cyan-400` → `#22D3EE`
   - `Primary/Cyan-500` → `#06B6D4`
   - `Primary/Cyan-600` → `#0891B2`
   - `Primary/Blue-500` → `#3B82F6`
   - `Primary/Blue-600` → `#2563EB`
   - `Primary/Purple-500` → `#8B5CF6`
   - `Primary/Purple-600` → `#7C3AED`

2. **Neutral Colors**
   - `Neutral/Black` → `#000000`
   - `Neutral/Gray-900` → `#111827`
   - `Neutral/Gray-800` → `#1F2937`
   - `Neutral/Gray-700` → `#374151`
   - `Neutral/White` → `#FFFFFF`
   - `Neutral/Gray-300` → `#D1D5DB`
   - `Neutral/Gray-400` → `#9CA3AF`

3. **Gradients**
   - `Gradient/Primary` → Linear (0°)
     - Stop 1: `#0891B2` (0%)
     - Stop 2: `#2563EB` (50%)
     - Stop 3: `#7C3AED` (100%)

### 3. Text Styles 생성

1. **Headings**
   - `Heading/H1` → 36px, Bold, White
   - `Heading/H2` → 30px, Bold, White
   - `Heading/H3` → 24px, Bold, White

2. **Body**
   - `Body/Large` → 18px, Regular, Gray-300
   - `Body/Medium` → 16px, Regular, Gray-300
   - `Body/Small` → 14px, Regular, Gray-400

3. **Labels**
   - `Label/Medium` → 14px, Medium, White
   - `Label/Small` → 12px, Medium, Gray-400

### 4. Component Library 구축

#### Button Components
- **Primary Button**: 그라디언트 배경, 흰색 텍스트
- **Secondary Button**: 투명 배경, 테두리
- **Ghost Button**: 투명 배경, 텍스트만

#### Card Components
- **Event Card**: Gray-900 배경, Cyan 테두리
- **Info Card**: Gray-800 배경, 둥근 모서리
- **Feature Card**: 그라디언트 배경, 호버 효과

### 5. Auto Layout 설정

모든 컴포넌트는 Auto Layout을 사용하여:
- **Padding**: 16px (Medium)
- **Gap**: 12px (Small)
- **Constraints**: Left & Right, Top & Bottom

### 6. 반응형 디자인

각 페이지는 3가지 프레임으로 구성:
- **Mobile**: 375px width
- **Tablet**: 768px width
- **Desktop**: 1440px width

### 7. 플러그인 추천

1. **Unsplash** - 무료 이미지
2. **Content Reel** - 샘플 텍스트
3. **Figma to Code** - CSS 코드 생성
4. **Stark** - 접근성 검사
5. **Figma Tokens** - 디자인 토큰 관리

---

## 📐 주요 컴포넌트 스펙

### Button (Primary)
- **Width**: Auto (최소 120px)
- **Height**: 48px
- **Padding**: 16px 32px
- **Border Radius**: 12px (rounded-xl)
- **Background**: Primary Gradient
- **Text**: White, Semibold, 16px
- **Shadow**: `0 20px 25px -5px rgba(6, 182, 212, 0.3)`

### Card (Event Card)
- **Width**: Auto
- **Padding**: 24px
- **Border Radius**: 16px (rounded-2xl)
- **Background**: Gray-900/95
- **Border**: 1px, Cyan-500/40
- **Shadow**: `0 10px 15px -3px rgba(0, 0, 0, 0.3)`

### Input Field
- **Width**: 100%
- **Height**: 44px
- **Padding**: 12px 16px
- **Border Radius**: 8px (rounded-lg)
- **Background**: Gray-800
- **Border**: 1px, Gray-600
- **Focus Border**: 2px, Cyan-500

---

## 🚀 다음 단계

1. **Figma 파일 생성**
   - 새 파일 생성: "GPX Design System"
   - 위 구조대로 페이지 생성

2. **디자인 토큰 설정**
   - Color Styles 생성
   - Text Styles 생성
   - Effect Styles 생성 (Shadow)

3. **컴포넌트 라이브러리 구축**
   - 기본 컴포넌트부터 시작
   - Auto Layout 활용
   - Variants 설정

4. **페이지 디자인**
   - Home 페이지
   - Events 페이지
   - Dashboard 페이지

5. **프로토타이핑**
   - 인터랙션 추가
   - 사용자 플로우 정의

---

## 📚 참고 자료

- [Figma 공식 문서](https://help.figma.com/)
- [Tailwind CSS 색상 팔레트](https://tailwindcss.com/docs/customizing-colors)
- [디자인 시스템 모범 사례](https://www.designsystems.com/)

---

**마지막 업데이트**: 2025-01-27






