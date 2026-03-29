# Implementation Plan: Random Chat App

## Overview

Next.js App Router 기반 랜덤 채팅 앱을 단계적으로 구현합니다. DB 스키마 및 서버 인프라부터 시작해 매치메이킹, Agora 통합, 채팅 UI, 세션 타이머 순으로 진행하며 각 단계에서 핵심 기능을 검증합니다.

## Tasks

- [ ] 1. 프로젝트 기반 설정 및 DB 스키마 구성
  - `lib/db/schema.ts`에 `queue_entries`, `sessions` Drizzle ORM 스키마 정의
  - Drizzle 설정 파일(`drizzle.config.ts`) 및 DB 연결 모듈(`lib/db/index.ts`) 작성
  - 필요한 패키지 목록 확인 (`drizzle-orm`, `mysql2`, `agora-token`, `agora-rtc-sdk-ng`, `agora-rtm`, `@cloudflare/turnstile`, `fast-check`, `vitest`)
  - _Requirements: 9.1, 9.3_

  - [ ]* 1.1 DB 스키마 퍼시스턴스 속성 테스트 작성
    - **Property 15: 세션 생성 시 DB 퍼시스턴스 라운드트립**
    - **Validates: Requirements 9.1**
  - [ ]* 1.2 큐 항목 퍼시스턴스 속성 테스트 작성
    - **Property 17: 큐 항목 DB 퍼시스턴스 라운드트립**
    - **Validates: Requirements 9.3**

- [ ] 2. 서버 유틸리티 구현 (Turnstile, Agora 토큰)
  - `lib/turnstile.ts`: Cloudflare Turnstile 서버 측 검증 함수 구현
  - `lib/agora-token.ts`: `agora-token` 라이브러리 래퍼 — RTC+RTM 토큰 생성 함수 구현 (만료 600초)
  - _Requirements: 1.1, 1.3, 4.2, 4.3_

  - [ ]* 2.1 Agora 토큰 만료 시각 속성 테스트 작성
    - **Property 9: 토큰 만료 시각 (발급 시각 + 600초)**
    - **Validates: Requirements 4.3**

- [ ] 3. 이름 유효성 검사 유틸리티 구현
  - `lib/validation.ts`에 `validateUserName` 함수 구현 (1~20자 허용, 빈 문자열·공백 전용 거부)
  - `lib/validation.ts`에 `validateMessageLength` 함수 구현 (1~1000자 허용)
  - _Requirements: 1.4, 1.5, 5.3, 5.4_

  - [ ]* 3.1 이름 유효성 속성 테스트 작성
    - **Property 1: 이름 유효성 검사 (길이 1-20 허용, 그 외 거부)**
    - **Validates: Requirements 1.4, 1.5**
  - [ ]* 3.2 메시지 길이 유효성 속성 테스트 작성
    - **Property 11: 메시지 길이 유효성 검사 (1-1000자 허용, 1001자 이상 차단)**
    - **Validates: Requirements 5.3, 5.4**

- [ ] 4. 매치메이커 서비스 구현
  - `lib/matchmaker.ts`에 큐 스캔 및 세션 생성 로직 구현
    - 동일 `chat_mode`의 `waiting` 상태 큐 항목 2개 조회
    - UUID v4로 세션 ID 생성 (= Agora 채널명)
    - `sessions` 테이블에 INSERT, `queue_entries` 상태를 `matched`로 UPDATE (트랜잭션)
    - `expiresAt = startedAt + 420초` 설정
  - `lib/matchmaker.ts`에 `setInterval` 기반 워커 시작 함수 구현 (2초 간격)
  - _Requirements: 3.1, 3.2, 3.3, 3.6, 4.1, 8.1, 9.1_

  - [ ]* 4.1 매칭 모드 동일성 속성 테스트 작성
    - **Property 5: 매칭된 두 사용자의 chat_mode 동일성 불변식**
    - **Validates: Requirements 3.2**
  - [ ]* 4.2 매칭 후 큐 상태 변경 속성 테스트 작성
    - **Property 6: 매칭 후 queue_entries 상태 'matched' 전환**
    - **Validates: Requirements 3.3**
  - [ ]* 4.3 세션 타이머 초기값 속성 테스트 작성
    - **Property 14: expiresAt = startedAt + 420초**
    - **Validates: Requirements 8.1**
  - [ ]* 4.4 세션 채널명 고유성 속성 테스트 작성
    - **Property 8: 생성된 세션들의 채널명(session ID) 고유성**
    - **Validates: Requirements 4.1**

