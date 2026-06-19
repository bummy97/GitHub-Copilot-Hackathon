export const EMBED_TIMEOUT_MS = 5000;
export const SEARCH_DEBOUNCE_MS = 150;

const STORAGE_KEY = 'agentPortal.userAgents';
const ALLOWED_HOSTS = [];

const SEED_AGENTS = [
  { id: 'seed-0801', name: '대덕전자 업황 확인', description: 'MCP 툴로 대덕전자 주가·뉴스·업황을 채팅으로 바로 확인합니다.', url: 'http://localhost:5600/chat', tags: ['대덕전자 인사이트', '업황', '채팅'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-0901', name: '대덕전자 뉴스 확인', description: '대덕전자 관련 최신 뉴스와 주가를 확인할 수 있는 전용 Agent입니다.', url: 'http://localhost:5600', tags: ['대덕전자 인사이트', '뉴스', '주가'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1001', name: '회의록 요약 봇', description: '긴 회의 내용을 핵심 요약과 액션 아이템으로 정리합니다.', url: 'https://example.com/agents/meeting-summary', tags: ['문서 요약', '생산성'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1002', name: '보고서 TL;DR 생성기', description: '장문의 보고서를 1분 내 읽을 수 있는 요약본으로 변환합니다.', url: 'https://example.com/agents/report-tldr', tags: ['문서 요약', '리포트'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1003', name: '계약서 핵심 조항 추출', description: '계약서에서 리스크 조항과 주요 조건만 추려서 보여줍니다.', url: 'https://example.com/agents/contract-summary', tags: ['문서 요약', '법무'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1004', name: '뉴스 브리핑 메이커', description: '여러 기사 내용을 한 장짜리 데일리 브리핑으로 요약합니다.', url: 'https://example.com/agents/news-briefing', tags: ['문서 요약', '브리핑'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1005', name: '메일 스레드 압축기', description: '길어진 이메일 스레드를 핵심 맥락 중심으로 압축 정리합니다.', url: 'https://example.com/agents/mail-thread-summary', tags: ['문서 요약', '커뮤니케이션'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1101', name: '코드 리뷰 도우미', description: 'PR 변경분을 분석해 리뷰 코멘트 초안을 제안합니다.', url: 'https://example.com/agents/code-review-assistant', tags: ['코드 리뷰', '개발'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1102', name: '보안 리뷰 스캐너', description: '취약 가능성이 높은 코드 패턴을 리뷰 포인트로 표시합니다.', url: 'https://example.com/agents/security-review', tags: ['코드 리뷰', '보안'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1103', name: '테스트 커버리지 리뷰어', description: '변경 코드 기준으로 필요한 테스트 케이스 누락을 점검합니다.', url: 'https://example.com/agents/test-coverage-review', tags: ['코드 리뷰', '테스트'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1104', name: '리팩터링 제안 리뷰어', description: '중복 코드와 복잡도 높은 구간을 찾아 개선 제안을 제공합니다.', url: 'https://example.com/agents/refactor-review', tags: ['코드 리뷰', '리팩터링'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1105', name: '컨벤션 체크 리뷰어', description: '팀 코딩 컨벤션 기준 위반 항목을 빠르게 식별합니다.', url: 'https://example.com/agents/style-review', tags: ['코드 리뷰', '품질'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1201', name: '매출 인사이트 분석기', description: '월별 매출 데이터를 분석해 이상 구간과 성장 포인트를 알려줍니다.', url: 'https://example.com/agents/sales-insight', tags: ['데이터 분석', '매출'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1202', name: '코호트 리텐션 분석', description: '유저 코호트별 리텐션 추이와 이탈 시점을 시각화합니다.', url: 'https://example.com/agents/cohort-retention', tags: ['데이터 분석', '리텐션'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1203', name: 'A/B 테스트 리포터', description: '실험 결과 유의성 검증과 의사결정 요약을 제공합니다.', url: 'https://example.com/agents/ab-test-reporter', tags: ['데이터 분석', '실험'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1204', name: '로그 이상 탐지 어시스턴트', description: '트래픽/오류 로그에서 비정상 패턴을 자동 탐지합니다.', url: 'https://example.com/agents/log-anomaly', tags: ['데이터 분석', '모니터링'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1205', name: '대시보드 코멘터', description: '대시보드 지표 변화 원인을 자연어로 설명해줍니다.', url: 'https://example.com/agents/dashboard-commenter', tags: ['데이터 분석', '대시보드'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1301', name: '광고 카피 제너레이터', description: '타깃/톤앤매너에 맞는 광고 문구를 다중 버전으로 생성합니다.', url: 'https://example.com/agents/ad-copy', tags: ['마케팅 카피', '광고'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1302', name: '랜딩페이지 헤드라인 메이커', description: '전환율 중심의 헤드라인과 서브카피를 추천합니다.', url: 'https://example.com/agents/landing-headline', tags: ['마케팅 카피', '랜딩페이지'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1303', name: 'SNS 캡션 어시스턴트', description: '채널별 최적 길이와 말투로 SNS 캡션을 작성합니다.', url: 'https://example.com/agents/social-caption', tags: ['마케팅 카피', 'SNS'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1304', name: '이메일 캠페인 카피봇', description: '오픈율을 높이는 제목과 본문 CTA 카피를 생성합니다.', url: 'https://example.com/agents/email-copy', tags: ['마케팅 카피', '이메일'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1305', name: '브랜드 보이스 카피 체크', description: '카피가 브랜드 톤 가이드에 맞는지 점검해 수정 제안합니다.', url: 'https://example.com/agents/brand-copy-check', tags: ['마케팅 카피', '브랜드'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1401', name: '고객 응대 Q&A 봇', description: '자주 묻는 질문에 빠르고 일관된 답변을 제공합니다.', url: 'https://example.com/agents/customer-qa', tags: ['고객 응대', 'Q&A'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1402', name: '불만 티켓 분류기', description: '문의 내용을 감정/긴급도 기준으로 분류해 우선순위를 제안합니다.', url: 'https://example.com/agents/ticket-priority', tags: ['고객 응대', 'CS'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1403', name: '환불 정책 안내 어시스턴트', description: '고객 상황에 맞춰 환불/교환 정책을 친절히 안내합니다.', url: 'https://example.com/agents/refund-policy', tags: ['고객 응대', '정책'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1404', name: '온보딩 안내 챗봇', description: '신규 사용자 초기 설정 과정을 단계별로 안내합니다.', url: 'https://example.com/agents/onboarding-chat', tags: ['고객 응대', '온보딩'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' },
  { id: 'seed-1405', name: 'HR 정책 Q&A', description: '사내 인사 규정에 대한 질문에 답합니다.', url: 'https://example.com/agents/hr-qna', tags: ['고객 응대', 'HR'], embeddable: true, createdAt: '2026-06-19T09:00:00Z', updatedAt: '2026-06-19T09:00:00Z' }
];

export class AgentModel {
  constructor() {
    this.allAgents = [];
    this.activeTag = null;
    this.activeAgentId = null;
    this.embedRequestId = 0;
  }

  getUserAgents() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
  }

  setUserAgents(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  loadAgents() {
    this.allAgents = [...SEED_AGENTS, ...this.getUserAgents()];
    return this.allAgents;
  }

  addAgent(agent) {
    const list = this.getUserAgents();
    list.push(agent);
    this.setUserAgents(list);
    this.loadAgents();
  }

  validateAgentUrl(input) {
    let url;
    try { url = new URL(input); }
    catch { return { ok: false, message: '유효하지 않은 URL 형식입니다.' }; }
    const isLocalhost = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && isLocalhost)) {
      return { ok: false, message: 'HTTPS URL만 허용됩니다. (로컬 테스트는 http://localhost 허용)' };
    }
    if (ALLOWED_HOSTS.length && !ALLOWED_HOSTS.some(h => url.hostname === h || url.hostname.endsWith('.' + h))) {
      return { ok: false, message: '허용되지 않은 도메인입니다.' };
    }
    return { ok: true, value: url.toString() };
  }

  filterAgents(agents, query, tag) {
    const q = (query || '').trim().toLowerCase();
    return agents.filter(agent => {
      const matchTag = !tag || (agent.tags || []).includes(tag);
      const matchText = !q ||
        agent.name.toLowerCase().includes(q) ||
        agent.description.toLowerCase().includes(q) ||
        (agent.tags || []).some(t => t.toLowerCase().includes(q));
      return matchTag && matchText;
    });
  }

  filterMenuAgents(query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return this.allAgents;
    return this.allAgents.filter(agent => {
      const searchable = `${agent.name} ${agent.description} ${(agent.tags || []).join(' ')}`.toLowerCase();
      return searchable.includes(q);
    });
  }

  getTags() {
    return [...new Set(this.allAgents.flatMap(agent => agent.tags || []))].sort();
  }

  pickEmoji(agent) {
    const text = `${agent.name} ${(agent.tags || []).join(' ')}`.toLowerCase();
    if (text.includes('문서') || text.includes('요약')) return '📄';
    if (text.includes('코드') || text.includes('개발') || text.includes('프로그래밍')) return '💻';
    if (text.includes('데이터') || text.includes('분석')) return '📊';
    if (text.includes('뉴스') || text.includes('브리핑')) return '📰';
    if (text.includes('금융') || text.includes('주가') || text.includes('증시')) return '📈';
    if (text.includes('업황') || text.includes('채팅') || text.includes('브리핑')) return '💹';
    if (text.includes('마케팅') || text.includes('광고')) return '📣';
    if (text.includes('고객') || text.includes('q&a') || text.includes('상담')) return '💬';
    if (text.includes('hr') || text.includes('인사')) return '👥';
    if (text.includes('보안') || text.includes('정책')) return '🛡️';
    return '🤖';
  }
}

export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}
