let currentMode = "small";
let deck = [];
let flippedCards = [];
let matchedPairs = 0;
let moves = 0;
let boardLocked = false;
let currentAudio = null;
let mismatchTimer = null;

const MEMORY_BEST_KEY = "review-memory-best-v1";
const cardsContainerEl = document.getElementById("memory-cards");
const movesDisplayEl = document.getElementById("moves-display");
const matchesDisplayEl = document.getElementById("matches-display");
const levelDisplayEl = document.getElementById("level-display");
const bestDisplayEl = document.getElementById("best-display");
const restartButtonEl = document.getElementById("restart-button");
const feedbackEl = document.getElementById("memory-feedback");
const modeTabs = Array.from(document.querySelectorAll(".mode-tab[data-mode]"));

function loadBestScores() {
  try {
    const savedScores = JSON.parse(localStorage.getItem(MEMORY_BEST_KEY));
    return savedScores && typeof savedScores === "object" ? savedScores : {};
  } catch {
    return {};
  }
}

let bestScores = loadBestScores();

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
    // Playback may be unavailable; the visual game remains usable.
  });
}

function getModeData(mode) {
  return reviewData[mode] || [];
}

function getPlayableItems(mode) {
  return getModeData(mode).filter((item) => item.image && item.title);
}

function getPairCount(mode) {
  if (mode === "small") return 5;
  return 6;
}

function getModeLabel(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function buildDeck(mode) {
  const playableItems = shuffleArray(getPlayableItems(mode)).slice(0, getPairCount(mode));
  const cards = [];

  playableItems.forEach((item) => {
    cards.push({
      pairKey: item.key,
      type: "word",
      text: item.title,
      image: "",
      alt: item.alt || item.title,
      audio: item.wordAudio || ""
    });
    cards.push({
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
  const totalPairs = deck.length / 2;
  movesDisplayEl.textContent = String(moves);
  matchesDisplayEl.textContent = `${matchedPairs} / ${totalPairs}`;
  levelDisplayEl.textContent = getModeLabel(currentMode);
  bestDisplayEl.textContent = bestScores[currentMode]
    ? `${bestScores[currentMode]} moves`
    : "—";
}

function setActiveTab(mode) {
  const gamePanel = document.getElementById("memory-game");

  modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === mode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
    tab.tabIndex = isActive ? 0 : -1;
  });

  gamePanel?.setAttribute("aria-labelledby", `tab-${mode}`);
}

function handleModeTabKeydown(event) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

  const currentIndex = modeTabs.indexOf(document.activeElement);
  if (currentIndex === -1) return;
  event.preventDefault();

  let nextIndex = currentIndex;
  if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % modeTabs.length;
  if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + modeTabs.length) % modeTabs.length;
  if (event.key === "Home") nextIndex = 0;
  if (event.key === "End") nextIndex = modeTabs.length - 1;

  modeTabs[nextIndex].focus();
  modeTabs[nextIndex].click();
}

function initModeTabs() {
  modeTabs.forEach((tab) => {
    tab.addEventListener("click", () => startGame(tab.dataset.mode));
  });
  modeTabs[0]?.closest('[role="tablist"]')?.addEventListener("keydown", handleModeTabKeydown);
}

function createCardElement(card, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "memory-card";
  button.dataset.index = String(index);
  button.setAttribute("aria-label", `Card ${index + 1}, face down`);
  button.setAttribute("aria-pressed", "false");

  const inner = document.createElement("span");
  inner.className = "memory-card-inner";
  inner.setAttribute("aria-hidden", "true");

  const front = document.createElement("span");
  front.className = "memory-card-face memory-card-front";
  front.textContent = "?";

  const back = document.createElement("span");
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
    image.alt = "";
    back.appendChild(image);
  }

  inner.append(front, back);
  button.appendChild(inner);
  button.addEventListener("click", () => handleCardClick(index));
  return button;
}

function renderBoard() {
  cardsContainerEl.replaceChildren(...deck.map(createCardElement));
}

function getCardElements() {
  return cardsContainerEl.querySelectorAll(".memory-card");
}

