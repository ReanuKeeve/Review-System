const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
const phonicsSets = {
  early: { label: "A–I", letters: alphabet.slice(0, 9) },
  middle: { label: "J–R", letters: alphabet.slice(9, 18) },
  late: { label: "S–Z", letters: alphabet.slice(18) },
  all: { label: "A–Z", letters: alphabet },
};

const PHONICS_BEST_KEY = "review-phonics-game-best-v1";
const ALL_SET_QUESTION_COUNT = 10;
const PICTURES_PER_LETTER = 4;

let currentMode = "early";
let questions = [];
let questionIndex = 0;
let score = 0;
let streak = 0;
let bestStreak = 0;
let missedCurrentQuestion = false;
let questionComplete = false;
let imageErrorAttempts = 0;

const gamePanelEl = document.getElementById("phonics-game");
const questionCardEl = document.getElementById("question-card");
const imageEl = document.getElementById("phonics-card-image");
const letterButtonsEl = document.getElementById("letter-buttons");
const setDisplayEl = document.getElementById("set-display");
const scoreDisplayEl = document.getElementById("score-display");
const streakDisplayEl = document.getElementById("streak-display");
const bestDisplayEl = document.getElementById("best-display");
const progressEl = document.getElementById("question-progress");
const roundDisplayEl = document.getElementById("round-display");
const feedbackEl = document.getElementById("phonics-feedback");
const nextButtonEl = document.getElementById("next-button");
const restartButtonEl = document.getElementById("restart-button");
const roundCompleteEl = document.getElementById("round-complete");
const completeSummaryEl = document.getElementById("complete-summary");
const completeScoreEl = document.getElementById("complete-score");
const playAgainButtonEl = document.getElementById("play-again-button");
const letterAudioEl = document.getElementById("letter-audio");
const modeTabs = Array.from(document.querySelectorAll(".mode-tab[data-mode]"));

