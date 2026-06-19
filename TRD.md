# Copilot Agent Portal — 기술 요구사항 정의서 (TRD)

| 항목 | 내용 |
| --- | --- |
| 문서 버전 | v0.2 (Draft) |
| 작성자 | 김용범 |
| 최종 수정일 | 2026-06-19 |
| 상태 | 초안(Draft) · 검토 대기 |
| 관련 PRD | `PRD.md` v0.3 |
| 관련 이해관계자 | 플랫폼팀, 각 사업부 |

---

## 1. 개요 (Overview)

본 문서는 `PRD.md`(Copilot Agent Portal)에 정의된 제품 요구사항을 **기술적으로 어떻게
구현할지** 정의한다. 핵심 전제는 다음과 같다.

- 포털은 **단순한 HTML 기반 웹 페이지**로 구현한다.
- 각 에이전트는 **URL**로 등록되며, 실행은 포털 내 **iframe 임베드**로 처리한다.
- 포털은 **LLM을 직접 호출하지 않는다**(실제 처리는 외부 에이전트 URL이 담당).
- 권한·SSO·과금 등은 이번 범위가 아니다(PRD 3.2 비목표).

---

## 2. 설계 원칙 (Design Principles)

- **단순성 우선**: 프레임워크 의존을 최소화하고, 정적 호스팅으로 배포 가능하게 한다.
- **점진적 고도화**: MVP는 백엔드 없이 시작, 필요 시 경량 백엔드로 확장한다.
- **임베드 안전성**: 외부 URL을 `iframe`에 띄우므로 `sandbox`/CSP를 기본 적용한다.
- **장애 격리**: iframe 임베드 실패가 포털 전체를 막지 않도록 fallback을 둔다.

---

## 3. 기술 스택 (Technology Stack)

| 영역 | 선택(권장) | 비고/대안 |
| --- | --- | --- |
| 프론트엔드 | **Vanilla HTML/CSS/JavaScript (ES Modules)** | 단순성 우선. 필요 시 Vite + 경량 라이브러리 |
| 검색/필터 | **클라이언트 사이드 인메모리 필터** | 데이터 소량 가정, < 1s 충족 용이 |
| 데이터(저장) | **Phase 1: 정적 `agents.json` + 브라우저 `localStorage`** | 백엔드 불필요 |
| 데이터(공유) | **Phase 2: ASP.NET Core Minimal API + SQLite** | VS 환경 친화, 공유 카탈로그 필요 시 |
| 호스팅 | **정적 호스팅**(사내 웹서버 / Azure Static Web Apps 등) | Phase 2는 앱 서비스 |
| 빌드/도구 | Visual Studio 2026, npm(선택), dotnet CLI(Phase 2) | — |

> 결정 사유: PRD의 "단순 HTML" 및 "정적 JSON vs 경량 DB" 미해결 질문에 대해
> **2단계 접근**으로 해소한다. MVP는 정적 자산만으로 동작하고, 공유 영속화가 필요해지면
> 경량 백엔드를 도입한다.

---

## 4. 시스템 아키텍처 (System Architecture)

### 4.1 Phase 1 — 프론트엔드 단독 (MVP)

- 초기 카탈로그는 `agents.json`에서 로드하고, 사용자가 등록한 항목은 `localStorage`에 병합.
- 백엔드/DB 없이 정적 호스팅으로 배포 가능.
- 한계: 등록 데이터가 **브라우저 로컬**에만 저장되어 사용자 간 공유 불가 → Phase 2에서 해결.

### 4.2 Phase 2 — 경량 백엔드 추가

- 메타데이터 CRUD만 백엔드가 담당. **LLM 호출/중계 없음**.
- SQLite 단일 파일로 운영 부담 최소화.

---

## 5. 데이터 모델 (Data Model)

### 5.1 Agent 엔티티

| 필드 | 타입 | 필수 | 설명 |
| --- | --- | --- | --- |
| `id` | string (UUID) | ✅ | 고유 식별자 |
| `name` | string | ✅ | 에이전트 이름 |
| `description` | string | ✅ | 설명 |
| `url` | string (URL) | ✅ | 실행 대상 URL(iframe `src`) |
| `tags` | string[] | ❌ | 분류 태그(FR-6) |
| `embeddable` | boolean | ❌ | iframe 임베드 가능 여부(검사 결과 캐시) |
| `createdAt` | string (ISO8601) | ✅ | 생성 시각 |
| `updatedAt` | string (ISO8601) | ✅ | 수정 시각 |

