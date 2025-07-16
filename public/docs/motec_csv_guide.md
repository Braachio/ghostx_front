# 📄 MoTeC CSV 변환 가이드

MoTeC i2에서 주행 데이터를 CSV로 추출하는 방법입니다.  
`.ld` 또는 `.ldx` 주행 로그 파일을 `.csv` 파일로 변환해 분석 시스템에 업로드할 수 있습니다.

---

## ✅ 준비 사항

- **MoTeC i2 Standard** 또는 **i2 Pro** 설치  
  👉 [공식 다운로드 링크](https://www.motec.com.au/i2/i2overview/)

- 변환할 **주행 로그 파일** (`.ld` 또는 `.ldx`)

---

## 🛠️ 변환 절차

### 1. 파일 열기
- MoTeC 실행 후 메뉴에서  
  `File → Open...` 을 선택하여 `.ld` 또는 `.ldx` 파일을 엽니다.

### 2. 데이터 확인
- 상단 메뉴에서  
  `Tools → Logged Data (Shift + D)`  
  또는  
  `Tools → Show Data (Shift + T)` 선택  
- 데이터를 테이블 형태로 확인합니다.

### 3. CSV로 저장
- 메뉴에서 `File → Export → CSV File...` 선택
- 저장 경로 및 이름을 지정
- 원하는 채널 선택 후 `Export` 버튼 클릭 → `.csv` 생성 완료

> 예시 채널: `Time`, `Throttle`, `Brake`, `Speed`, `SteerAngle`, `RPM`, `Gear` 등

---

## 📦 예시 출력 형식

| 채널명     | 설명               |
|------------|--------------------|
| Time       | 시간 (초 단위)     |
| Throttle   | 가속 페달 (%)      |
| Brake      | 브레이크 (%)       |
| Speed      | 속도 (km/h 또는 m/s) |
| Gear       | 현재 기어          |
| SteerAngle | 조향각 (도 단위)   |

---

## 📤 업로드 안내

- 생성된 `.csv` 파일을 분석 시스템에 업로드하면  
  **자동으로** 주행 분석이 진행됩니다.

---

## ℹ️ 참고 사항

- CSV는 `쉼표(,) 구분 텍스트` 형식입니다.  
  → Excel, VS Code 등에서 열람 가능

- MoTeC의 설정에 따라 **기본 5ms 또는 10ms 간격**으로 저장됩니다.

---

문의: 운영자 또는 개발자에게 연락 주세요.
