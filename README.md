# 🤖 Copilot Agent Portal

검증된 AI Agent를 검색하고, 바로 실행해 업무 속도를 높일 수 있는 통합 포털입니다.

## 🎯 주요 기능

- **Agent 카탈로그**: 카테고리별 Agent 검색 및 태그 필터링
- **Agent 실행**: iframe을 통한 Agent 임베드 또는 새 탭에서 열기
- **Agent 등록**: HTTPS URL 기반 새로운 Agent 등록 (로컬 테스트는 http://localhost 허용)
- **태그 기반 필터링**: 카테고리별, 태그별 Agent 탐색
- **반응형 레이아웃**: 데스크톱과 모바일 대응

## 📁 프로젝트 구조

```
.
├── index.html                    # 포털 진입점
├── css/
│   └── main.css                 # 전체 스타일 (Toss 디자인 참고)
├── js/
│   ├── model/
│   │   └── agentModel.js        # 데이터 관리 (Agent 검색, 필터링, 저장)
│   ├── view/
│   │   └── agentView.js         # DOM 관리 및 렌더링
│   └── controller/
│       └── agentController.js   # 이벤트 핸들링 및 오케스트레이션
├── tests/
│   └── agentModel.test.js       # 모델 로직 회귀 테스트
├── agents/
│   └── daeduck-mcp-agent/       # 대덕전자 정보 Agent
│       ├── server.js            # Express 웹 서버
│       ├── mcp-server.js        # MCP stdio 서버 (선택적)
│       ├── daeduckData.js       # 데이터 접근 (뉴스, 주가)
│       └── public/
│           ├── index.html       # Agent 랜딩 페이지
│           └── chat.html        # Agent 채팅 UI
├── .github/
│   └── workflows/
│       ├── static.yml           # GitHub Pages 배포
│       └── test.yml             # Node 테스트 CI/CD
├── PRD.md                       # Product Requirements Document
├── TRD.md                       # Technical Requirements Document
├── DESIGN.md                    # 디자인 가이드
├── package.json                 # Node.js 의존성 및 스크립트
└── README.md                    # 이 파일
```

## 🏗️ 아키텍처

포털은 **MVC 패턴**으로 설계되었습니다:

- **Model** (`agentModel.js`): Agent 데이터 로딩, 검색, 필터링, 저장 관리
- **View** (`agentView.js`): DOM 캐싱 및 렌더링 추상화
- **Controller** (`agentController.js`): 사용자 이벤트와 모델/뷰 간 오케스트레이션

ES Module을 사용한 순수 JavaScript 구현으로, 빌드 단계 불필요합니다.

## 🚀 시작하기

### 포털 로컬 실행

```bash
# Node.js HTTP 서버로 포털 실행
# 포트 5500 (또는 선호하는 포트)
python -m http.server 5500 --directory c:\Users\WIN\Desktop\github\ copilot

# 또는 로컬 Node.js 서버 사용
# 별도의 웹서버 필요 (CSS/JS 모듈 로딩을 위해)
```

### 대덕전자 Agent 실행

```bash
# 1. 대덕전자 Agent 디렉토리로 이동
cd agents/daeduck-mcp-agent

# 2. 서버 시작 (포트 5600)
node server.js

# 3. 브라우저에서 접속
# - 랜딩 페이지: http://localhost:5600
# - 채팅 페이지: http://localhost:5600/chat
```

### 포털과 Agent 연동

포털의 `js/model/agentModel.js`에 Agent를 등록합니다:

```javascript
const SEED_AGENTS = [
  {
    id: 'seed-0801',
    name: '대덕전자 업황 확인',
    description: 'MCP 툴로 대덕전자 주가·뉴스·업황을 채팅으로 바로 확인합니다.',
    url: 'http://localhost:5600/chat',
    tags: ['대덕전자 인사이트', '업황', '채팅'],
    embeddable: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // ...
];
```

## 🧪 테스트

### 모델 로직 테스트

```bash
# Node.js 내장 test runner 사용
npm test

# 또는 직접 실행
node --test
```

테스트 내용:
- URL 검증 (HTTPS, localhost http)
- Agent 검색 및 필터링
- 태그 추출 및 정렬
- 이모지 매핑
- localStorage 저장/로드

## 📋 API

### Agent Model

#### `validateAgentUrl(input)`
- **설명**: Agent URL 검증 (HTTPS 또는 localhost http)
- **반환**: `{ ok: boolean, value?: string, message?: string }`

#### `filterAgents(agents, query, tag)`
- **설명**: Agent 목록을 검색어와 태그로 필터링
- **반환**: 필터링된 Agent 배열

#### `getTags()`
- **설명**: 등록된 모든 Agent의 태그 추출
- **반환**: 정렬된 고유 태그 배열

#### `pickEmoji(agent)`
- **설명**: Agent 특성에 맞는 이모지 선택
- **반환**: 이모지 문자열

#### `addAgent(agent)`
- **설명**: 새 Agent를 등록하고 localStorage에 저장
- **매개변수**: Agent 객체 (id, name, description, url, tags, embeddable, createdAt, updatedAt)

## 🔌 대덕전자 Agent API

### GET /api/stock
주가 정보 조회

**응답**:
```json
{
  "symbol": "002010",
  "name": "대덕전자",
  "price": "1234.5",
  "change": "-1.2%",
  "timestamp": "2026-06-19T10:30:00Z"
}
```

### GET /api/news?limit=10
최신 뉴스 조회

**응답**:
```json
{
  "items": [
    {
      "title": "대덕전자 분기 실적 발표...",
      "link": "https://...",
      "thumbnail": "https://...",
      "pubDate": "2026-06-19"
    }
  ]
}
```

### POST /api/chat
자연어 채팅 (의도 기반 라우팅)

**요청**:
```json
{
  "message": "대덕전자 업황은 어때?"
}
```

**응답**:
```json
{
  "reply": "대덕전자 현재 주가는...",
  "intent": "stock|news|briefing|help"
}
```

## 🎨 디자인 특징

- **토스 디자인** 참고: 간결하고 직관적인 UI
- **카테고리 칩**: 빠른 검색을 위한 퀵 카테고리 버튼
- **이모지 썸네일**: 시각적 카테고리 식별
- **반응형 태그 스트립**: 가로 스크롤 가능한 태그 필터
- **넓게 보기 모드**: 우측 사이드바를 숨기고 iframe 확대

## 📦 저장소 구조

**사용자 Agent는 `localStorage`에 저장됩니다**:
- Key: `agentPortal.userAgents`
- Value: JSON 배열

## 🚢 배포

### GitHub Pages

`.github/workflows/static.yml`에서 자동으로 배포됩니다.

```yaml
on:
  push:
    branches: ["main"]
```

배포 URL: https://bummy97.github.io/GitHub-Copilot-Hackathon/

### 테스트 CI/CD

`.github/workflows/test.yml`에서 매 push 시 자동으로 테스트를 실행합니다.

## 📚 문서

- [PRD.md](PRD.md) - 제품 요구사항
- [TRD.md](TRD.md) - 기술 아키텍처
- [DESIGN.md](DESIGN.md) - 디자인 가이드 및 스타일

## 🔧 개발 가이드

### 새 Agent 추가

1. `js/model/agentModel.js`의 `SEED_AGENTS`에 항목 추가
2. Agent 서버 준비 (필요 시 `agents/` 디렉토리에 추가)
3. 테스트 실행: `npm test`
4. Git 커밋 및 푸시

### 로컬 스타일 확인

CSS 수정 후 브라우저 새로고침:
- 포털 대화형 요소: `css/main.css`
- 전역 색상, 타이포그래피, 리스폰시브 디자인

## ⚠️ 제약사항

- **iframe 임베드**: `X-Frame-Options` 또는 CSP로 차단될 수 있음 (fallback: 새 탭 열기)
- **로컬 Agent URL**: http://localhost 형태만 테스트 환경에서 허용
- **RSS/뉴스 피드**: 외부 서비스 의존 (구글 뉴스, 야후 파이낸스)

## 📝 라이선스

내부 프로젝트

## 👥 기여

1. 이 저장소를 fork합니다
2. 기능 브랜치 생성: `git checkout -b feature/new-agent`
3. 커밋: `git commit -m "Add new agent"`
4. 푸시 및 PR 요청

## 📧 연락처

프로젝트 관련 문의: [이메일 또는 연락처]
