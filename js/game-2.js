let currentMode = "toddler";
let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedAnswer = "";
let submitted = false;
let currentAudio = null;

const imageEl = document.getElementById("question-image");
const answerButtonsEl = document.getElementById("answer-buttons");
const scoreDisplayEl = document.getElementById("score-display");
const progressDisplayEl = document.getElementById("progress-display");
const feedbackMessageEl = document.getElementById("feedback-message");
const submitButtonEl = document.getElementById("submit-button");
const nextButtonEl = document.getElementById("next-button");
const restartButtonEl = document.getElementById("restart-button");

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
  return getModeData(mode).filter((item) => item.image && item.sentenceText);
}

function generateOptions(correctItem, items, optionCount = 3) {
  const wrongPool = items.filter(
    (item) => item.key !== correctItem.key && item.sentenceText
  );

  const selectedWrongItems = shuffleArray(wrongPool).slice(0, optionCount - 1);

  const options = [
    {
      text: correctItem.sentenceText,
      audio: correctItem.sentenceAudio || ""
    },
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

      if (options.length < 2) {
        return null;
      }

      return {
        key: item.key,
        image: item.image,
        alt: item.alt || item.title || "Question image",
        correct: item.sentenceText,
        correctAudio: item.sentenceAudio || "",
        options
      };
    })
    .filter(Boolean);
}

function updateStatus() {
  scoreDisplayEl.textContent = `Score: ${score}`;
  progressDisplayEl.textContent = `Question: ${
    questions.length === 0 ? 0 : currentQuestionIndex + 1
  } / ${questions.length}`;
}

function setActiveTab(mode) {
  const tabs = document.querySelectorAll(".mode-tab");

  tabs.forEach((tab) => {
    const isActive = tab.id === `tab-${mode}`;
    tab.classList.toggle("active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  });
}

function clearAnswers() {
  answerButtonsEl.innerHTML = "";
}

function getCurrentQuestion() {
  return questions[currentQuestionIndex];
}

function setButtonsDisabled(disabled) {
  const buttons = answerButtonsEl.querySelectorAll("button");

  buttons.forEach((button) => {
    button.disabled = disabled;
  });
}

function selectAnswer(answerText, audioSrc) {
  if (submitted) return;

  selectedAnswer = answerText;

  const buttons = answerButtonsEl.querySelectorAll("button");
  buttons.forEach((button) => {
    const isSelected = button.textContent === answerText;
    button.classList.toggle("selected", isSelected);
  });

  feedbackMessageEl.textContent = "";
  playAudio(audioSrc);
}

function handleSubmit() {
  if (submitted) return;

  const question = getCurrentQuestion();
  if (!question) return;

  if (!selectedAnswer) {
    feedbackMessageEl.textContent = "Please choose an answer first.";
    return;
  }

  submitted = true;
  setButtonsDisabled(true);

  const buttons = answerButtonsEl.querySelectorAll("button");

  buttons.forEach((button) => {
    const buttonText = button.textContent;

    if (buttonText === question.correct) {
      button.classList.add("correct");
    }

    if (buttonText === selectedAnswer && selectedAnswer !== question.correct) {
      button.classList.add("wrong");
    }
  });

  if (selectedAnswer === question.correct) {
    score += 1;
    feedbackMessageEl.textContent = "Correct!";
  } else {
    feedbackMessageEl.textContent = `Not quite. Correct answer: ${question.correct}`;
  }

  playAudio(question.correctAudio);
  updateStatus();

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  nextButtonEl.hidden = isLastQuestion;

  if (isLastQuestion) {
    feedbackMessageEl.textContent += ` Final score: ${score}/${questions.length}`;
  }
}

function renderAnswers(question) {
  clearAnswers();

  question.options.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-button";
    button.textContent = option.text;

    button.addEventListener("click", () => {
      selectAnswer(option.text, option.audio);
    });

    answerButtonsEl.appendChild(button);
  });
}

function showEmptyState(message) {
  stopCurrentAudio();
  clearAnswers();

  imageEl.removeAttribute("src");
  imageEl.alt = "";
  feedbackMessageEl.textContent = message;
  nextButtonEl.hidden = true;

  score = 0;
  currentQuestionIndex = 0;
  selectedAnswer = "";
  submitted = false;
  updateStatus();
}

function renderQuestion() {
  const question = getCurrentQuestion();

  if (!question) {
    showEmptyState("No sentence questions available for this level yet.");
    return;
  }

  selectedAnswer = "";
  submitted = false;
  feedbackMessageEl.textContent = "";
  nextButtonEl.hidden = true;

  imageEl.src = question.image;
  imageEl.alt = question.alt;

  renderAnswers(question);
  setButtonsDisabled(false);
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
    showEmptyState("No sentence questions added for this level yet.");
    return;
  }

  renderQuestion();
}

function setMode(mode) {
  startGame(mode);
}

if (submitButtonEl) {
  submitButtonEl.addEventListener("click", handleSubmit);
}

if (nextButtonEl) {
  nextButtonEl.addEventListener("click", nextQuestion);
}

if (restartButtonEl) {
  restartButtonEl.addEventListener("click", () => {
    startGame(currentMode);
  });
}

window.setMode = setMode;

startGame();