function shuffleArray(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function loadBestScores() {
  try {
    const saved = JSON.parse(localStorage.getItem(PHONICS_BEST_KEY));
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

let bestScores = loadBestScores();

function getCardNumber(letter, variant) {
  return alphabet.indexOf(letter) * PICTURES_PER_LETTER + variant + 1;
}

function getCardPath(letter, variant) {
  return `assets/images/phonics/l1/${getCardNumber(letter, variant)}.webp`;
}

function getQuestionLetters() {
  const setLetters = phonicsSets[currentMode].letters;
  const count = currentMode === "all" ? ALL_SET_QUESTION_COUNT : setLetters.length;
  return shuffleArray(setLetters).slice(0, count);
}

function makeChoices(correctLetter) {
  const preferredPool = phonicsSets[currentMode].letters.filter((letter) => letter !== correctLetter);
  const wrongChoices = shuffleArray(preferredPool).slice(0, 3);
  return shuffleArray([correctLetter, ...wrongChoices]);
}

function buildQuestions() {
  return getQuestionLetters().map((letter) => {
    const variant = Math.floor(Math.random() * PICTURES_PER_LETTER);
    return {
      letter,
      variant,
      image: getCardPath(letter, variant),
      choices: makeChoices(letter),
    };
  });
}

function getBestRecord() {
  const record = bestScores[currentMode];
  if (!record || typeof record !== "object") return null;
  return record;
}

function updateStatus() {
  const set = phonicsSets[currentMode];
  const best = getBestRecord();
  const currentNumber = Math.min(questionIndex + 1, questions.length);

  setDisplayEl.textContent = set.label;
  scoreDisplayEl.textContent = String(score);
  streakDisplayEl.textContent = String(streak);
  bestDisplayEl.textContent = best ? `${best.score} / ${best.total}` : "—";
  roundDisplayEl.textContent = `Card ${currentNumber} of ${questions.length}`;
  progressEl.max = Math.max(questions.length, 1);
  progressEl.value = Math.max(currentNumber, 1);
  progressEl.textContent = `${currentNumber} of ${questions.length}`;
}

function setActiveTab() {
  modeTabs.forEach((tab) => {
    const isActive = tab.dataset.mode === currentMode;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
    tab.tabIndex = isActive ? 0 : -1;
  });
  gamePanelEl.setAttribute("aria-labelledby", `tab-${currentMode}`);
}

function playLetterAudio(letter) {
  letterAudioEl.pause();
  letterAudioEl.src = `assets/audio/${letter}.mp3`;
  letterAudioEl.currentTime = 0;
  letterAudioEl.play().catch(() => {
    // Audio is reinforcement only; the visual game remains fully playable.
  });
}

function setChoiceButtonsDisabled(disabled) {
  letterButtonsEl.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled || button.classList.contains("wrong");
  });
}

function renderChoices(question) {
  const buttons = question.choices.map((letter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "letter-answer-button";
    button.dataset.letter = letter;
    button.setAttribute("aria-label", `Choice ${index + 1}: letter ${letter.toUpperCase()}`);
    button.innerHTML = `<span>${letter.toUpperCase()}</span><small>${letter}</small>`;
    button.addEventListener("click", () => chooseLetter(letter, button));
    return button;
  });
  letterButtonsEl.replaceChildren(...buttons);
}

function preloadUpcomingCard() {
  const nextQuestion = questions[questionIndex + 1];
  if (!nextQuestion) return;
  const preloadImage = new Image();
  preloadImage.src = nextQuestion.image;
}

function renderQuestion() {
  const question = questions[questionIndex];
  if (!question) return;

  missedCurrentQuestion = false;
  questionComplete = false;
  imageErrorAttempts = 0;
  nextButtonEl.hidden = true;
  nextButtonEl.textContent = questionIndex === questions.length - 1 ? "See results" : "Next card";
  feedbackEl.textContent = "Choose the beginning sound.";
  feedbackEl.dataset.tone = "";
  questionCardEl.classList.remove("answered");
  imageEl.src = question.image;
  imageEl.alt = `Phonics picture clue, card ${questionIndex + 1} of ${questions.length}`;
  renderChoices(question);
  updateStatus();
  preloadUpcomingCard();
}

function chooseLetter(letter, button) {
  if (questionComplete) return;
  const question = questions[questionIndex];
  if (!question) return;

  if (letter !== question.letter) {
    missedCurrentQuestion = true;
    streak = 0;
    button.classList.add("wrong");
    button.disabled = true;
    feedbackEl.textContent = "Listen to the first sound and try again.";
    feedbackEl.dataset.tone = "error";
    updateStatus();
    return;
  }

  questionComplete = true;
  button.classList.add("correct");
  setChoiceButtonsDisabled(true);
  questionCardEl.classList.add("answered");

  if (!missedCurrentQuestion) {
    score += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
    feedbackEl.textContent = `Great listening! It begins with ${letter.toUpperCase()}. You earned a star!`;
  } else {
    feedbackEl.textContent = `You found it! It begins with ${letter.toUpperCase()}.`;
  }
  feedbackEl.dataset.tone = "success";
  nextButtonEl.hidden = false;
  updateStatus();
  playLetterAudio(letter);
  nextButtonEl.focus();
}

function saveBestScore() {
  const previous = getBestRecord();
  const currentRate = questions.length ? score / questions.length : 0;
  const previousRate = previous?.total ? previous.score / previous.total : -1;
  const isNewBest = !previous || currentRate > previousRate;

  if (isNewBest) {
    bestScores[currentMode] = {
      score,
      total: questions.length,
      streak: bestStreak,
    };
    try {
      localStorage.setItem(PHONICS_BEST_KEY, JSON.stringify(bestScores));
    } catch {
      // The game still works when browser storage is unavailable.
    }
  }
  return isNewBest;
}

function showResults() {
  const isNewBest = saveBestScore();
  const perfect = score === questions.length;
  questionCardEl.hidden = true;
  roundCompleteEl.hidden = false;
  completeScoreEl.textContent = `${score} / ${questions.length}`;

  if (perfect) {
    completeSummaryEl.textContent = "Perfect! You found every sound on your first try.";
  } else if (isNewBest) {
    completeSummaryEl.textContent = `New best score! Your longest streak was ${bestStreak}.`;
  } else {
    completeSummaryEl.textContent = `You found every sound. Your longest streak was ${bestStreak}.`;
  }
  updateStatus();
  playAgainButtonEl.focus();
}

function nextQuestion() {
  if (!questionComplete) return;
  if (questionIndex >= questions.length - 1) {
    showResults();
    return;
  }
  questionIndex += 1;
  renderQuestion();
}

function startGame(mode = currentMode) {
  if (!phonicsSets[mode]) return;
  currentMode = mode;
  questions = buildQuestions();
  questionIndex = 0;
  score = 0;
  streak = 0;
  bestStreak = 0;
  letterAudioEl.pause();
  questionCardEl.hidden = false;
  roundCompleteEl.hidden = true;
  setActiveTab();
  renderQuestion();
}

function handleTabKeydown(event) {
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

modeTabs.forEach((tab) => {
  tab.addEventListener("click", () => startGame(tab.dataset.mode));
});
modeTabs[0]?.closest('[role="tablist"]')?.addEventListener("keydown", handleTabKeydown);
nextButtonEl.addEventListener("click", nextQuestion);
restartButtonEl.addEventListener("click", () => startGame());
playAgainButtonEl.addEventListener("click", () => startGame());
imageEl.addEventListener("error", () => {
  const question = questions[questionIndex];
  imageErrorAttempts += 1;

  if (question && imageErrorAttempts < PICTURES_PER_LETTER) {
    question.variant = (question.variant + 1) % PICTURES_PER_LETTER;
    question.image = getCardPath(question.letter, question.variant);
    imageEl.src = question.image;
    return;
  }

  feedbackEl.textContent = "This card could not load. Start a new game to try another set.";
  feedbackEl.dataset.tone = "error";
  setChoiceButtonsDisabled(true);
});

startGame();
