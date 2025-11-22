# Figma 빠른 시작 가이드

ghostx 프로젝트를 위한 Figma 디자인 시스템을 빠르게 구축하는 가이드입니다.

## ✅ 체크리스트

### 1단계: Figma 계정 및 파일 설정
- [ ] Figma 계정 생성 (무료 플랜으로 시작 가능)
- [ ] Figma Desktop 앱 설치 (선택사항, 웹 버전도 가능)
- [ ] 새 파일 생성: "GPX Design System"
- [ ] 파일을 팀과 공유 (필요시)

### 2단계: 디자인 토큰 설정 (30분)

#### 색상 스타일 생성
1. **Color Styles 패널 열기** (오른쪽 사이드바)
2. **Primary Colors 생성**:
   ```
   Primary/Cyan-400 → #22D3EE
   Primary/Cyan-500 → #06B6D4
   Primary/Cyan-600 → #0891B2
   Primary/Blue-500 → #3B82F6
   Primary/Blue-600 → #2563EB
   Primary/Purple-500 → #8B5CF6
   Primary/Purple-600 → #7C3AED
   ```

3. **Neutral Colors 생성**:
   ```
   Neutral/Black → #000000
   Neutral/Gray-900 → #111827
   Neutral/Gray-800 → #1F2937
   Neutral/Gray-700 → #374151
   Neutral/White → #FFFFFF
   Neutral/Gray-300 → #D1D5DB
   Neutral/Gray-400 → #9CA3AF
   ```

4. **Gradient 생성**:
   - Primary Gradient: Linear (0°)
     - Stop 1: #0891B2 (0%)
     - Stop 2: #2563EB (50%)
     - Stop 3: #7C3AED (100%)

#### 텍스트 스타일 생성
1. **Text Styles 패널 열기**
2. **Heading 스타일**:
   ```
   Heading/H1 → 36px, Bold, White
   Heading/H2 → 30px, Bold, White
   Heading/H3 → 24px, Bold, White
   ```

3. **Body 스타일**:
   ```
   Body/Large → 18px, Regular, Gray-300
   Body/Medium → 16px, Regular, Gray-300
   Body/Small → 14px, Regular, Gray-400
   ```

### 3단계: 기본 컴포넌트 생성 (1시간)

#### Button 컴포넌트
1. **Primary Button**:
   - Width: Auto (최소 120px)
   - Height: 48px
   - Padding: 16px 32px
   - Border Radius: 12px
   - Fill: Primary Gradient
   - Text: "Button", Body/Medium, White
   - Effect: Shadow XL

2. **Secondary Button**:
   - Width: Auto (최소 120px)
   - Height: 48px
   - Padding: 16px 32px
   - Border Radius: 12px
   - Fill: Transparent
   - Border: 1px, Cyan-500
   - Text: "Button", Body/Medium, Cyan-400

#### Card 컴포넌트
1. **Event Card**:
   - Width: Auto
   - Padding: 24px
   - Border Radius: 16px
   - Fill: Gray-900
   - Border: 1px, Cyan-500/40 (40% opacity)
   - Effect: Shadow Large

2. **Info Card**:
   - Width: Auto
   - Padding: 16px
   - Border Radius: 12px
   - Fill: Gray-800
   - Border: 1px, Gray-700

### 4단계: 레이아웃 프레임 생성 (30분)

#### 반응형 프레임
1. **Mobile Frame**: 375px width
2. **Tablet Frame**: 768px width
3. **Desktop Frame**: 1440px width

각 프레임에 Constraints 설정:
- Left & Right: Fill container
- Top & Bottom: Fill container

### 5단계: 페이지 디자인 시작 (2시간+)

#### Home Page
1. **Hero Section**:
   - BrandMark 컴포넌트
   - 메인 타이틀 (Heading/H1)
   - 서브타이틀 (Body/Large)
   - CTA 버튼 (Primary Button)

2. **Features Section**:
   - 3개의 Feature Card
   - 각 카드에 아이콘, 제목, 설명

3. **Calendar Section**:
   - Event Calendar 컴포넌트
   - 필터 버튼들

## 🎨 Figma 단축키

- **R**: Rectangle 도구
- **T**: Text 도구
- **F**: Frame 도구
- **A**: Auto Layout Frame
- **Cmd/Ctrl + D**: 복제
- **Cmd/Ctrl + G**: 그룹화
- **Cmd/Ctrl + Shift + K**: Auto Layout 토글
- **Cmd/Ctrl + /**: 플러그인 검색

## 📦 추천 플러그인 설치

1. **Unsplash** - 무료 이미지 삽입
2. **Content Reel** - 샘플 텍스트 생성
3. **Figma to Code** - CSS 코드 생성
4. **Stark** - 접근성 검사
5. **Figma Tokens** - 디자인 토큰 관리

## 🔄 개발자와 협업

### 디자인 핸드오프
1. **Figma Dev Mode 활성화**
   - 개발자에게 Dev Mode 접근 권한 부여
   - CSS 코드 자동 생성 확인

2. **주석 추가**
   - 중요한 상호작용에 주석 추가
   - 애니메이션 설명 추가

3. **스펙 문서화**
   - 컴포넌트 사용 가이드
   - 상태별 변형 설명

## 📐 주요 컴포넌트 스펙 요약

### Button
- **Primary**: Gradient 배경, 48px 높이, 12px radius
- **Secondary**: 투명 배경, 테두리, 48px 높이
- **Ghost**: 투명 배경, 텍스트만

### Card
- **Event Card**: 24px padding, 16px radius, Gray-900 배경
- **Info Card**: 16px padding, 12px radius, Gray-800 배경

### Input
- **기본**: 44px 높이, 12px radius, Gray-800 배경
- **Focus**: Cyan-500 테두리, 2px 두께

### Spacing
- **Small**: 8px (gap-2)
- **Medium**: 16px (gap-4)
- **Large**: 24px (gap-6)
- **XLarge**: 32px (gap-8)

## 🚀 다음 단계

1. ✅ 기본 컴포넌트 완성
2. ✅ 페이지 레이아웃 디자인
3. ✅ 프로토타이핑 (인터랙션 추가)
4. ✅ 개발자와 리뷰
5. ✅ 반복 개선

## 💡 팁

1. **Auto Layout 적극 활용**
   - 모든 컴포넌트에 Auto Layout 적용
   - 반응형 디자인 자동 처리

2. **Variants 사용**
   - 버튼 상태 (default, hover, disabled)
   - 카드 타입 (event, info, feature)

3. **Component Properties**
   - 텍스트 내용 변경 가능하게
   - 색상 테마 전환 가능하게

4. **디자인 토큰 일관성**
   - 항상 Color/Text Styles 사용
   - 직접 색상 입력 금지

---

**시작 시간**: 약 2-3시간
**완성 시간**: 프로젝트 규모에 따라 다름

**질문이나 도움이 필요하면 언제든지 물어보세요!** 🎨






