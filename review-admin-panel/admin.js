(function () {
  'use strict';

  if (typeof reviewData === 'undefined') {
    document.body.textContent = 'The current data.js file could not be loaded.';
    return;
  }

  const editableFields = [
    { key: 'key', label: 'Key', type: 'text' },
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'alt', label: 'Image description (alt text)', type: 'text' },
    { key: 'image', label: 'Image path', type: 'text' },
    { key: 'wordAudio', label: 'Word audio path', type: 'text' },
    { key: 'sentenceText', label: 'Sentence', type: 'textarea', full: true },
    { key: 'sentenceAudio', label: 'Sentence audio path', type: 'text' },
  ];

  const initialData = cloneData(reviewData);
  const state = {
    data: cloneData(reviewData),
    active: Object.keys(reviewData)[0] || '',
    query: '',
    dirty: false,
    fileHandle: null,
  };

  const sectionList = document.getElementById('sectionList');
  const cards = document.getElementById('cards');
  const output = document.getElementById('output');
  const statusEl = document.getElementById('status');
  const sectionTitle = document.getElementById('sectionTitle');
  const sectionMeta = document.getElementById('sectionMeta');
  const searchInput = document.getElementById('searchItems');
  const saveFileButton = document.getElementById('saveFileBtn');
  const fileSupport = document.getElementById('fileSupport');
  const dirtyIndicator = document.getElementById('dirtyIndicator');

  function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function setStatus(message, type = '') {
    statusEl.textContent = message;
    statusEl.className = 'status' + (type ? ' ' + type : '');
  }

  function setDirty(dirty = true) {
    state.dirty = dirty;
    document.body.dataset.dirty = String(dirty);
    document.title = (dirty ? '• ' : '') + 'Review Admin Panel';
    dirtyIndicator.textContent = dirty ? 'Unsaved changes.' : 'No unsaved changes.';
  }

  function getActiveItems() {
    return state.data[state.active] || [];
  }

  function createButton(label, className, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    if (className) button.className = className;
    button.addEventListener('click', onClick);
    return button;
  }

  function renderSections() {
    sectionList.replaceChildren();

    Object.keys(state.data).forEach((key) => {
      const button = document.createElement('button');
      const name = document.createElement('span');
      const count = document.createElement('span');
      const isActive = key === state.active;

      button.type = 'button';
      button.className = 'section-btn' + (isActive ? ' active' : '');
      button.dataset.key = key;
      button.setAttribute('aria-pressed', String(isActive));
      name.className = 'section-name';
      name.textContent = key;
      count.className = 'badge';
      count.textContent = String(state.data[key].length);
      button.append(name, count);

      button.addEventListener('click', () => {
        state.active = key;
        state.query = '';
        searchInput.value = '';
        render();
      });

      sectionList.appendChild(button);
    });
  }

  function createField(item, itemIndex, definition) {
    const wrapper = document.createElement('div');
    const label = document.createElement('label');
    const id = 'item-' + itemIndex + '-' + definition.key;
    const control = document.createElement(definition.type === 'textarea' ? 'textarea' : 'input');

    wrapper.className = 'field' + (definition.full ? ' full' : '');
    label.htmlFor = id;
    label.textContent = definition.label;
    control.id = id;
    control.value = item[definition.key] ?? '';
    if (definition.type !== 'textarea') control.type = 'text';
    control.autocomplete = 'off';

    control.addEventListener('input', () => {
      item[definition.key] = control.value;
      setDirty();

      if (definition.key === 'title') {
        const heading = document.getElementById('item-heading-' + itemIndex);
        if (heading) heading.textContent = control.value || 'Untitled card';
      }
    });

    wrapper.append(label, control);
    return wrapper;
  }

  function moveItem(fromIndex, direction) {
    const items = getActiveItems();
    const targetIndex = fromIndex + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    [items[fromIndex], items[targetIndex]] = [items[targetIndex], items[fromIndex]];
    setDirty();
    renderCards();
  }

  function deleteItem(index) {
    const item = getActiveItems()[index];
    const label = item?.title || item?.key || 'this card';
    if (!window.confirm('Delete ' + label + '?')) return;

    getActiveItems().splice(index, 1);
    setDirty();
    render();
  }

  function renderCards() {
    const items = getActiveItems();
    const query = state.query.trim().toLowerCase();
    const matches = items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !query || editableFields.some(({ key }) => String(item[key] || '').toLowerCase().includes(query)));

    cards.replaceChildren();
    sectionTitle.textContent = state.active || 'No section selected';
    sectionMeta.textContent = items.length + ' card' + (items.length === 1 ? '' : 's') + (query ? ', ' + matches.length + ' shown' : '');

    if (!state.active) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'Add a section to begin.';
      cards.appendChild(empty);
      return;
    }

    if (matches.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = query ? 'No cards match this search.' : 'This section has no cards yet.';
      cards.appendChild(empty);
      return;
    }

    matches.forEach(({ item, index }) => {
      const card = document.createElement('article');
      const header = document.createElement('div');
      const titleWrap = document.createElement('div');
      const title = document.createElement('h3');
      const subtitle = document.createElement('p');
      const actions = document.createElement('div');
      const fields = document.createElement('div');

      card.className = 'card';
      header.className = 'card-header';
      titleWrap.className = 'card-title-wrap';
      title.className = 'card-title';
      title.id = 'item-heading-' + index;
      title.textContent = item.title || 'Untitled card';
      subtitle.className = 'card-subtitle';
      subtitle.textContent = 'Card ' + (index + 1) + ' · Values and paths are preserved exactly.';
      actions.className = 'mini-actions';
      fields.className = 'grid';

      const up = createButton('Move up', '', () => moveItem(index, -1));
      const down = createButton('Move down', '', () => moveItem(index, 1));
      const remove = createButton('Delete', 'danger', () => deleteItem(index));
      up.disabled = index === 0;
      down.disabled = index === items.length - 1;
      actions.append(up, down, remove);
      titleWrap.append(title, subtitle);
      header.append(titleWrap, actions);

      editableFields.forEach((definition) => {
        fields.appendChild(createField(item, index, definition));
      });

      card.setAttribute('aria-labelledby', title.id);
      card.append(header, fields);
      cards.appendChild(card);
    });
  }

  function render() {
    renderSections();
    renderCards();
  }

  function addSection() {
    const input = document.getElementById('newSectionName');
    const key = input.value.trim();
    if (!key) {
      setStatus('Enter a section key first.', 'error');
      input.focus();
      return;
    }
    if (Object.prototype.hasOwnProperty.call(state.data, key)) {
      setStatus('That section already exists.', 'error');
      return;
    }

    state.data[key] = [];
    state.active = key;
    input.value = '';
    setDirty();
    render();
    setStatus('Section added.', 'ok');
  }

  function renameSection() {
    if (!state.active) return;
    const nextKey = window.prompt('Rename section:', state.active)?.trim();
    if (!nextKey || nextKey === state.active) return;
    if (Object.prototype.hasOwnProperty.call(state.data, nextKey)) {
      setStatus('That section already exists.', 'error');
      return;
    }

    const renamed = {};
    Object.keys(state.data).forEach((key) => {
      renamed[key === state.active ? nextKey : key] = state.data[key];
    });
    state.data = renamed;
    state.active = nextKey;
    setDirty();
    render();
    setStatus('Section renamed. Card paths were not changed.', 'ok');
  }

  function deleteSection() {
    if (!state.active) return;
    if (!window.confirm('Delete the entire ' + state.active + ' section?')) return;

    delete state.data[state.active];
    state.active = Object.keys(state.data)[0] || '';
    setDirty();
    render();
    setStatus('Section deleted.', 'ok');
  }

  function addItem() {
    if (!state.active) {
      setStatus('Add a section before adding a card.', 'error');
      return;
    }

    getActiveItems().push({
      key: '',
      title: '',
      image: '',
      alt: '',
      wordAudio: '',
      sentenceText: '',
      sentenceAudio: '',
    });
    setDirty();
    render();

    const newCard = cards.lastElementChild;
    newCard?.querySelector('input')?.focus();
  }

  function buildSource() {
    return 'const reviewData = ' + JSON.stringify(state.data, null, 2) + ';\n';
  }

  function refreshPreview() {
    output.value = buildSource();
    setStatus('Preview refreshed. Existing paths and extensions were preserved.', 'ok');
  }

  async function copySource() {
    const source = buildSource();
    output.value = source;
    try {
      await navigator.clipboard.writeText(source);
      setStatus('Exact source copied to the clipboard.', 'ok');
    } catch {
      output.select();
      document.execCommand('copy');
      setStatus('Exact source copied to the clipboard.', 'ok');
    }
  }

  function downloadSource() {
    const blob = new Blob([buildSource()], { type: 'text/javascript;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data.js';
    link.click();
    URL.revokeObjectURL(url);
    setStatus('Exact data.js copy downloaded.', 'ok');
  }

  function parseDataSource(source) {
    const parsed = new Function(source + '\nreturn reviewData;')();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('The selected file does not define a reviewData object.');
    }
    Object.entries(parsed).forEach(([key, value]) => {
      if (!Array.isArray(value)) throw new Error('Section ' + key + ' is not an array.');
    });
    return cloneData(parsed);
  }

  async function openDataFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JavaScript data file', accept: { 'text/javascript': ['.js'] } }],
        multiple: false,
      });
      const file = await handle.getFile();
      const source = await file.text();
      const data = parseDataSource(source);

      state.data = data;
      state.active = Object.keys(data)[0] || '';
      state.fileHandle = handle;
      saveFileButton.disabled = false;
      setDirty(false);
      render();
      refreshPreview();
      setStatus('Opened ' + file.name + '. All stored paths were kept exactly.', 'ok');
    } catch (error) {
      if (error?.name !== 'AbortError') setStatus(error.message || 'The file could not be opened.', 'error');
    }
  }

  async function saveDataFile() {
    if (!state.fileHandle) {
      setStatus('Open a data.js file before using Save.', 'error');
      return;
    }

    try {
      const writable = await state.fileHandle.createWritable();
      await writable.write(buildSource());
      await writable.close();
      setDirty(false);
      refreshPreview();
      setStatus('Saved to the opened data.js file.', 'ok');
    } catch (error) {
      setStatus(error.message || 'The file could not be saved.', 'error');
    }
  }

  function resetToSiteData() {
    if (state.dirty && !window.confirm('Discard unsaved admin changes and reload the website data?')) return;
    state.data = cloneData(initialData);
    state.active = Object.keys(state.data)[0] || '';
    state.fileHandle = null;
    saveFileButton.disabled = true;
    setDirty(false);
    render();
    refreshPreview();
    setStatus('Reloaded the website data.', 'ok');
  }

  document.getElementById('addSectionBtn').addEventListener('click', addSection);
  document.getElementById('addItemBtn').addEventListener('click', addItem);
  document.getElementById('renameSectionBtn').addEventListener('click', renameSection);
  document.getElementById('deleteSectionBtn').addEventListener('click', deleteSection);
  document.getElementById('previewBtn').addEventListener('click', refreshPreview);
  document.getElementById('copyBtn').addEventListener('click', copySource);
  document.getElementById('downloadBtn').addEventListener('click', downloadSource);
  document.getElementById('openFileBtn').addEventListener('click', openDataFile);
  document.getElementById('saveFileBtn').addEventListener('click', saveDataFile);
  document.getElementById('resetBtn').addEventListener('click', resetToSiteData);

  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    renderCards();
  });

  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  const supportsFileAccess = 'showOpenFilePicker' in window;
  document.getElementById('openFileBtn').disabled = !supportsFileAccess;
  fileSupport.textContent = supportsFileAccess
    ? 'Direct open/save is available. Choose only a trusted data.js file.'
    : 'Direct file editing is unavailable in this browser. Copy or download an exact source copy instead.';

  render();
  refreshPreview();
  setDirty(false);
})();
