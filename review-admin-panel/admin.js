(function () {
  if (typeof reviewData === 'undefined') {
    document.body.innerHTML = '<p style="padding: 24px; font-family: Arial, sans-serif;">Could not find <code>reviewData</code>. Make sure <code>data.js</code> is in the same folder as <code>admin.html</code>.</p>';
    return;
  }

  const state = {
    data: cloneData(reviewData),
    activeSection: Object.keys(reviewData)[0] || null,
  };

  const sectionList = document.getElementById('sectionList');
  const sectionTitle = document.getElementById('sectionTitle');
  const sectionMeta = document.getElementById('sectionMeta');
  const cards = document.getElementById('cards');
  const output = document.getElementById('output');
  const status = document.getElementById('status');
  const newSectionName = document.getElementById('newSectionName');
  const addSectionBtn = document.getElementById('addSectionBtn');
  const addItemBtn = document.getElementById('addItemBtn');
  const renameSectionBtn = document.getElementById('renameSectionBtn');
  const deleteSectionBtn = document.getElementById('deleteSectionBtn');
  const generateBtn = document.getElementById('generateBtn');
  const copyBtn = document.getElementById('copyBtn');
  const downloadBtn = document.getElementById('downloadBtn');

  addSectionBtn.addEventListener('click', handleAddSection);
  addItemBtn.addEventListener('click', handleAddItem);
  renameSectionBtn.addEventListener('click', handleRenameSection);
  deleteSectionBtn.addEventListener('click', handleDeleteSection);
  generateBtn.addEventListener('click', handleGenerate);
  copyBtn.addEventListener('click', handleCopy);
  downloadBtn.addEventListener('click', handleDownload);

  render();
  handleGenerate();

  function render() {
    renderSections();
    renderActiveSection();
  }

  function renderSections() {
    const keys = Object.keys(state.data);
    if (!keys.length) {
      sectionList.innerHTML = '<p class="muted">No sections yet.</p>';
      return;
    }

    sectionList.innerHTML = keys
      .map((key) => {
        const count = state.data[key].length;
        const activeClass = key === state.activeSection ? 'active' : '';
        return `
          <button class="section-btn ${activeClass}" type="button" data-section="${escapeHtml(key)}">
            <span>${escapeHtml(key)}</span>
            <span class="tag">${count}</span>
          </button>
        `;
      })
      .join('');

    sectionList.querySelectorAll('[data-section]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeSection = button.dataset.section;
        render();
      });
    });
  }

  function renderActiveSection() {
    const key = state.activeSection;
    const items = key ? state.data[key] : null;

    if (!key || !items) {
      sectionTitle.textContent = 'No section selected';
      sectionMeta.textContent = 'Create a section to begin.';
      cards.innerHTML = '';
      addItemBtn.disabled = true;
      renameSectionBtn.disabled = true;
      deleteSectionBtn.disabled = true;
      return;
    }

    addItemBtn.disabled = false;
    renameSectionBtn.disabled = false;
    deleteSectionBtn.disabled = false;

    sectionTitle.textContent = key;
    sectionMeta.textContent = `${items.length} item${items.length === 1 ? '' : 's'} in this section.`;

    if (!items.length) {
      cards.innerHTML = '<div class="card"><p class="muted">This section is empty. Add your first item.</p></div>';
      return;
    }

    cards.innerHTML = items
      .map((item, index) => renderCard(item, index, items.length))
      .join('');

    bindCardEvents();
  }

  function renderCard(item, index, total) {
    const safe = normalizeItem(item);
    const imagePreview = safe.image
      ? `<img src="${escapeAttribute(safe.image)}" alt="${escapeAttribute(safe.alt || safe.title || 'Preview')}" onerror="this.style.display='none'">`
      : '<span class="muted">No image path</span>';

    return `
      <article class="card" data-index="${index}">
        <div class="card-head">
          <div class="card-head-left">
            <h3>${escapeHtml(safe.title || `Item ${index + 1}`)}</h3>
            <div class="tag">${escapeHtml(safe.key || `item-${index + 1}`)}</div>
          </div>
          <div class="card-actions">
            <button type="button" data-action="move-up" ${index === 0 ? 'disabled' : ''}>↑ Up</button>
            <button type="button" data-action="move-down" ${index === total - 1 ? 'disabled' : ''}>↓ Down</button>
            <button type="button" data-action="duplicate">Duplicate</button>
            <button type="button" data-action="delete" class="danger">Delete</button>
          </div>
        </div>

        <div class="grid">
          <div class="field">
            <label>Key</label>
            <input type="text" data-field="key" value="${escapeAttribute(safe.key)}" placeholder="happy" />
          </div>
          <div class="field">
            <label>Title</label>
            <input type="text" data-field="title" value="${escapeAttribute(safe.title)}" placeholder="Happy" />
          </div>
          <div class="field">
            <label>Image path</label>
            <input type="text" data-field="image" value="${escapeAttribute(safe.image)}" placeholder="assets/images/happy.webp" />
          </div>
          <div class="field">
            <label>Alt text</label>
            <input type="text" data-field="alt" value="${escapeAttribute(safe.alt)}" placeholder="Happy bear" />
          </div>
          <div class="field">
            <label>Word audio</label>
            <input type="text" data-field="wordAudio" value="${escapeAttribute(safe.wordAudio)}" placeholder="assets/audio/happy.mp3" />
          </div>
          <div class="field">
            <label>Sentence audio</label>
            <input type="text" data-field="sentenceAudio" value="${escapeAttribute(safe.sentenceAudio)}" placeholder="assets/audio/happy-sentence.mp3" />
          </div>
          <div class="field full">
            <label>Sentence text</label>
            <textarea data-field="sentenceText" placeholder="I am happy.">${escapeHtml(safe.sentenceText)}</textarea>
          </div>
          <div class="field full">
            <div class="preview-box">
              <strong>Image preview</strong>
              ${imagePreview}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  function bindCardEvents() {
    cards.querySelectorAll('.card').forEach((card) => {
      const index = Number(card.dataset.index);

      card.querySelectorAll('[data-field]').forEach((input) => {
        const eventName = input.tagName === 'TEXTAREA' ? 'input' : 'blur';
        input.addEventListener(eventName, () => {
          state.data[state.activeSection][index][input.dataset.field] = input.value;
          if (input.dataset.field === 'title' || input.dataset.field === 'key' || input.dataset.field === 'image' || input.dataset.field === 'alt') {
            renderActiveSection();
          }
          clearStatus();
        });
      });

      card.querySelectorAll('[data-action]').forEach((button) => {
        button.addEventListener('click', () => {
          const action = button.dataset.action;
          if (action === 'move-up') moveItem(index, index - 1);
          if (action === 'move-down') moveItem(index, index + 1);
          if (action === 'duplicate') duplicateItem(index);
          if (action === 'delete') deleteItem(index);
        });
      });
    });
  }

  function handleAddSection() {
    const raw = newSectionName.value.trim();
    const key = slugify(raw);

    if (!key) {
      setStatus('Enter a section name first.', 'error');
      return;
    }

    if (state.data[key]) {
      setStatus(`Section "${key}" already exists.`, 'error');
      return;
    }

    state.data[key] = [];
    state.activeSection = key;
    newSectionName.value = '';
    render();
    setStatus(`Section "${key}" added.`, 'ok');
  }

  function handleRenameSection() {
    const current = state.activeSection;
    if (!current) return;

    const input = prompt('Rename section:', current);
    if (input === null) return;

    const nextKey = slugify(input);
    if (!nextKey) {
      setStatus('Section name cannot be empty.', 'error');
      return;
    }

    if (nextKey !== current && state.data[nextKey]) {
      setStatus(`Section "${nextKey}" already exists.`, 'error');
      return;
    }

    const entries = Object.entries(state.data).map(([key, value]) => [key === current ? nextKey : key, value]);
    state.data = Object.fromEntries(entries);
    state.activeSection = nextKey;
    render();
    setStatus(`Section renamed to "${nextKey}".`, 'ok');
  }

  function handleDeleteSection() {
    const current = state.activeSection;
    if (!current) return;

    const confirmed = confirm(`Delete section "${current}" and all of its items?`);
    if (!confirmed) return;

    delete state.data[current];
    state.activeSection = Object.keys(state.data)[0] || null;
    render();
    clearStatus();
  }

  function handleAddItem() {
    if (!state.activeSection) return;
    state.data[state.activeSection].push(createEmptyItem());
    renderActiveSection();
    clearStatus();
  }

  function moveItem(fromIndex, toIndex) {
    const items = state.data[state.activeSection];
    if (!items || toIndex < 0 || toIndex >= items.length) return;

    const [moved] = items.splice(fromIndex, 1);
    items.splice(toIndex, 0, moved);
    renderActiveSection();
    clearStatus();
  }

  function duplicateItem(index) {
    const items = state.data[state.activeSection];
    const original = normalizeItem(items[index]);
    const copy = {
      ...original,
      key: original.key ? `${original.key}-copy` : 'new-item-copy',
      title: original.title ? `${original.title} Copy` : 'New Item Copy',
    };
    items.splice(index + 1, 0, copy);
    renderActiveSection();
    clearStatus();
  }

  function deleteItem(index) {
    const items = state.data[state.activeSection];
    items.splice(index, 1);
    renderActiveSection();
    clearStatus();
  }

  function handleGenerate() {
    const cleanData = sanitizeData(state.data);
    output.value = buildJsFile(cleanData);
    setStatus('Generated fresh data.js content.', 'ok');
  }

  async function handleCopy() {
    if (!output.value.trim()) handleGenerate();
    try {
      await navigator.clipboard.writeText(output.value);
      setStatus('Copied generated data.js to clipboard.', 'ok');
    } catch (error) {
      setStatus('Copy failed. Select the text manually and copy it.', 'error');
    }
  }

  function handleDownload() {
    if (!output.value.trim()) handleGenerate();
    const blob = new Blob([output.value], { type: 'application/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.js';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus('Downloaded a new data.js file.', 'ok');
  }

  function sanitizeData(data) {
    const entries = Object.entries(data).map(([key, items]) => {
      const cleanKey = slugify(key) || 'section';
      const cleanItems = items.map((item) => normalizeItem(item));
      return [cleanKey, cleanItems];
    });
    return Object.fromEntries(entries);
  }

  function buildJsFile(data) {
    const body = formatValue(data, 0);
    return `const reviewData = ${body};\n`;
  }

  function formatValue(value, level) {
    const indent = '  '.repeat(level);
    const nextIndent = '  '.repeat(level + 1);

    if (Array.isArray(value)) {
      if (!value.length) return '[]';
      const items = value.map((item) => `${nextIndent}${formatValue(item, level + 1)}`);
      return `[\n${items.join(',\n')}\n${indent}]`;
    }

    if (value && typeof value === 'object') {
      const entries = Object.entries(value);
      if (!entries.length) return '{}';
      const props = entries.map(([key, val]) => {
        const propKey = isValidIdentifier(key) ? key : JSON.stringify(key);
        return `${nextIndent}${propKey}: ${formatValue(val, level + 1)}`;
      });
      return `{\n${props.join(',\n')}\n${indent}}`;
    }

    return JSON.stringify(value ?? '');
  }

  function createEmptyItem() {
    return {
      key: 'new-item',
      title: 'New Item',
      image: '',
      alt: '',
      wordAudio: '',
      sentenceText: '',
      sentenceAudio: '',
    };
  }

  function normalizeItem(item) {
    return {
      key: asString(item.key),
      title: asString(item.title),
      image: asString(item.image),
      alt: asString(item.alt),
      wordAudio: asString(item.wordAudio),
      sentenceText: asString(item.sentenceText),
      sentenceAudio: asString(item.sentenceAudio),
    };
  }

  function cloneData(data) {
    return JSON.parse(JSON.stringify(data));
  }

  function asString(value) {
    return typeof value === 'string' ? value : '';
  }

  function slugify(value) {
    return String(value)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function isValidIdentifier(value) {
    return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(value);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function setStatus(message, kind) {
    status.textContent = message;
    status.className = `status ${kind || ''}`.trim();
  }

  function clearStatus() {
    setStatus('Unsaved changes in the editor.', '');
  }
})();
