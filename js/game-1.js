let currentMode = "toddler";
let deck = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let boardLocked = false;
let currentAudio = null;

const cardsContainerEl = document.getElementById("memory-cards");
const movesDisplayEl = document.getElementById("moves-display");
const matchesDisplayEl = document.getElementById("matches-display");
const restartButtonEl = document.getElementById("restart-button");
const feedbackEl = document.getElementById("memory-feedback");

function shuffleArray(array) {
  const copy = [...array];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function stopCurrentAudio() {
  if (!currentAudio) return;

  currentAudio.pause();
  currentAudio.currentTime = 0;
  currentAudio = null;
}

function playAudio(src) {
  if (!src) return;

  stopCurrentAudio();
  currentAudio = new Audio(src);
  currentAudio.play().catch(() => {
    // Ignore playback errors
  });
}

function getModeData(mode) {
  return reviewData[mode] || [];
}

function getPlayableItems(mode) {
  return getModeData(mode).filter((item) => item.image && item.title);
}

function getPairCount(mode) {
  if (mode === "toddler") return 4;
  if (mode === "small") return 5;
  if (mode === "middle") return 6;
  return 6;
}

function buildDeck(mode) {
  const playableItems = shuffleArray(getPlayableItems(mode)).slice(0, getPairCount(mode));
  const cards = [];

  playableItems.forEach((item) => {
    cards.push({
      id: `${item.key}-word`,
      pairKey: item.key,
      type: "word",
      text: item.title,
      image: "",
      alt: item.alt || item.title,
      audio: item.wordAudio || ""
    });

    cards.push({
      id: `${item.key}-image`,
      pairKey: item.key,
      type: "image",
      text: "",
      image: item.image,
      alt: item.alt || item.title,
      audio: item.wordAudio || ""
    });
  });

  return shuffleArray(cards);
}

function updateStatus() {
  movesDisplayEl.textContent = `Moves: ${moves}`;
  matchesDisplayEl.textContent = `Matches: ${matchedPairs}`;
}

function setActiveTab(mode) {
  const tabs = document.querySelectorAll(".mode-tab");

  tabs.forEach((tab) => {
    const isActive = tab.id === `tab-${mode}`;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function createCardElement(card, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "memory-card";
  button.dataset.index = String(index);
  button.setAttribute("aria-label", "Memory card");

  const inner = document.createElement("div");
  inner.className = "memory-card-inner";

  const front = document.createElement("div");
  front.className = "memory-card-face memory-card-front";
  front.textContent = "?";

  const back = document.createElement("div");
  back.className = "memory-card-face memory-card-back";

  if (card.type === "word") {
    const word = document.createElement("span");
    word.className = "memory-card-word";
    word.textContent = card.text;
    back.appendChild(word);
  } else {
    const image = document.createElement("img");
    image.className = "memory-card-image";
    image.src = card.image;
    image.alt = card.alt;
    back.appendChild(image);
  }

  inner.appendChild(front);
  inner.appendChild(back);
  button.appendChild(inner);

  button.addEventListener("click", () => handleCardClick(index));

  return button;
}

function renderBoard() {
  cardsContainerEl.innerHTML = "";

  deck.forEach((card, index) => {
    const cardEl = createCardElement(card, index);
    cardsContainerEl.appendChild(cardEl);
  });
}

function getCardElements() {
  return cardsContainerEl.querySelectorAll(".memory-card");
}

function revealCard(index) {
  const cardEl = getCardElements()[index];
  if (!cardEl) return;

  cardEl.classList.add("is-flipped");
}

function hideCard(index) {
  const cardEl = getCardElements()[index];
  if (!cardEl) return;

  cardEl.classList.remove("is-flipped");
}

function markMatched(index) {
  const cardEl = getCardElements()[index];
  if (!cardEl) return;

  cardEl.classList.add("is-matched");
}

function resetTurn() {
  flippedCards = [];
  boardLocked = false;
}

function finishGame() {
  feedbackEl.textContent = `Great job! You matched all pairs in ${moves} moves.`;
}

function handleMismatch() {
  boardLocked = true;
  feedbackEl.textContent = "Try again.";

  setTimeout(() => {
    flippedCards.forEach((index) => hideCard(index));
    resetTurn();
  }, 850);
}

function handleMatch() {
  const [firstIndex, secondIndex] = flippedCards;

  markMatched(firstIndex);
  markMatched(secondIndex);

  matchedPairs += 1;
  updateStatus();

  const matchedCard = deck[firstIndex];
  playAudio(matchedCard.audio);
  feedbackEl.textContent = "Match!";

  resetTurn();

  if (matchedPairs === deck.length / 2) {
    finishGame();
  }
}

function checkForMatch() {
  const [firstIndex, secondIndex] = flippedCards;
  const firstCard = deck[firstIndex];
  const secondCard = deck[secondIndex];

  moves += 1;
  updateStatus();

  const isMatch =
    firstCard.pairKey === secondCard.pairKey &&
    firstCard.type !== secondCard.type;

  if (isMatch) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleCardClick(index) {
  if (boardLocked) return;

  const clickedCard = deck[index];
  const clickedEl = getCardElements()[index];

  if (!clickedCard || !clickedEl) return;
  if (clickedEl.classList.contains("is-flipped")) return;
  if (clickedEl.classList.contains("is-matched")) return;

  revealCard(index);
  flippedCards.push(index);

  if (clickedCard.audio) {
    playAudio(clickedCard.audio);
  }

  if (flippedCards.length === 2) {
    checkForMatch();
  }
}

function showEmptyState(message) {
  stopCurrentAudio();
  cardsContainerEl.innerHTML = "";
  feedbackEl.textContent = message;
  moves = 0;
  matchedPairs = 0;
  flippedCards = [];
  boardLocked = false;
  updateStatus();
}

function startGame(mode = currentMode) {
  currentMode = mode;
  setActiveTab(mode);
  stopCurrentAudio();

  deck = buildDeck(mode);
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  boardLocked = false;

  if (deck.length === 0) {
    showEmptyState("No matching cards added for this level yet.");
    return;
  }

  renderBoard();
  updateStatus();
  feedbackEl.textContent = "";
}

function setMode(mode) {
  startGame(mode);
}

if (restartButtonEl) {
  restartButtonEl.addEventListener("click", () => {
    startGame(currentMode);
  });
}

window.setMode = setMode;

startGame();