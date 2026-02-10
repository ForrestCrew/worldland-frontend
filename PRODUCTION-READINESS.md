# Worldland Frontend - Production Readiness Report

> GPU Rental Platform Frontend (Next.js + wagmi + TailwindCSS)
> Generated: 2026-02-09

---
### 1.1 Provider 페이지 Auth Guard 없음
- **파일**: `app/provider/page.tsx`, `app/provider/nodes/page.tsx`, `app/provider/earnings/page.tsx`
- **현상**: 지갑 연결/SIWE 인증 없이 Provider 대시보드 접근 가능. 로딩 후 에러 표시되나 페이지 구조가 먼저 노출됨
- **수정**: Route protection wrapper 생성 → 미인증 시 `/` 리다이렉트 또는 로그인 유도 UI

### 1.2 임대 종료 시 확인 다이얼로그 없음
- **파일**: `components/rent/RentalStatusCard.tsx:409-447`, `components/rent/SessionList.tsx:173-195`
- **현상**: "임대 종료" 버튼 클릭 시 확인 없이 즉시 종료. 실행 중인 GPU 워크로드 유실 위험
- **수정**: 확인 모달 추가 ("세션을 종료하시겠습니까? 이 작업은 되돌릴 수 없습니다.")

### 1.3 지갑 전환 시 세션 데이터 Race Condition
- **파일**: `hooks/useRentalSessions.ts:121-184`
- **현상**: 지갑을 빠르게 전환하면 이전 지갑의 auth token으로 API 호출 → 다른 사용자 세션 노출 가능성
- **수정**: API 호출 전 localStorage의 address와 현재 지갑 address 일치 확인. 불일치 시 token 재발급

### 1.4 BigInt 변환 미검증 (필터링 크래시)
- **파일**: `hooks/useAvailableGPUs.ts:116-121`
- **현상**: `BigInt(filters.maxPricePerHour)` — 문자열이 유효하지 않으면 uncaught 에러로 전체 페이지 크래시
- **수정**: BigInt 변환 전 입력값 검증. try-catch 또는 Error Boundary 추가

---

## 2. 주요 UX 문제

### 2.1 Gas Estimate 실패 시 무한 로딩
- **파일**: `components/rent/RentalStartModal.tsx:142-151`
- **현상**: `encodeFunctionData` 실패 시 빈 catch 블록 → 사용자는 가스 추정 로딩 스피너만 계속 보임
- **수정**: 에러 상태 설정 → "가스 추정 불가, 수수료가 발생할 수 있습니다" 메시지 표시

### 2.2 Silent 실패 — 클립보드 복사, 입금, 출금
- **파일들**:
  - `components/rent/RentalStartModal.tsx:199-207` (SSH 정보 복사)
  - `components/rent/SSHCredentials.tsx:41-49` (SSH 정보 복사)
  - `components/balance/DepositModal.tsx:91-103` (입금)
- **현상**: `catch` 블록에서 `console.error`만 호출, 사용자에게 피드백 없음
- **수정**: toast 또는 에러 메시지로 사용자에게 실패 알림

### 2.3 모바일에서 GPU 임대 불가
- **파일**: `components/rent/GPUList.tsx:238-322`
- **현상**: 모바일 뷰에서 "행을 탭하여 상세 보기" 텍스트가 있지만 실제 클릭 핸들러 없음. 임대 버튼도 모바일에서 보이지 않음
- **수정**: 모바일에서 행 클릭 시 임대 모달 열리도록 핸들러 추가

### 2.4 임대 종료 후 UI 갱신 지연 (30초)
- **파일**: `hooks/useRentalSessions.ts:182-183`, `components/rent/SessionList.tsx:173-195`
- **현상**: `refetchInterval: 30000`(30초 폴링). 임대 종료 후 최대 30초간 "RUNNING" 상태 표시
- **수정**: 종료 성공 후 즉시 `refetch()` 호출. 활성 세션은 10-15초 폴링으로 단축

### 2.5 Provider 노드 등록 시 네트워크 에러 처리 없음
- **파일**: `components/provider/NodeRegistrationForm.tsx:81-105`
- **현상**: 네트워크 타임아웃 시 폼이 응답 없이 멈춤. 에러 메시지 표시 안됨
- **수정**: try-catch 추가, 타임아웃 감지 → "네트워크 연결을 확인해주세요" 메시지

### 2.6 Auth 에러 판별 — 문자열 매칭 의존
- **파일**: `components/rent/SessionList.tsx:122-148`
- **현상**: `'401'`, `'Unauthorized'`, `'인증'` 문자열 검색으로 인증 에러 판별. API 메시지 포맷 변경 시 작동 안함
- **수정**: HTTP status code 기반 판별로 변경 (error.status === 401)

---

## 3. UX/UI 개선

### 3.1 Z-Index 충돌 — NavBar vs Modal
- **파일**: `components/HeaderNav.tsx:58` (z-50), `components/rent/RentalStartModal.tsx:242` (z-50)
- **현상**: 모달 열린 상태에서 navbar 드롭다운 hover 시 드롭다운이 모달 위에 표시됨
- **수정**: Navbar 드롭다운 z-40, 모달 z-50으로 계층 분리

