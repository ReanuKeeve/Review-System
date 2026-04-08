let currentAudio = null;
let currentAudioId = null;
let isPlaying = false;
let currentMode = 'words';
let currentCards = [];
let audioRegistry = new Map();
let playbackResetTimer = null;

const AUDIO_RESET_TIMEOUT = 12000;

function clearPlaybackResetTimer() {
  if (playbackResetTimer) {
    clearTimeout(playbackResetTimer);
    playbackResetTimer = null;
  }
}

function setPlayingState(playing, activeCardKey = null) {
  isPlaying = playing;

  const buttons = document.querySelectorAll('.play-btn');
  buttons.forEach((button) => {
    const buttonCardKey = button.dataset.cardKey;
    const isActiveButton = playing && activeCardKey && buttonCardKey === activeCardKey;

    button.disabled = playing;
    button.classList.toggle('is-playing', isActiveButton);
    button.textContent = isActiveButton
      ? 'Playing...'
      : currentMode === 'words'
        ? 'Play Word'
        : 'Play Sentence';
  });
}

function cleanupPlayback(audio = currentAudio) {
  clearPlaybackResetTimer();

  if (audio) {
    audio.onended = null;
    audio.onpause = null;
    audio.onerror = null;
    audio.onstalled = null;
    audio.onabort = null;
    audio.onwaiting = null;
    audio.oncanplay = null;
  }

  currentAudio = null;
  currentAudioId = null;
  setPlayingState(false);
}

function stopCurrentAudio() {
  if (!currentAudio) {
    cleanupPlayback(null);
    return;
  }

  const audioToStop = currentAudio;
  currentAudio = null;
  currentAudioId = null;

  audioToStop.onended = null;
  audioToStop.onpause = null;
  audioToStop.onerror = null;
  audioToStop.onstalled = null;
  audioToStop.onabort = null;
  audioToStop.onwaiting = null;
  audioToStop.oncanplay = null;

  audioToStop.pause();
  audioToStop.currentTime = 0;

  clearPlaybackResetTimer();
  setPlayingState(false);
}

function getAudioId(cardKey) {
  return `audio-${cardKey}-${currentMode}`;
}

function getAudioElement(audioId) {
  return audioRegistry.get(audioId) || document.getElementById(audioId);
}

function playSound(audioId, cardKey) {
  const audio = getAudioElement(audioId);
  if (!audio) return;

  if (isPlaying) {
    if (currentAudioId === audioId) return;
    stopCurrentAudio();
  }

  currentAudio = audio;
  currentAudioId = audioId;
  currentAudio.currentTime = 0;

  setPlayingState(true, cardKey);

  playbackResetTimer = setTimeout(() => {
    cleanupPlayback(audio);
  }, AUDIO_RESET_TIMEOUT);

  audio.onended = () => {
    cleanupPlayback(audio);
  };

  audio.onpause = () => {
    if (!audio.ended && currentAudioId === audioId) {
      cleanupPlayback(audio);
    }
  };

  audio.onerror = () => {
    cleanupPlayback(audio);
  };

  audio.onstalled = () => {
    clearPlaybackResetTimer();
    playbackResetTimer = setTimeout(() => {
      cleanupPlayback(audio);
    }, 3000);
  };

  audio.onabort = () => {
    cleanupPlayback(audio);
  };

  audio.onwaiting = () => {
    const activeButton = document.querySelector(`.play-btn[data-card-key="${cardKey}"]`);
    if (activeButton) {
      activeButton.textContent = 'Loading...';
    }
  };

  audio.oncanplay = () => {
    if (currentAudioId === audioId) {
      const activeButton = document.querySelector(`.play-btn[data-card-key="${cardKey}"]`);
      if (activeButton) {
        activeButton.textContent = 'Playing...';
      }
    }
  };

  audio.play().catch(() => {
    cleanupPlayback(audio);
  });
}

function hasSentenceAudio(card) {
  return Boolean(card.sentenceAudio);
}

function hasSentenceMode(cards) {
  return cards.some(hasSentenceAudio);
}

function playCard(cardKey) {
  const audioId = getAudioId(cardKey);
  playSound(audioId, cardKey);
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
    sentencesTab.disabled = !sentenceModeAvailable || isPlaying;
    sentencesTab.setAttribute('aria-disabled', String(!sentenceModeAvailable || isPlaying));
    sentencesTab.classList.toggle('active', isActive);
    sentencesTab.setAttribute('aria-selected', String(isActive));
  }

  if (wordsTab) {
    wordsTab.disabled = isPlaying;
    wordsTab.setAttribute('aria-disabled', String(isPlaying));
  }
}

function setMode(mode) {
  if (mode !== 'words' && mode !== 'sentences') return;
  if (mode === 'sentences' && !hasSentenceMode(currentCards)) return;
  if (mode === currentMode) return;
  if (isPlaying) return;

  stopCurrentAudio();
  currentMode = mode;
  updateTabUI(mode);
  renderCards();
}

function createCardButton(card) {
  const button = document.createElement('button');
  button.className = 'play-btn';
  button.type = 'button';
  button.dataset.cardKey = card.key;

  const hasAudio = currentMode === 'words'
    ? Boolean(card.wordAudio)
    : Boolean(card.sentenceAudio);

  button.textContent = currentMode === 'words' ? 'Play Word' : 'Play Sentence';
  button.disabled = !hasAudio || isPlaying;

  button.addEventListener('click', () => {
    if (!hasAudio) return;
    playCard(card.key);
  });

  return button;
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

    body.appendChild(createCardButton(card));
    article.appendChild(body);
    container.appendChild(article);
  });

  updateTabUI(currentMode);
}

function createAudioElement(id, src, preloadValue = 'metadata') {
  const audio = document.createElement('audio');
  audio.id = id;
  audio.src = src;
  audio.preload = preloadValue;
  audio.dataset.cardAudio = 'true';
  return audio;
}

function renderAudioElements() {
  stopCurrentAudio();
  audioRegistry.clear();

  document.querySelectorAll('audio[data-card-audio]').forEach((audio) => {
    audio.remove();
  });

  const fragment = document.createDocumentFragment();

  currentCards.forEach((card, index) => {
    const preloadValue = index < 3 ? 'auto' : 'metadata';

    if (card.wordAudio) {
      const wordId = `audio-${card.key}-words`;
      const wordAudio = createAudioElement(wordId, card.wordAudio, preloadValue);
      audioRegistry.set(wordId, wordAudio);
      fragment.appendChild(wordAudio);
    }

    if (card.sentenceAudio) {
      const sentenceId = `audio-${card.key}-sentences`;
      const sentenceAudio = createAudioElement(sentenceId, card.sentenceAudio, preloadValue);
      audioRegistry.set(sentenceId, sentenceAudio);
      fragment.appendChild(sentenceAudio);
    }
  });

  document.body.appendChild(fragment);
}

function initTabs() {
  const wordsTab = document.getElementById('tab-words');
  const sentencesTab = document.getElementById('tab-sentences');

  if (wordsTab) {
    wordsTab.onclick = () => setMode('words');
  }

  if (sentencesTab) {
    sentencesTab.onclick = () => setMode('sentences');
  }
}

function initCardPage(cards, defaultMode = 'words') {
  const container = document.getElementById('card-container');
  if (!container || !Array.isArray(cards)) return;

  currentCards = cards;
  currentMode = defaultMode === 'sentences' && hasSentenceMode(cards)
    ? 'sentences'
    : 'words';

  initTabs();
  renderAudioElements();
  renderCards();
}