- [ ] 5. API Route Handlers 구현
  - [ ] 5.1 `app/api/queue/join/route.ts` 구현
    - Turnstile 토큰 서버 검증 → 실패 시 400 반환
    - `validateUserName` 호출 → 실패 시 400 반환
    - `queue_entries` INSERT, `queueEntryId` 반환
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 3.1_

  - [ ]* 5.2 큐 진입 모드 일치 속성 테스트 작성
    - **Property 4: 큐 진입 후 DB 레코드의 chat_mode 일치**
    - **Validates: Requirements 3.1**

  - [ ] 5.3 `app/api/queue/leave/route.ts` 구현
    - `queue_entries` 상태를 `cancelled`로 UPDATE
    - _Requirements: 3.5_

  - [ ]* 5.4 큐 취소 후 상태 변경 속성 테스트 작성
    - **Property 7: 취소 후 queue_entries 상태 'cancelled' 및 매칭 제외**
    - **Validates: Requirements 3.5**

  - [ ] 5.5 `app/api/queue/status/route.ts` 구현
    - `queueEntryId`로 `queue_entries` 조회
    - `matched` 상태이면 `sessionId`, `channelName`, `rtcToken`, `rtmToken`, `rtcUid`, `expiresAt` 반환
    - _Requirements: 3.4, 4.2_

  - [ ] 5.6 `app/api/token/route.ts` 구현
    - `lib/agora-token.ts`로 RTC+RTM 토큰 생성
    - 토큰 생성 실패 시 세션 레코드 삭제 및 큐 항목 `waiting` 롤백
    - _Requirements: 4.2, 4.3, 4.4_

  - [ ] 5.7 `app/api/session/end/route.ts` 구현
    - `sessions` 테이블의 `ended_at`, `termination_reason` 업데이트
    - _Requirements: 8.5, 9.2_

  - [ ]* 5.8 세션 종료 DB 업데이트 속성 테스트 작성
    - **Property 16: 종료된 세션의 ended_at, termination_reason 비null 업데이트**
    - **Validates: Requirements 9.2**

- [ ] 6. Checkpoint — 모든 서버 측 테스트 통과 확인
  - 모든 테스트가 통과하는지 확인하고, 문제가 있으면 사용자에게 질문하세요.

- [ ] 7. 랜딩 페이지 구현 (`app/page.tsx`)
  - [ ] 7.1 `components/TurnstileWidget.tsx` 구현
    - `@cloudflare/turnstile` 위젯 래퍼 컴포넌트 작성
    - 검증 성공/실패 콜백 처리
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ] 7.2 `components/ChatModeSelector.tsx` 구현
    - text / voice / video 3가지 옵션 렌더링
    - 선택된 모드 하이라이트, 이전 선택 해제
    - _Requirements: 2.1, 2.2_

  - [ ]* 7.3 채팅 모드 단일 선택 불변식 속성 테스트 작성
    - **Property 2: 마지막 선택 모드만 활성화, 나머지 비활성화**
    - **Validates: Requirements 2.2**

  - [ ] 7.4 랜딩 페이지 폼 로직 구현 (`app/page.tsx`)
    - Turnstile 완료 후 이름 입력 필드 및 ChatModeSelector 표시
    - 이름 유효성 검사 및 모드 미선택 시 에러 표시
    - voice/video 선택 시 `getUserMedia` 권한 요청, 거부 시 에러 표시 및 매치메이킹 차단
    - 시작 버튼 클릭 시 `POST /api/queue/join` 호출 후 `/waiting`으로 이동
    - _Requirements: 1.2, 1.4, 2.3, 2.4, 2.5_

  - [ ]* 7.5 미디어 권한 요청 조건 속성 테스트 작성
    - **Property 3: voice/video 모드에서 권한 요청 발생, text 모드에서 미발생**
    - **Validates: Requirements 2.4**

- [ ] 8. 대기 페이지 구현 (`app/waiting/page.tsx`)
  - `GET /api/queue/status` 2초 간격 폴링 구현
  - 대기 중 인디케이터 표시
  - `matched` 상태 수신 시 `/chat/[sessionId]`로 이동
  - 취소 버튼 클릭 시 `DELETE /api/queue/leave` 호출 후 홈으로 이동
  - _Requirements: 3.4, 3.5_

- [ ] 9. Agora 프로바이더 및 채팅 공통 컴포넌트 구현
  - `components/AgoraProvider.tsx`: `dynamic import`로 SSR 우회한 Agora 초기화 프로바이더 구현
  - `components/SessionTimer.tsx`: `expiresAt` prop을 받아 남은 시간 카운트다운 표시, 만료 시 콜백 호출
  - _Requirements: 8.2, 8.3_

  - [ ]* 9.1 세션 타이머 초기값 단위 테스트 작성
    - expiresAt 기준 카운트다운 초기값 및 만료 콜백 동작 검증
    - _Requirements: 8.1, 8.3_