### 3.2 Error Modal 테마 불일치
- **파일**: `components/ui/error-modal.tsx:65`
- **현상**: 에러 모달만 `bg-white` (흰색 배경). 나머지 UI는 모두 다크 테마 (`bg-gray-900`)
- **수정**: 다크 테마로 통일

### 3.3 `window.location.href` 사용 — Next.js 라우팅 우회
- **파일**: `components/rent/RentalStatusCard.tsx:358`, `components/provider/SetupGuide.tsx:48`
- **현상**: 하드 페이지 리로드로 앱 상태(지갑 연결 등) 유실
- **수정**: `useRouter().push()` 사용

### 3.4 키보드 네비게이션 불가 (접근성)
- **파일**: `components/HeaderNav.tsx:43-76`
- **현상**: 드롭다운이 `onMouseEnter/Leave`만 지원. Tab 키로 접근 불가, Escape 키로 닫기 불가
- **수정**: onKeyDown 핸들러 추가 (Enter/Space 열기, Escape 닫기)

### 3.5 모달 접근성 속성 누락
- **파일**: `components/rent/RentalStartModal.tsx:242-248`
- **현상**: `role="dialog"`, `aria-modal="true"`, focus trap 없음. 스크린 리더 사용자 접근 불가
- **수정**: ARIA 속성 추가 + focus trap 라이브러리 적용

### 3.6 입금 시 지갑 잔액 확인 없음
- **파일**: `components/balance/DepositModal.tsx:45-243`
- **현상**: 지갑 잔액보다 큰 금액 입력 가능 → 트랜잭션 실패
- **수정**: 지갑 잔액 조회 후 초과 시 경고 표시

### 3.7 세션 연장 시 잔액 확인 없음
- **파일**: `components/rent/RentalStatusCard.tsx:404-408`
- **현상**: 잔액 부족 시에도 연장 시도 가능 → 트랜잭션 실패
- **수정**: 잔액 확인 → "잔액 부족, 입금 후 시도해주세요" 메시지

### 3.8 Debug console.log 프로덕션 코드에 잔존
- **파일**: `components/rent/SessionList.tsx:22`
- **현상**: `console.log('[SessionList] Session data:', JSON.stringify(session, null, 2))` — 세션 데이터 전체가 브라우저 콘솔에 노출
- **수정**: 제거 또는 `process.env.NODE_ENV === 'development'` 조건 래핑

### 3.9 진행 중 작업에 예상 시간 표시 없음
- **파일**: `components/rent/RentalStartModal.tsx:298-304`
- **현상**: "GPU 연결 중..." 스피너만 표시. 15-30초 소요되는데 진행 상황 안내 없음
- **수정**: "예상 소요 시간: 20-30초" 텍스트 추가

### 3.10 잔액 부족 경고 계산 오류 가능성
- **파일**: `components/rent/SessionLowBalanceWarning.tsx:53-60`
- **현상**: `balance`와 `pricePerSecond`의 단위가 다를 경우 (USDT vs wei) 계산 결과 비정상
- **수정**: 백엔드에서 계산된 남은 시간 값 전달, 또는 단위 변환 로직 추가

---

## 4. 폴리시/엣지 케이스

### 4.1 하드코딩된 한국어 텍스트 (50+ 곳)
- **파일**: SessionList, RentalStatusCard, DepositModal 등 전역
- **현상**: `toast.success('임대 종료 완료')` 등 직접 삽입. 다국어 지원 불가
- **수정**: i18next 또는 유사 라이브러리 도입 (중장기)

### 4.2 날짜/숫자 포맷 불일치
- **파일**: `components/rent/SessionExtensionModal.tsx:177-192` (toLocaleString), 기타 (toFixed)
- **현상**: 일부는 `date-fns` + locale, 일부는 `toLocaleString`, 일부는 `toFixed(2)` 직접 사용
- **수정**: 포맷팅 유틸리티 통일

### 4.3 홈페이지 모바일 타이포그래피
- **파일**: `app/page.tsx:48`
- **현상**: `text-5xl` 폰트가 작은 화면에서 줄바꿈 문제
- **수정**: `text-3xl md:text-5xl lg:text-7xl`로 반응형 처리

### 4.4 React.memo 미적용 (성능)
- **파일**: 전역 (0개 컴포넌트에서 React.memo 사용)
- **현상**: 불필요한 리렌더링. 저사양 기기에서 체감 가능
- **수정**: StatusBadge, SSHCredentials, PendingContent 등 순수 컴포넌트에 React.memo 적용

### 4.5 Web3Provider 전역 로드
- **파일**: `app/layout.tsx:5`
- **현상**: wagmi/RainbowKit/viem이 `/docs` 등 불필요한 페이지에서도 로드됨
- **수정**: dynamic import로 필요한 페이지에서만 로드

### 4.6 히어로 이미지 priority 속성 누락
- **파일**: `app/page.tsx:26-32`
- **현상**: 로고 이미지가 lazy load되어 LCP 저하
- **수정**: `<Image ... priority />` 추가

### 4.7 지역 표시 fallback 없음
- **파일**: `components/rent/GPUList.tsx:164-168`
- **현상**: `regionLabels`에 asia/us/eu만 매핑. 백엔드가 "us-west-2" 등 새 값 보내면 빈 문자열 표시
- **수정**: fallback으로 원본 값 표시: `regionLabels[region] || region`
---

