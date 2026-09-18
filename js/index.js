let currentAudio = null;
let currentAudioId = null;
let isPlaying = false;
let currentMode = 'words';
let currentCards = [];
let audioRegistry = new Map();
let audioSourceRegistry = new Map();
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
  const existingAudio = audioRegistry.get(audioId);
  if (existingAudio) return existingAudio;

  const source = audioSourceRegistry.get(audioId);
  if (!source) return null;

  const audio = createAudioElement(audioId, source);
  audioRegistry.set(audioId, audio);
  document.body.appendChild(audio);
  return audio;
}

function playSound(audioId, cardKey) {
  const audio = getAudioElement(audioId);
  const playbackStatus = document.getElementById('audio-status');
  if (!audio) return;

  if (isPlaying) {
    if (currentAudioId === audioId) return;
    stopCurrentAudio();
  }

  currentAudio = audio;
  currentAudioId = audioId;
  currentAudio.currentTime = 0;

  setPlayingState(true, cardKey);
  const activeCard = currentCards.find((card) => card.key === cardKey);
  if (playbackStatus) {
    playbackStatus.textContent = 'Playing ' + (activeCard?.title || 'review audio') + '.';
  }

  playbackResetTimer = setTimeout(() => {
    cleanupPlayback(audio);
  }, AUDIO_RESET_TIMEOUT);

  audio.onended = () => {
    if (playbackStatus) playbackStatus.textContent = 'Playback finished.';
    cleanupPlayback(audio);
  };

  audio.onpause = () => {
    if (!audio.ended && currentAudioId === audioId) {
      cleanupPlayback(audio);
    }
  };

  audio.onerror = () => {
    if (playbackStatus) playbackStatus.textContent = 'This recording is unavailable.';
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
  const cardContainer = document.getElementById('card-container');
  const sentenceModeAvailable = hasSentenceMode(currentCards);

  if (wordsTab) {
    const isActive = mode === 'words';
    wordsTab.classList.toggle('active', isActive);
    wordsTab.setAttribute('aria-selected', String(isActive));
    wordsTab.tabIndex = isActive ? 0 : -1;
  }

  if (sentencesTab) {
    const isActive = mode === 'sentences' && sentenceModeAvailable;
    sentencesTab.disabled = !sentenceModeAvailable || isPlaying;
    sentencesTab.setAttribute('aria-disabled', String(!sentenceModeAvailable || isPlaying));
    sentencesTab.classList.toggle('active', isActive);
    sentencesTab.setAttribute('aria-selected', String(isActive));
    sentencesTab.tabIndex = isActive ? 0 : -1;
  }

  if (wordsTab) {
    wordsTab.disabled = isPlaying;
    wordsTab.setAttribute('aria-disabled', String(isPlaying));
  }

  if (cardContainer) {
    cardContainer.setAttribute('aria-labelledby', mode === 'sentences' ? 'tab-sentences' : 'tab-words');
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

  if (cardsToRender.length === 0) {
    const emptyCard = document.createElement('article');
    emptyCard.className = 'card empty-review-card';

    const title = document.createElement('h2');
    title.className = 'card-title';
    title.textContent = 'No review cards available yet.';

    const message = document.createElement('p');
    message.className = 'card-text';
    message.textContent = 'Please choose another class or check back later.';

    emptyCard.append(title, message);
    container.appendChild(emptyCard);
    updateTabUI(currentMode);
    return;
  }

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

function createAudioElement(id, src) {
  const audio = document.createElement('audio');
  audio.id = id;
  audio.src = src;
  audio.preload = 'none';
  audio.dataset.cardAudio = 'true';
  return audio;
}

function renderAudioElements() {
  stopCurrentAudio();
  audioRegistry.clear();
  audioSourceRegistry.clear();

  document.querySelectorAll('audio[data-card-audio]').forEach((audio) => {
    audio.remove();
  });

  currentCards.forEach((card) => {
    if (card.wordAudio) {
      const wordId = `audio-${card.key}-words`;
      audioSourceRegistry.set(wordId, card.wordAudio);
    }

    if (card.sentenceAudio) {
      const sentenceId = `audio-${card.key}-sentences`;
      audioSourceRegistry.set(sentenceId, card.sentenceAudio);
    }
  });
}

function handleTabKeydown(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

  const tabList = event.currentTarget;
  const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'))
    .filter((tab) => !tab.disabled);
  const currentIndex = tabs.indexOf(document.activeElement);
  if (currentIndex === -1 || tabs.length === 0) return;

  event.preventDefault();

  let nextIndex = currentIndex;
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
  if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = tabs.length - 1;

  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}

function initTabs() {
  const wordsTab = document.getElementById('tab-words');
  const sentencesTab = document.getElementById('tab-sentences');
  const tabList = wordsTab?.closest('[role="tablist"]');

  if (wordsTab) {
    wordsTab.onclick = () => setMode('words');
  }

  if (sentencesTab) {
    sentencesTab.onclick = () => setMode('sentences');
  }

  if (tabList && tabList.dataset.tabsReady !== 'true') {
    tabList.addEventListener('keydown', handleTabKeydown);
    tabList.dataset.tabsReady = 'true';
  }
}

function updateCardPage(cards, preferredMode = currentMode) {
  const container = document.getElementById('card-container');
  if (!container || !Array.isArray(cards)) return;

  currentCards = cards;
  currentMode = preferredMode === 'sentences' && hasSentenceMode(cards)
    ? 'sentences'
    : 'words';

  renderAudioElements();
  renderCards();
}

function initCardPage(cards, defaultMode = 'words') {
  initTabs();
  updateCardPage(cards, defaultMode);
}
