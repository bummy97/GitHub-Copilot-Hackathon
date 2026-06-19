export class AgentView {
  constructor() {
    this.brand = this.$('#brand');
    this.navHome = this.$('#nav-home');
    this.navAgent = this.$('#nav-agent');
    this.navRegister = this.$('#nav-register-request');
    this.search = this.$('#search');
    this.tagFilter = this.$('#tag-filter');
    this.catalog = this.$('#catalog');
    this.empty = this.$('#empty');
    this.agentMenuSearch = this.$('#agent-menu-search');
    this.agentMenuTagFilter = this.$('#agent-menu-tag-filter');
    this.agentMenu = this.$('#agent-menu');
    this.runTitle = this.$('#run-title');
    this.runNewtab = this.$('#run-newtab');
    this.runBack = this.$('#run-back');
    this.frame = this.$('#agent-frame');
    this.fallback = this.$('#fallback');
    this.fallbackOpen = this.$('#fallback-open');
    this.cancelRegister = this.$('#cancel-register');
    this.registerForm = this.$('#register-form');
    this.quickCats = [...document.querySelectorAll('.quick-cat')];
  }

  $(sel) { return document.querySelector(sel); }

  showView(name) {
    ['catalog', 'register', 'run'].forEach(v => this.$('#view-' + v).classList.toggle('hidden', v !== name));
    if (name !== 'run') {
      this.frame.src = 'about:blank';
      this.fallback.classList.add('hidden');
    }
  }

  setRunTitle(text) { this.runTitle.textContent = text; }

  setEmptyVisible(visible) { this.empty.classList.toggle('hidden', !visible); }

  clearNode(node) { node.replaceChildren(); }

  renderTagFilter(tags, activeTag, onToggleTag) {
    this.clearNode(this.tagFilter);
    const makeChip = (label, value) => {
      const button = document.createElement('button');
      button.className = 'chip' + (activeTag === value ? ' active' : '');
      button.textContent = label;
      button.onclick = () => onToggleTag(value);
      return button;
    };
    this.tagFilter.append(makeChip('전체', null));
    tags.forEach(tag => this.tagFilter.append(makeChip('#' + tag, tag)));
  }

  renderCatalog(agents, pickEmoji, onRun) {
    this.clearNode(this.catalog);
    agents.forEach(agent => {
      const card = document.createElement('div');
      card.className = 'card';

      const thumb = document.createElement('div');
      thumb.className = 'card-thumb';

      const emoji = document.createElement('span');
      emoji.className = 'emoji';
      emoji.textContent = pickEmoji(agent);

      const thumbLabel = document.createElement('span');
      thumbLabel.className = 'thumb-label';
      thumbLabel.textContent = (agent.tags && agent.tags[0]) ? `#${agent.tags[0]}` : 'agent';
      thumb.append(emoji, thumbLabel);

      const h3 = document.createElement('h3');
      h3.textContent = agent.name;

      const desc = document.createElement('p');
      desc.className = 'desc';
      desc.textContent = agent.description;

      const tags = document.createElement('div');
      tags.className = 'card-tags';
      (agent.tags || []).forEach(tag => {
        const span = document.createElement('span');
        span.textContent = '#' + tag;
        tags.append(span);
      });

      const actions = document.createElement('div');
      actions.className = 'actions';
      const runBtn = document.createElement('button');
      runBtn.className = 'btn-primary';
      runBtn.textContent = '실행';
      runBtn.onclick = () => onRun(agent);
      actions.append(runBtn);

      card.append(thumb, h3, desc, tags, actions);
      this.catalog.append(card);
    });
  }

  renderAgentMenu(agents, activeAgentId, onSelect) {
    this.clearNode(this.agentMenu);
    if (!agents.length) {
      const empty = document.createElement('p');
      empty.className = 'empty';
      empty.textContent = '조건에 맞는 에이전트가 없습니다.';
      this.agentMenu.append(empty);
      return;
    }

    agents.forEach(agent => {
      const item = document.createElement('button');
      item.className = 'agent-menu-item' + (activeAgentId === agent.id ? ' active' : '');

      const name = document.createElement('span');
      name.className = 'agent-menu-name';
      name.textContent = agent.name;

      const desc = document.createElement('span');
      desc.className = 'agent-menu-desc';
      desc.textContent = agent.description;

      item.append(name, desc);
      item.onclick = () => onSelect(agent);
      this.agentMenu.append(item);
    });
  }

  renderAgentMenuTagFilter(tags, activeTag, onToggleTag) {
    this.clearNode(this.agentMenuTagFilter);

    const makeChip = (label, value) => {
      const button = document.createElement('button');
      button.className = 'chip' + (activeTag === value ? ' active' : '');
      button.textContent = label;
      button.onclick = () => onToggleTag(value);
      return button;
    };

    this.agentMenuTagFilter.append(makeChip('전체', null));
    tags.forEach(tag => this.agentMenuTagFilter.append(makeChip('#' + tag, tag)));
  }

  setError(id, msg) {
    this.$(`.error[data-for="${id}"]`).textContent = msg || '';
  }

  clearErrors() {
    ['f-name', 'f-desc', 'f-url'].forEach(id => this.setError(id, ''));
  }

  getRegisterInput() {
    return {
      name: this.$('#f-name').value.trim(),
      description: this.$('#f-desc').value.trim(),
      urlRaw: this.$('#f-url').value.trim(),
      tags: this.$('#f-tags').value.split(',').map(t => t.trim()).filter(Boolean)
    };
  }
}
