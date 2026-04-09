(function () {

  if (typeof reviewData === 'undefined') {
    alert("data.js not found");
    return;
  }

  const state = {
    data: JSON.parse(JSON.stringify(reviewData)),
    active: Object.keys(reviewData)[0]
  };

  const sectionList = document.getElementById('sectionList');
  const cards = document.getElementById('cards');
  const output = document.getElementById('output');

  const settings = {
    imageFolder: document.getElementById('imageFolder'),
    audioFolder: document.getElementById('audioFolder'),
    imageExt: document.getElementById('imageExt'),
    audioExt: document.getElementById('audioExt'),
    sentenceSuffix: document.getElementById('sentenceSuffix'),
    autoKey: document.getElementById('autoKey'),
    autoAlt: document.getElementById('autoAlt')
  };

  document.getElementById('addSectionBtn').onclick = () => {
    const key = document.getElementById('newSectionName').value.trim();
    if (!key) return;
    state.data[key] = [];
    state.active = key;
    render();
  };

  document.getElementById('addItemBtn').onclick = () => {
    state.data[state.active].push({
      title: '',
      sentenceText: ''
    });
    renderCards();
  };

  document.getElementById('generateBtn').onclick = generate;

  function render() {
    renderSections();
    renderCards();
  }

  function renderSections() {
    sectionList.innerHTML = Object.keys(state.data)
      .map(k => `<button data-k="${k}">${k}</button>`)
      .join('');

    sectionList.querySelectorAll('button').forEach(btn => {
      btn.onclick = () => {
        state.active = btn.dataset.k;
        renderCards();
      };
    });
  }

  function renderCards() {
    const items = state.data[state.active];

    cards.innerHTML = items.map((item, i) => `
      <div class="card" data-i="${i}">
        <input placeholder="Title" value="${item.title || ''}" data-f="title"/>
        <textarea placeholder="Sentence">${item.sentenceText || ''}</textarea>
        <button data-del="${i}" class="danger">Delete</button>
      </div>
    `).join('');

    cards.querySelectorAll('.card').forEach(card => {
      const i = card.dataset.i;

      card.querySelector('[data-f="title"]').oninput = e => {
        state.data[state.active][i].title = e.target.value;
      };

      card.querySelector('textarea').oninput = e => {
        state.data[state.active][i].sentenceText = e.target.value;
      };

      card.querySelector('[data-del]').onclick = () => {
        state.data[state.active].splice(i, 1);
        renderCards();
      };
    });
  }

  function generate() {
    const result = {};

    for (const section in state.data) {
      result[section] = state.data[section].map(item => buildItem(item));
    }

    output.value = "const reviewData = " + JSON.stringify(result, null, 2);
  }

  function buildItem(item) {
    const title = item.title || '';
    const key = settings.autoKey.checked ? slug(title) : title;

    const imageFolder = settings.imageFolder.value || 'assets/images';
    const audioFolder = settings.audioFolder.value || 'assets/audio';
    const imgExt = settings.imageExt.value || '.webp';
    const audExt = settings.audioExt.value || '.mp3';
    const suffix = settings.sentenceSuffix.value || '-sentence';

    return {
      key,
      title,
      image: `${imageFolder}/${key}${imgExt}`,
      alt: settings.autoAlt.checked ? title : '',
      wordAudio: `${audioFolder}/${key}${audExt}`,
      sentenceText: item.sentenceText || '',
      sentenceAudio: `${audioFolder}/${key}${suffix}${audExt}`
    };
  }

  function slug(str) {
    return str.toLowerCase().replace(/\s+/g, '-');
  }

  render();

})();