### 5.2 JSON 예시

---

## 6. API 명세 (Phase 2)

베이스 경로: `/api`. 모든 요청/응답은 `application/json`.

| 메서드 | 경로 | 설명 | 응답 |
| --- | --- | --- | --- |
| GET | `/api/agents?q={검색어}&tag={태그}` | 목록/검색(FR-1) | `200` Agent[] |
| GET | `/api/agents/{id}` | 상세(FR-2) | `200` Agent / `404` |
| POST | `/api/agents` | 등록(FR-3) | `201` Agent / `400` |
| PUT | `/api/agents/{id}` | 수정(FR-5) | `200` Agent / `404` |
| DELETE | `/api/agents/{id}` | 삭제(FR-5) | `204` / `404` |

### 6.1 POST 요청 예시

### 6.2 오류 응답 형식

---

## 7. 화면/컴포넌트 설계 (UI Components)

| 화면 | 파일(Phase 1) | 주요 요소 | 매핑 FR |
| --- | --- | --- | --- |
| 카탈로그 | `index.html` | 검색창, 에이전트 카드 목록, 태그 필터 | FR-1, FR-6 |
| 상세 | `detail.html` | 이름·설명·URL·예시, [실행] 버튼 | FR-2 |
| 등록 | `register.html` | 이름·설명·URL·태그 입력, 검증 | FR-3, FR-7 |
| 실행 | `run.html` | `<iframe>` 영역, [새 탭 열기] fallback | FR-4, FR-8 |

- 공통 모듈: `js/store.js`(데이터 접근), `js/search.js`(필터), `js/embed.js`(iframe 처리).

---

## 8. 핵심 기술 처리 (Key Technical Concerns)

### 8.1 iframe 임베드 차단 처리 (FR-7, FR-8 / PRD 위험)

외부 에이전트가 `X-Frame-Options: DENY/SAMEORIGIN` 또는 CSP `frame-ancestors`로
임베드를 막을 수 있다. 브라우저 보안상 **응답 헤더를 JS로 직접 읽을 수 없으므로**,
다음 전략을 적용한다.

1. **로드 타임아웃 감지**: iframe `load` 이벤트가 일정 시간(예: 5s) 내 미발생 시 차단으로 간주.
2. **Fallback UI**: 차단 추정 시 "이 에이전트는 임베드를 지원하지 않습니다 → **새 탭에서 열기**" 안내(`window.open`).
3. **사전 점검(선택)**: 등록 시 백엔드가 헤더를 점검해 `embeddable` 플래그를 캐시(Phase 2).

### 8.2 URL 검증 (FR-7)

- **형식 검증**: `new URL()` 파싱 + `https:` 스킴 강제.
- **허용 목록(권장)**: 사내 도메인 화이트리스트(예: `*.corp.local`) 우선, 외부는 정책에 따라.
- **정규화**: 끝 슬래시/중복 파라미터 정리.

### 8.3 iframe 보안 (PRD 7. 보안/임베드)

- `sandbox` 속성 적용: `allow-scripts allow-forms allow-same-origin`(에이전트 요건에 맞게 최소화).
- `referrerpolicy="no-referrer"`, `allow`(권한) 최소화.
- 신뢰 도메인 외 임베드는 사용자 확인 단계를 둔다.

### 8.4 검색 성능 (PRD 7. 성능 < 1s)

- 데이터 소량 가정 → **클라이언트 인메모리 필터**(이름·설명·태그 부분 일치).
- 입력 **디바운스**(약 150ms)로 과도한 재렌더 방지.
- 데이터 증가 시 Phase 2에서 서버측 쿼리/인덱스로 전환.

### 8.5 XSS 방지

- 사용자 입력(이름·설명)은 렌더 시 **텍스트 노드로 삽입**하거나 이스케이프. `innerHTML` 직접 조립 금지.

---

## 9. 디렉터리 구조(안) (Project Structure)

---

## 10. 비기능 요구 구현 매핑 (NFR Mapping)

| NFR(PRD 7) | 구현 방식 |
| --- | --- |
| 단순성 | 정적 자산 + 무프레임워크, 정적 호스팅 |
| 성능(< 1s) | 인메모리 필터 + 디바운스 |
| 반응형 | CSS Flex/Grid, iframe `width:100%` 가변 높이 |
| 보안/임베드 | `sandbox`, HTTPS 강제, 도메인 화이트리스트 |
| 유지보수성 | 기능별 모듈 분리(store/search/validate/embed) |