- [ ] 10. 텍스트 채팅 컴포넌트 구현 (`components/TextChat.tsx`)
  - Agora RTM 채널 join 및 메시지 수신 핸들러 구현
  - 메시지 전송 시 발신자 이름 + 타임스탬프 포함하여 렌더링
  - 1000자 초과 시 전송 차단 및 경고 표시 (`validateMessageLength` 활용)
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 10.1 메시지 렌더링 포함 정보 속성 테스트 작성
    - **Property 10: 렌더링 결과에 발신자 이름과 타임스탬프 포함**
    - **Validates: Requirements 5.2**

- [ ] 11. 음성 채팅 컴포넌트 구현 (`components/VoiceChat.tsx`)
  - Agora RTC 채널 join, 로컬 마이크 트랙 생성 및 publish
  - 원격 사용자 오디오 트랙 subscribe 및 play
  - 뮤트/언뮤트 토글 버튼 구현 — `localAudioTrack.setEnabled(false/true)`
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 11.1 음성 뮤트 라운드트립 속성 테스트 작성
    - **Property 12: 뮤트 on/off 후 오디오 트랙 enabled 상태 라운드트립**
    - **Validates: Requirements 6.3, 6.4**

- [ ] 12. 영상 채팅 컴포넌트 구현 (`components/VideoChat.tsx`)
  - Agora RTC 채널 join, 로컬 카메라+마이크 트랙 생성 및 publish
  - 로컬/원격 비디오 피드 동시 표시
  - 뮤트/언뮤트 및 카메라 on/off 토글 버튼 구현 — `localVideoTrack.setEnabled(false/true)`
  - 모바일 환경에서 전면 카메라 기본 선택 (`facingMode: 'user'`)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.3_

  - [ ]* 12.1 카메라 토글 라운드트립 속성 테스트 작성
    - **Property 13: 카메라 off/on 후 비디오 트랙 enabled 상태 라운드트립**
    - **Validates: Requirements 7.4, 7.5**

- [ ] 13. 채팅 페이지 구현 (`app/chat/[sessionId]/page.tsx`)
  - `sessionId`로 세션 정보 로드 (토큰, 채널명, expiresAt, chatMode)
  - `chatMode`에 따라 `TextChat` / `VoiceChat` / `VideoChat` 컴포넌트 조건부 렌더링
  - `SessionTimer` 컴포넌트 연결 — 만료 시 `POST /api/session/end` 호출 후 `/ended`로 이동
  - RTM presence `LEAVE`/`TIMEOUT` 이벤트 감지 시 파트너 이탈 알림 표시 후 세션 종료
  - `token-privilege-will-expire` 이벤트 핸들러 등록 (방어적 처리)
  - `connection-state-change` / RTM `status` 이벤트로 연결 상태 UI 표시
  - 수동 나가기 버튼 클릭 시 `POST /api/session/end` 호출 후 `/ended`로 이동
  - _Requirements: 8.3, 8.4, 8.5_

- [ ] 14. 세션 종료 페이지 구현 (`app/ended/page.tsx`)
  - 세션 종료 메시지 표시
  - 새 세션 시작 버튼 (홈으로 이동) 표시
  - _Requirements: 8.4_

- [ ] 15. 반응형 UI 스타일링
  - 모든 페이지에 375px~1920px 뷰포트 대응 레이아웃 적용
  - 모바일 터치 인터랙션 최적화 레이아웃 적용
  - _Requirements: 10.1, 10.2_

- [ ] 16. 매치메이커 워커 Next.js 앱 연동
  - `app/layout.tsx` 또는 서버 초기화 지점에서 매치메이커 `setInterval` 워커 시작
  - 중복 실행 방지 (싱글턴 패턴)
  - _Requirements: 3.2, 3.6_

- [ ] 17. Final Checkpoint — 전체 테스트 통과 확인
  - 모든 단위 테스트 및 속성 기반 테스트가 통과하는지 확인하고, 문제가 있으면 사용자에게 질문하세요.

## Notes

- `*` 표시된 서브태스크는 선택적이며 MVP 속도를 위해 건너뛸 수 있습니다.
- 각 태스크는 특정 요구사항을 참조하여 추적 가능성을 보장합니다.
- 속성 기반 테스트는 `fast-check`로 최소 100회 반복 실행합니다.
- Agora SDK는 단위 테스트에서 `vi.mock`으로 모킹합니다.
- 세션 ID = Agora 채널명 (UUID v4) — 별도 채널명 생성 로직 불필요.
