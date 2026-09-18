let currentMode = "small";
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = "";
let submitted = false;
let currentAudio = null;

const SENTENCE_BEST_KEY = "review-sentence-best-v1";
const imageEl = document.getElementById("question-image");
const answerButtonsEl = document.getElementById("answer-buttons");
const scoreDisplayEl = document.getElementById("score-display");
const progressDisplayEl = document.getElementById("progress-display");
const levelDisplayEl = document.getElementById("level-display");
const bestDisplayEl = document.getElementById("best-display");
const questionProgressEl = document.getElementById("question-progress");
const questionHeadingEl = document.getElementById("question-heading");
const feedbackMessageEl = document.getElementById("feedback-message");
const submitButtonEl = document.getElementById("submit-button");
const nextButtonEl = document.getElementById("next-button");
const restartButtonEl = document.getElementById("restart-button");
const modeTabs = Array.from(document.querySelectorAll(".mode-tab[data-mode]"));

function loadBestScores() {
  try {
    const savedScores = JSON.parse(localStorage.getItem(SENTENCE_BEST_KEY));
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
    // Playback may be unavailable; the visual quiz remains usable.
  });
}

function getModeData(mode) {
  return reviewData[mode] || [];
}

function getPlayableItems(mode) {
  return getModeData(mode).filter((item) => item.image && item.sentenceText);
}

function generateOptions(correctItem, items, optionCount = 3) {
  const wrongPool = items.filter((item) => item.key !== correctItem.key && item.sentenceText);
  const selectedWrongItems = shuffleArray(wrongPool).slice(0, optionCount - 1);
  const options = [
    { text: correctItem.sentenceText, audio: correctItem.sentenceAudio || "" },
    ...selectedWrongItems.map((item) => ({
      text: item.sentenceText,
      audio: item.sentenceAudio || ""
    }))
  ];
  return shuffleArray(options);
}

function buildQuestions(mode) {
  const items = getPlayableItems(mode);
  return items
    .map((item) => {
      const options = generateOptions(item, items);
      if (options.length < 2) return null;
      return {
        image: item.image,
        alt: item.alt || item.title || "Question image",
        correct: item.sentenceText,
        correctAudio: item.sentenceAudio || "",
        options
      };
    })
    .filter(Boolean);
}

function getModeLabel(mode) {
  return mode.charAt(0).toUpperCase() + mode.slice(1);
}

function getBestRecord(mode) {
  const record = bestScores[mode];
  if (record && typeof record === "object") return record;
  if (Number.isFinite(Number(record))) return { score: Number(record), total: questions.length };
  return null;
}

function updateStatus() {
  const questionNumber = questions.length === 0 ? 0 : currentQuestionIndex + 1;
  const bestRecord = getBestRecord(currentMode);

  scoreDisplayEl.textContent = String(score);
  progressDisplayEl.textContent = `${questionNumber} / ${questions.length}`;
  levelDisplayEl.textContent = getModeLabel(currentMode);
  bestDisplayEl.textContent = bestRecord ? `${bestRecord.score} / ${bestRecord.total}` : "—";
  questionProgressEl.max = Math.max(questions.length, 1);
  questionProgressEl.value = questionNumber;
  questionProgressEl.textContent = `${questionNumber} of ${questions.length}`;
  questionHeadingEl.textContent = questionNumber > 0 ? `Question ${questionNumber}` : "Question";
}

