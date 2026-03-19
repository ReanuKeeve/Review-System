let currentAudio = null;
let isPlaying = false;
let currentMode = 'words';
let currentCards = [];

function stopCurrentAudio() {
  if (!currentAudio) return;

  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
  isPlaying = false;
}

function playSound(id) {
  if (isPlaying) return;

  const audio = document.getElementById(id);
  if (!audio) return;

  currentAudio = audio;
  isPlaying = true;

  audio.currentTime = 0;

  const cleanup = () => {
    if (currentAudio === audio) {
      currentAudio = null;
      isPlaying = false;
    }
    audio.removeEventListener('ended', cleanup);
    audio.removeEventListener('pause', handlePause);
  };

  const handlePause = () => {
    if (!audio.ended) {
      cleanup();
    }
  };

  audio.addEventListener('ended', cleanup);
  audio.addEventListener('pause', handlePause);

  audio.play().catch(() => {
    cleanup();
  });
}

function hasSentenceAudio(card) {
  return Boolean(card.sentenceAudio);
}

function hasSentenceMode(cards) {
  return cards.some(hasSentenceAudio);
}

function playCard(cardKey) {
  const audioId = `audio-${cardKey}-${currentMode}`;
  playSound(audioId);
}

function updateTabUI(mode) {
  const wordsTab = document.getElementById('tab-words');
  const sentencesTab = document.getElementById('tab-sentences');
  const sentenceModeAvailable = hasSentenceMode(currentCards);

  if (wordsTab) {
    const isActive = mode === 'words';
    wordsTab.classList.toggle('active', isActive);
    wordsTab.setAttribute('aria-selected', String(isActive));
  }

  if (sentencesTab) {
    const isActive = mode === 'sentences' && sentenceModeAvailable;
    sentencesTab.disabled = !sentenceModeAvailable;
    sentencesTab.setAttribute('aria-disabled', String(!sentenceModeAvailable));
    sentencesTab.classList.toggle('active', isActive);
    sentencesTab.setAttribute('aria-selected', String(isActive));
  }
}

function setMode(mode) {
  if (mode !== 'words' && mode !== 'sentences') return;
  if (mode === 'sentences' && !hasSentenceMode(currentCards)) return;
  if (mode === currentMode) return;

  stopCurrentAudio();
  currentMode = mode;
  updateTabUI(mode);
  renderCards();
}

function renderCards() {
  const container = document.getElementById('card-container');
  if (!container) return;

  container.innerHTML = '';

  const cardsToRender = currentMode === 'sentences'
    ? currentCards.filter(hasSentenceAudio)
    : currentCards;

  cardsToRender.forEach((card) => {
    const article = document.createElement('article');
    article.className = 'card';

    if (card.image) {
      const imageFrame = document.createElement('div');
      imageFrame.className = 'image-frame';

      const img = document.createElement('img');
      img.src = card.image;
      img.alt = card.alt || card.title;
      img.loading = 'lazy';
      imageFrame.appendChild(img);
      article.appendChild(imageFrame);
    }

    const body = document.createElement('div');
    body.className = 'card-body';

    const title = document.createElement('h2');
    title.className = 'card-title';
    const displayTitle = currentMode === 'words'
      ? card.title
      : (card.sentenceTitle || card.sentenceText || card.title);
    title.textContent = displayTitle;

    const button = document.createElement('button');
    button.className = 'play-btn';
    button.type = 'button';
    button.textContent = currentMode === 'words'
      ? 'Play Word'
      : 'Play Sentence';
    button.disabled = currentMode === 'words'
      ? !card.wordAudio
      : !card.sentenceAudio;

    button.addEventListener('click', () => {
      playCard(card.key);
    });

    body.appendChild(title);

    if (
      currentMode === 'sentences' &&
      card.sentenceText &&
      card.sentenceText !== displayTitle
    ) {
      const sentence = document.createElement('p');
      sentence.className = 'card-text';
      sentence.textContent = card.sentenceText;
      body.appendChild(sentence);
    }

    body.appendChild(button);
    article.appendChild(body);
    container.appendChild(article);
  });
}

function renderAudioElements() {
  document.querySelectorAll('audio[data-card-audio]').forEach((audio) => {
    audio.remove();
  });

  currentCards.forEach((card) => {
    if (card.wordAudio) {
      const wordAudio = document.createElement('audio');
      wordAudio.dataset.cardAudio = 'true';
      wordAudio.id = `audio-${card.key}-words`;
      wordAudio.src = card.wordAudio;
      wordAudio.preload = 'auto';
      document.body.appendChild(wordAudio);
    }

    if (card.sentenceAudio) {
      const sentenceAudio = document.createElement('audio');
      sentenceAudio.dataset.cardAudio = 'true';
      sentenceAudio.id = `audio-${card.key}-sentences`;
      sentenceAudio.src = card.sentenceAudio;
      sentenceAudio.preload = 'auto';
      document.body.appendChild(sentenceAudio);
    }
  });
}

function initCardPage(cards, defaultMode = 'words') {
  const container = document.getElementById('card-container');
  if (!container) return;

  currentCards = cards;
  currentMode = defaultMode === 'sentences' && hasSentenceMode(cards)
    ? 'sentences'
    : 'words';

  renderAudioElements();
  updateTabUI(currentMode);
  renderCards();
}