---

## 11. 배포 (Deployment)

- **Phase 1**: 정적 파일 업로드(사내 웹서버) 또는 Azure Static Web Apps.
- **Phase 2**: ASP.NET Core 앱 + SQLite 파일을 사내 서버/앱 서비스에 배포.
- 캐싱: `agents.json`/정적 자산에 적절한 `Cache-Control` 적용.

---

## 12. 테스트 전략 (Testing Strategy)

| 레벨 | 대상 | 도구(예) |
| --- | --- | --- |
| 단위 | `validate.js`, `search.js` 순수 로직 | Vitest/Jest |
| 통합 | 등록→목록 반영, API CRUD(Phase 2) | xUnit(.NET), supertest |
| E2E | 검색→실행(iframe), 임베드 차단 fallback | Playwright |
| 수동 | 임베드 차단 도메인 케이스, 반응형 | 체크리스트 |

핵심 케이스: 잘못된 URL 거부, HTTPS 강제, 임베드 차단 시 새 탭 fallback, 검색 응답 시간.

---

## 13. 미해결 기술 질문 (Open Technical Questions)

- 등록 데이터 영속화 시점: 언제 Phase 1(localStorage)→Phase 2(SQLite)로 전환할가?
- 임베드 차단 사전 점검을 백엔드 프록시로 수행할지(헤더 검사)?
- 외부(사외) URL 허용 정책 및 화이트리스트 운영 주체는?
- 호스팅 대상: 사내 서버 vs 클라우드(정적/앱 서비스)?
- 검색 데이터 규모 임계치(인메모리 → 서버측 전환 기준)?

---

## 14. PRD 추적성 (Traceability)

| PRD 기능 | TRD 반영 위치 |
| --- | --- |
| FR-1 카탈로그/검색 | §6, §7, §8.4 |
| FR-2 상세 | §7 |
| FR-3 등록(URL) | §6, §7, §8.2 |
| FR-4 실행(iframe) | §8.1, §8.3 |
| FR-5 수정/삭제 | §6 |
| FR-6 태그 분류 | §5, §7 |
| FR-7 URL 검증 | §8.2 |
| FR-8 임베드 fallback | §8.1 |

---

## 15. 현재 구현 상세 (2026-06-19)

문서의 목표 아키텍처 중, 현재 코드는 정적 자산 + MVC 분리를 적용한 상태다.

### 15.1 실제 디렉터리/모듈 구조

- `index.html`: 레이아웃/마크업만 유지, 외부 CSS/JS 로딩.
- `css/main.css`: 전체 스타일(메인, 카탈로그, AGENT 실행 화면, 반응형 포함).
- `js/model/agentModel.js`
	- 시드 데이터(25개)
	- `localStorage` 저장/로드
	- URL 유효성 검사(HTTPS, 허용 도메인 정책 훅)
	- 카탈로그/사이드 메뉴 필터링
	- 태그 집계, 카드 이모지 선택
- `js/view/agentView.js`
	- DOM 캐시
	- 태그/카탈로그/사이드 메뉴 렌더링
	- 폼 입력/오류 표시
	- 뷰 전환 및 실행 화면 표시
- `js/controller/agentController.js`
	- 앱 초기화
	- 네비게이션/검색/등록/실행 이벤트 바인딩
	- iframe 로드/타임아웃/fallback 처리

### 15.2 UI/동작 구현 반영

- 상단 메뉴: `HOME`, `AGENT`, `신규등록`.
- 메인: 빠른 카테고리 버튼 클릭 시 검색어 자동 입력.
- 카탈로그: 태그 칩 + 카드(이모지 썸네일) 렌더링.
- AGENT 화면: 좌측 리스트(검색/스크롤) + 우측 iframe 실행.
- 임베드 실패 대응: timeout 기반 fallback + 새 탭 열기.

### 15.3 필터 UX 보완 사항

- 검색어와 태그 필터가 동시에 남아 결과가 비는 현상을 방지하도록 로직 보완.
	- 태그 선택 시 검색어 초기화
	- 빠른 카테고리 클릭 시 태그 필터 해제

### 15.4 실행 환경 메모

- ES Module 로딩 특성상 `file://` 접근에서는 동작이 제한될 수 있음.
- 로컬 검증은 HTTP 서버(`http://localhost:<port>`)로 실행하는 것을 기준으로 함.