function setActiveTab(mode) {
  const gamePanel = document.getElementById("sentence-game");
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

function getCurrentQuestion() {
  return questions[currentQuestionIndex];
}

function setAnswerButtonsDisabled(disabled) {
  answerButtonsEl.querySelectorAll("button").forEach((button) => {
    button.disabled = disabled;
  });
}

function selectAnswer(answerText, audioSrc) {
  if (submitted) return;
  selectedAnswer = answerText;

  answerButtonsEl.querySelectorAll("button").forEach((button) => {
    const isSelected = button.dataset.answer === answerText;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-pressed", isSelected ? "true" : "false");
  });

  submitButtonEl.disabled = false;
  feedbackMessageEl.textContent = "Answer selected. Submit when you are ready.";
  feedbackMessageEl.dataset.tone = "";
  playAudio(audioSrc);
}

function saveBestScore() {
  const previousBest = getBestRecord(currentMode);
  const currentRate = questions.length ? score / questions.length : 0;
  const previousRate = previousBest?.total ? previousBest.score / previousBest.total : -1;
  const isNewBest = !previousBest || currentRate > previousRate;

  if (isNewBest) {
    bestScores[currentMode] = { score, total: questions.length };
    try {
      localStorage.setItem(SENTENCE_BEST_KEY, JSON.stringify(bestScores));
    } catch {
      // The game still works when browser storage is unavailable.
    }
  }
  return isNewBest;
}

function handleSubmit() {
  if (submitted || !selectedAnswer) return;
  const question = getCurrentQuestion();
  if (!question) return;

  submitted = true;
  setAnswerButtonsDisabled(true);
  submitButtonEl.disabled = true;

  answerButtonsEl.querySelectorAll("button").forEach((button) => {
    const answer = button.dataset.answer;
    if (answer === question.correct) button.classList.add("correct");
    if (answer === selectedAnswer && selectedAnswer !== question.correct) button.classList.add("wrong");
  });

  if (selectedAnswer === question.correct) {
    score += 1;
    feedbackMessageEl.textContent = "Correct!";
    feedbackMessageEl.dataset.tone = "success";
  } else {
    feedbackMessageEl.textContent = `Not quite. Correct answer: ${question.correct}`;
    feedbackMessageEl.dataset.tone = "error";
  }

  playAudio(question.correctAudio);
  updateStatus();

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  nextButtonEl.hidden = isLastQuestion;

  if (isLastQuestion) {
    const isNewBest = saveBestScore();
    updateStatus();
    feedbackMessageEl.textContent += ` Final score: ${score}/${questions.length}.`;
    if (isNewBest) feedbackMessageEl.textContent += " New best score!";
  }
}

function renderAnswers(question) {
  const buttons = question.options.map((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option.text;
    button.dataset.answer = option.text;
    button.setAttribute("aria-pressed", "false");
    button.addEventListener("click", () => selectAnswer(option.text, option.audio));
    return button;
  });
  answerButtonsEl.replaceChildren(...buttons);
}

function showEmptyState(message) {
  stopCurrentAudio();
  answerButtonsEl.replaceChildren();
  imageEl.removeAttribute("src");
  imageEl.alt = "";
  imageEl.hidden = true;
  feedbackMessageEl.textContent = message;
  feedbackMessageEl.dataset.tone = "";
  nextButtonEl.hidden = true;
  submitButtonEl.disabled = true;
  score = 0;
  currentQuestionIndex = 0;
  selectedAnswer = "";
  submitted = false;
  updateStatus();
}

function renderQuestion() {
  const question = getCurrentQuestion();
  if (!question) {
    showEmptyState("No sentence questions have been added for this level yet.");
    return;
  }

  selectedAnswer = "";
  submitted = false;
  submitButtonEl.disabled = true;
  nextButtonEl.hidden = true;
  feedbackMessageEl.textContent = "Choose an answer to begin.";
  feedbackMessageEl.dataset.tone = "";

  imageEl.src = question.image;
  imageEl.alt = question.alt;
  imageEl.hidden = false;
  renderAnswers(question);
  setAnswerButtonsDisabled(false);
  updateStatus();
}

function nextQuestion() {
  if (currentQuestionIndex >= questions.length - 1) return;
  currentQuestionIndex += 1;
  renderQuestion();
}

function startGame(mode = currentMode) {
  currentMode = mode;
  setActiveTab(mode);
  stopCurrentAudio();
  questions = shuffleArray(buildQuestions(mode));
  currentQuestionIndex = 0;
  score = 0;
  selectedAnswer = "";
  submitted = false;

  if (questions.length === 0) {
    showEmptyState("No sentence questions have been added for this level yet.");
    return;
  }
  renderQuestion();
}

submitButtonEl?.addEventListener("click", handleSubmit);
nextButtonEl?.addEventListener("click", nextQuestion);
restartButtonEl?.addEventListener("click", () => startGame(currentMode));
initModeTabs();
startGame();
