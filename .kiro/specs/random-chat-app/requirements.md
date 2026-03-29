# Requirements Document

## Introduction

랜덤 채팅 앱은 사용자가 텍스트, 음성, 영상 중 원하는 소통 방식을 선택하여 같은 방식을 선택한 낯선 사람과 7분간 익명으로 대화할 수 있는 서비스입니다. Next.js 단일 프로젝트로 구성되며, MySQL + Drizzle ORM으로 데이터를 관리하고, Cloudflare Turnstile로 봇을 차단하며, Agora SDK로 실시간 통신을 처리합니다.

## Glossary

- **System**: 랜덤 채팅 앱 전체 시스템
- **User**: 앱에 접속하여 채팅에 참여하는 사람
- **Matchmaker**: 대기 중인 사용자를 매칭하는 서버 측 컴포넌트
- **Session**: 두 사용자가 연결된 7분짜리 채팅 세션
- **Chat_Mode**: 사용자가 선택한 소통 방식 (text / voice / video)
- **Turnstile**: Cloudflare Turnstile 봇 검증 서비스
- **Agora**: 실시간 음성·영상·데이터 통신을 제공하는 Agora SDK
- **Queue**: 매칭 대기열 (Chat_Mode별로 분리됨)
- **Token**: Agora 채널 접속에 필요한 인증 토큰


## Requirements

### Requirement 1: 봇 검증 및 사용자 이름 입력

**User Story:** As a User, I want to verify I am human and enter my name before joining, so that the service is protected from bots and I can be identified during the session.

#### Acceptance Criteria

1. WHEN a User accesses the app, THE System SHALL display the Cloudflare Turnstile widget before allowing any further interaction.
2. WHEN the Turnstile verification succeeds, THE System SHALL display a name input field and a Chat_Mode selector.
3. IF the Turnstile verification fails, THEN THE System SHALL display an error message and prevent the User from proceeding.
4. IF the User submits an empty name, THEN THE System SHALL display a validation error and prevent the User from proceeding.
5. THE System SHALL accept names between 1 and 20 characters in length.

---

### Requirement 2: 채팅 방식 선택

**User Story:** As a User, I want to choose between text, voice, and video chat modes, so that I can communicate in the way I prefer.

#### Acceptance Criteria

1. THE System SHALL present three Chat_Mode options to the User: text, voice, and video.
2. WHEN a User selects a Chat_Mode, THE System SHALL highlight the selected option and deselect any previously selected option.
3. IF a User attempts to start matchmaking without selecting a Chat_Mode, THEN THE System SHALL display a validation error.
4. WHERE the voice or video Chat_Mode is selected, THE System SHALL request microphone or camera permission from the browser before starting matchmaking.
5. IF the User denies microphone or camera permission, THEN THE System SHALL display an error message and prevent matchmaking from starting.

---

### Requirement 3: 매치메이킹

**User Story:** As a User, I want to be matched with a random stranger who chose the same chat mode, so that we can communicate using the same medium.

#### Acceptance Criteria

1. WHEN a User clicks the start button, THE Matchmaker SHALL add the User to the Queue corresponding to the User's selected Chat_Mode.
2. THE Matchmaker SHALL only match Users who have the same Chat_Mode (text↔text, voice↔voice, video↔video).
3. WHEN two Users with the same Chat_Mode are in the Queue, THE Matchmaker SHALL create a Session and remove both Users from the Queue.
4. WHILE a User is waiting in the Queue, THE System SHALL display a waiting indicator to the User.
5. IF a User cancels matchmaking while waiting, THEN THE Matchmaker SHALL remove the User from the Queue.
6. THE Matchmaker SHALL complete the matching process within 30 seconds of a second User joining the same Chat_Mode Queue.

---

### Requirement 4: Agora 토큰 발급

**User Story:** As a User, I want a secure token to join the Agora channel, so that unauthorized users cannot access the session.

#### Acceptance Criteria

