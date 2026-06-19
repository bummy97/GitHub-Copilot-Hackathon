import { AgentModel, EMBED_TIMEOUT_MS, SEARCH_DEBOUNCE_MS, debounce } from '../model/agentModel.js';
import { AgentView } from '../view/agentView.js';

const model = new AgentModel();
const view = new AgentView();
let activeAgentMenuTag = null;

function renderTagFilter() {
  view.renderTagFilter(model.getTags(), model.activeTag, value => {
    // 태그 선택 시 기존 검색어와 충돌해 결과가 0개가 되는 상황을 방지
    view.search.value = '';
    model.activeTag = (model.activeTag === value) ? null : value;
    renderAll();
  });
}

function renderCatalog() {
  const list = model.filterAgents(model.allAgents, view.search.value, model.activeTag);
  view.renderCatalog(list, agent => model.pickEmoji(agent), openAgent);
  view.setEmptyVisible(list.length === 0);
}

function renderAgentMenu() {
  const menuList = model.filterMenuAgents(view.agentMenuSearch?.value || '', activeAgentMenuTag);
  view.renderAgentMenu(menuList, model.activeAgentId, openAgent);
}

function renderAgentMenuTagFilter() {
  view.renderAgentMenuTagFilter(model.getTags(), activeAgentMenuTag, value => {
    activeAgentMenuTag = (activeAgentMenuTag === value) ? null : value;
    renderAgentMenu();
  });
}

function renderAll() {
  renderTagFilter();
  renderAgentMenuTagFilter();
  renderCatalog();
  renderAgentMenu();
}

function openAgent(agent) {
  model.activeAgentId = agent.id;
  renderAgentMenu();
  view.showView('run');
  view.setRunTitle(agent.name);
  view.fallback.classList.add('hidden');

  const checked = model.validateAgentUrl(agent.url || '');
  if (!checked.ok) {
    view.frame.src = 'about:blank';
    view.fallback.classList.remove('hidden');
    view.runNewtab.onclick = null;
    view.fallbackOpen.onclick = null;
    return;
  }

  const requestId = ++model.embedRequestId;
  let loaded = false;
  view.frame.addEventListener('load', () => { loaded = true; }, { once: true });
  view.frame.src = checked.value;

  const openNewTab = () => window.open(checked.value, '_blank', 'noopener');
  view.runNewtab.onclick = openNewTab;
  view.fallbackOpen.onclick = openNewTab;

  setTimeout(() => {
    if (requestId !== model.embedRequestId) return;
    if (!loaded) view.fallback.classList.remove('hidden');
  }, EMBED_TIMEOUT_MS);
}

function handleRegister(e) {
  e.preventDefault();
  const { name, description, urlRaw, tags } = view.getRegisterInput();
  view.clearErrors();

  let valid = true;
  if (!name) { view.setError('f-name', '이름을 입력하세요.'); valid = false; }
  if (!description) { view.setError('f-desc', '설명을 입력하세요.'); valid = false; }

  const urlCheck = model.validateAgentUrl(urlRaw);
  if (!urlCheck.ok) { view.setError('f-url', urlCheck.message); valid = false; }
  if (!valid) return;

  const now = new Date().toISOString();
  model.addAgent({
    id: crypto.randomUUID(),
    name,
    description,
    url: urlCheck.value,
    tags,
    embeddable: null,
    createdAt: now,
    updatedAt: now
  });

  e.target.reset();
  model.activeTag = null;
  activeAgentMenuTag = null;
  view.showView('catalog');
  renderAll();
}

function bindEvents() {
  view.brand.onclick = () => view.showView('catalog');
  view.navHome.onclick = () => view.showView('catalog');
  view.navAgent.onclick = () => {
    const target = model.allAgents.find(a => a.id === model.activeAgentId) || model.allAgents[0];
    if (target) openAgent(target);
    else view.showView('run');
  };
  view.navRegister.onclick = () => view.showView('register');
  view.cancelRegister.onclick = () => view.showView('catalog');

  const agentLayout = document.querySelector('.agent-layout');
  const runExpand = document.getElementById('run-expand');
  runExpand.addEventListener('click', () => {
    const isWide = agentLayout.classList.toggle('wide');
    runExpand.textContent = isWide ? '⛶ 원래 보기' : '⛶ 넓게 보기';
  });

  view.runBack.onclick = () => { agentLayout.classList.remove('wide'); runExpand.textContent = '⛶ 넓게 보기'; view.showView('catalog'); };

  view.search.addEventListener('input', debounce(renderCatalog, SEARCH_DEBOUNCE_MS));
  view.agentMenuSearch.addEventListener('input', debounce(renderAgentMenu, SEARCH_DEBOUNCE_MS));
  view.quickCats.forEach(btn => {
    btn.addEventListener('click', () => {
      // 빠른 카테고리는 검색 기반 UX이므로 태그 필터는 해제
      model.activeTag = null;
      view.search.value = btn.textContent.trim();
      renderCatalog();
      renderTagFilter();
    });
  });

  view.registerForm.addEventListener('submit', handleRegister);
}

function init() {
  model.loadAgents();
  bindEvents();
  renderAll();
}

init();
