import { beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { AgentModel } from '../js/model/agentModel.js';

function createLocalStorage(seed = []) {
  const store = new Map();
  store.set('agentPortal.userAgents', JSON.stringify(seed));
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    snapshot(key) {
      return store.get(key);
    }
  };
}

beforeEach(() => {
  globalThis.localStorage = createLocalStorage();
});

describe('AgentModel', () => {
  test('validateAgentUrl accepts https and localhost http', () => {
    const model = new AgentModel();

    const httpsResult = model.validateAgentUrl('https://example.com/agent');
    assert.equal(httpsResult.ok, true);
    assert.equal(httpsResult.value, 'https://example.com/agent');

    const localhostResult = model.validateAgentUrl('http://localhost:5600/chat');
    assert.equal(localhostResult.ok, true);
    assert.equal(localhostResult.value, 'http://localhost:5600/chat');
  });

  test('validateAgentUrl rejects insecure non-localhost urls', () => {
    const model = new AgentModel();

    const result = model.validateAgentUrl('http://example.com/agent');
    assert.equal(result.ok, false);
    assert.match(result.message, /HTTPS URL만 허용됩니다/);
  });

  test('loadAgents merges seed and stored agents', () => {
    globalThis.localStorage = createLocalStorage([
      {
        id: 'user-1',
        name: '사용자 에이전트',
        description: '로컬 저장 테스트',
        url: 'https://example.com/user-agent',
        tags: ['테스트'],
        embeddable: true,
        createdAt: '2026-06-19T00:00:00Z',
        updatedAt: '2026-06-19T00:00:00Z'
      }
    ]);

    const model = new AgentModel();
    const agents = model.loadAgents();

    assert.equal(agents.some(agent => agent.id === 'seed-0801'), true);
    assert.equal(agents.some(agent => agent.id === 'user-1'), true);
  });

  test('filterAgents and filterMenuAgents search across name, description, and tags', () => {
    const model = new AgentModel();
    model.allAgents = [
      {
        id: 'a1',
        name: '회의록 요약 봇',
        description: '회의 내용을 빠르게 정리합니다.',
        tags: ['문서 요약', '생산성']
      },
      {
        id: 'a2',
        name: '코드 리뷰 도우미',
        description: 'PR 변경분을 점검합니다.',
        tags: ['코드 리뷰', '개발']
      }
    ];

    assert.equal(model.filterAgents(model.allAgents, '회의', null).length, 1);
    assert.equal(model.filterAgents(model.allAgents, '', '코드 리뷰')[0].id, 'a2');
    assert.equal(model.filterMenuAgents('pr').length, 1);
    assert.equal(model.filterMenuAgents('생산성').length, 1);
  });

  test('getTags returns unique sorted tags', () => {
    const model = new AgentModel();
    model.allAgents = [
      { id: 'a1', tags: ['B', 'A'] },
      { id: 'a2', tags: ['C', 'A'] },
      { id: 'a3', tags: [] }
    ];

    assert.deepEqual(model.getTags(), ['A', 'B', 'C']);
  });

  test('pickEmoji maps news and analytics agents to clearer icons', () => {
    const model = new AgentModel();

    assert.equal(
      model.pickEmoji({ name: '대덕전자 뉴스 확인', tags: ['대덕전자 인사이트', '뉴스', '주가'] }),
      '📰'
    );
    assert.equal(
      model.pickEmoji({ name: '매출 인사이트 분석기', tags: ['데이터 분석', '매출'] }),
      '📊'
    );
  });

  test('addAgent persists to localStorage and reloads the list', () => {
    const model = new AgentModel();
    const before = model.loadAgents().length;

    model.addAgent({
      id: 'user-2',
      name: '새 사용자 에이전트',
      description: '등록 테스트',
      url: 'https://example.com/new-agent',
      tags: ['테스트'],
      embeddable: true,
      createdAt: '2026-06-19T00:00:00Z',
      updatedAt: '2026-06-19T00:00:00Z'
    });

    assert.equal(model.allAgents.length, before + 1);
    assert.equal(JSON.parse(globalThis.localStorage.getItem('agentPortal.userAgents')).length, 1);
    assert.equal(model.allAgents.some(agent => agent.id === 'user-2'), true);
  });
});