1. WHEN a Session is created, THE System SHALL generate a unique Agora channel name for the Session.
2. WHEN a Session is created, THE System SHALL generate a Token for each matched User via the Agora token server.
3. THE System SHALL issue Tokens with an expiry time of 10 minutes.
4. IF Token generation fails, THEN THE System SHALL terminate the Session and return both Users to the Queue.

---

### Requirement 5: 실시간 채팅 (텍스트)

**User Story:** As a User who selected text mode, I want to exchange text messages in real time, so that I can have a conversation with the matched stranger.

#### Acceptance Criteria

1. WHILE a text Session is active, THE System SHALL transmit messages sent by one User to the other User within 500ms using Agora RTM.
2. WHEN a User sends a message, THE System SHALL display the message in the chat window with the sender's name and a timestamp.
3. THE System SHALL support messages up to 1000 characters in length.
4. IF a message exceeds 1000 characters, THEN THE System SHALL prevent the User from sending the message and display a character limit warning.

---

### Requirement 6: 실시간 채팅 (음성)

**User Story:** As a User who selected voice mode, I want to have a real-time voice conversation, so that I can talk with the matched stranger.

#### Acceptance Criteria

1. WHILE a voice Session is active, THE System SHALL transmit the User's microphone audio to the matched User in real time using Agora RTC.
2. WHEN a voice Session starts, THE System SHALL display a mute/unmute toggle button to the User.
3. WHEN a User activates the mute toggle, THE System SHALL stop transmitting the User's microphone audio to the matched User.
4. WHEN a User deactivates the mute toggle, THE System SHALL resume transmitting the User's microphone audio to the matched User.

---

### Requirement 7: 실시간 채팅 (영상)

**User Story:** As a User who selected video mode, I want to have a real-time video and audio conversation, so that I can see and talk with the matched stranger.

#### Acceptance Criteria

1. WHILE a video Session is active, THE System SHALL transmit the User's camera video and microphone audio to the matched User in real time using Agora RTC.
2. WHEN a video Session starts, THE System SHALL display the local User's video feed and the remote User's video feed simultaneously.
3. WHEN a video Session starts, THE System SHALL display mute/unmute and camera on/off toggle buttons to the User.
4. WHEN a User activates the camera off toggle, THE System SHALL stop transmitting the User's video to the matched User.
5. WHEN a User deactivates the camera off toggle, THE System SHALL resume transmitting the User's video to the matched User.

---

### Requirement 8: 세션 자동 종료 (7분 타이머)

**User Story:** As a User, I want the session to automatically end after 7 minutes, so that conversations are kept brief and I can meet new people.

#### Acceptance Criteria

1. WHEN a Session is created, THE System SHALL start a countdown timer of 7 minutes (420 seconds).
2. WHILE a Session is active, THE System SHALL display the remaining time to both Users.
3. WHEN the countdown timer reaches 0, THE System SHALL automatically terminate the Session and disconnect both Users from the Agora channel.
4. WHEN a Session is terminated, THE System SHALL display a session-ended screen to both Users with an option to start a new session.
5. WHEN a User manually leaves the Session before the timer expires, THE System SHALL terminate the Session and notify the remaining User that the partner has left.

---

### Requirement 9: 세션 데이터 저장

**User Story:** As a system operator, I want session metadata to be persisted, so that I can monitor usage and troubleshoot issues.

#### Acceptance Criteria

1. WHEN a Session is created, THE System SHALL persist the Session record to the MySQL database via Drizzle ORM, including session ID, Chat_Mode, start time, and the names of both Users.
2. WHEN a Session is terminated, THE System SHALL update the Session record with the end time and termination reason (timer_expired or user_left).
3. THE System SHALL store Queue entries in the MySQL database to support server restarts without losing waiting Users.

---

### Requirement 10: 반응형 UI

**User Story:** As a User, I want the app to work on both desktop and mobile browsers, so that I can use it from any device.

#### Acceptance Criteria

1. THE System SHALL render all pages correctly on viewport widths from 375px to 1920px.
2. WHEN a User accesses the app on a mobile browser, THE System SHALL display a layout optimized for touch interaction.
3. WHERE the video Chat_Mode is selected on a mobile device, THE System SHALL use the front-facing camera by default.