function revealCard(index) {
  const cardEl = getCardElements()[index];
  const card = deck[index];
  if (!cardEl || !card) return;

  cardEl.classList.add("is-flipped");
  cardEl.setAttribute("aria-pressed", "true");
  cardEl.setAttribute("aria-label", `${card.text || card.alt}, face up`);
}

function hideCard(index) {
  const cardEl = getCardElements()[index];
  if (!cardEl) return;

  cardEl.classList.remove("is-flipped");
  cardEl.setAttribute("aria-pressed", "false");
  cardEl.setAttribute("aria-label", `Card ${index + 1}, face down`);
}

function markMatched(index) {
  const cardEl = getCardElements()[index];
  if (!cardEl) return;

  cardEl.classList.add("is-matched");
  cardEl.setAttribute("aria-label", `${deck[index].text || deck[index].alt}, matched`);
  cardEl.setAttribute("aria-disabled", "true");
}

function resetTurn() {
  flippedCards = [];
  boardLocked = false;
}

function finishGame() {
  const previousBest = Number(bestScores[currentMode]) || 0;
  const isNewBest = previousBest === 0 || moves < previousBest;

  if (isNewBest) {
    bestScores[currentMode] = moves;
    try {
      localStorage.setItem(MEMORY_BEST_KEY, JSON.stringify(bestScores));
    } catch {
      // The game still works when browser storage is unavailable.
    }
  }

  updateStatus();
  feedbackEl.textContent = isNewBest
    ? `New best! You matched all pairs in ${moves} moves.`
    : `Great job! You matched all pairs in ${moves} moves.`;
}

function handleMismatch() {
  boardLocked = true;
  cardsContainerEl.setAttribute("aria-busy", "true");
  feedbackEl.textContent = "Not a match. Try again.";

  mismatchTimer = window.setTimeout(() => {
    flippedCards.forEach(hideCard);
    resetTurn();
    cardsContainerEl.setAttribute("aria-busy", "false");
    mismatchTimer = null;
  }, 850);
}

function handleMatch() {
  const [firstIndex, secondIndex] = flippedCards;
  markMatched(firstIndex);
  markMatched(secondIndex);
  matchedPairs += 1;
  updateStatus();
  feedbackEl.textContent = "Match!";
  resetTurn();

  if (matchedPairs === deck.length / 2) finishGame();
}

function checkForMatch() {
  const [firstIndex, secondIndex] = flippedCards;
  const firstCard = deck[firstIndex];
  const secondCard = deck[secondIndex];
  moves += 1;
  updateStatus();

  const isMatch = firstCard.pairKey === secondCard.pairKey && firstCard.type !== secondCard.type;
  if (isMatch) handleMatch();
  else handleMismatch();
}

function handleCardClick(index) {
  if (boardLocked) return;

  const clickedCard = deck[index];
  const clickedEl = getCardElements()[index];
  if (!clickedCard || !clickedEl) return;
  if (clickedEl.classList.contains("is-flipped") || clickedEl.classList.contains("is-matched")) return;

  revealCard(index);
  flippedCards.push(index);
  playAudio(clickedCard.audio);

  if (flippedCards.length === 2) checkForMatch();
}

function showEmptyState(message) {
  stopCurrentAudio();
  cardsContainerEl.replaceChildren();
  feedbackEl.textContent = message;
  moves = 0;
  matchedPairs = 0;
  flippedCards = [];
  boardLocked = false;
  cardsContainerEl.setAttribute("aria-busy", "false");
  updateStatus();
}

function startGame(mode = currentMode) {
  currentMode = mode;
  setActiveTab(mode);
  stopCurrentAudio();
  if (mismatchTimer !== null) window.clearTimeout(mismatchTimer);
  mismatchTimer = null;

  deck = buildDeck(mode);
  flippedCards = [];
  matchedPairs = 0;
  moves = 0;
  boardLocked = false;
  cardsContainerEl.setAttribute("aria-busy", "false");

  if (deck.length === 0) {
    showEmptyState("No matching cards have been added for this level yet.");
    return;
  }

  renderBoard();
  updateStatus();
  feedbackEl.textContent = "Choose a card to begin.";
}

restartButtonEl?.addEventListener("click", () => startGame(currentMode));
initModeTabs();
startGame();
