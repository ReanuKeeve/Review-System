const phonicsLevels = {
  1: {
    name: 'Level 1',
    type: 'Letter sound',
    pickerTitle: 'Choose a letter',
    pickerHelp: 'Tap any letter to change the video.',
    buttonLabel: 'Level 1 letter sounds',
    lessons: 'abcdefghijklmnopqrstuvwxyz'.split('').map((key) => ({
      key,
      label: key.toUpperCase(),
      title: 'Letter ' + key.toUpperCase(),
    })),
  },
  2: {
    name: 'Level 2',
    type: 'Word family',
    pickerTitle: 'Choose a sound',
    pickerHelp: 'Practice vowel sounds and word families.',
    buttonLabel: 'Level 2 phonics sounds and word families',
    lessons: [
      'a', 'ad', 'ag', 'am', 'an', 'ap', 'at',
      'e', 'ed', 'en', 'et',
      'i', 'ib', 'id', 'ig', 'in', 'ip', 'it', 'ix',
      'o', 'op', 'ot',
      'u', 'ub', 'ud', 'ug', 'um', 'un', 'up', 'ut',
    ].map((key) => ({
      key,
      label: key.toUpperCase(),
      title: key.length === 1
        ? 'Short ' + key.toUpperCase() + ' sound'
        : key.toUpperCase() + ' word family',
    })),
  },
};

const state = { level: 1, lesson: 'a' };
const completedLessons = new Set();
const PHONICS_STORAGE_KEY = 'daily-review-phonics-progress-v1';
const video = document.getElementById('phonics-video');
const lessonButtons = document.getElementById('lesson-buttons');
const currentLevel = document.getElementById('current-level');
const currentLesson = document.getElementById('current-lesson');
const pickerTitle = document.getElementById('lesson-picker-title');
const pickerHelp = document.getElementById('lesson-picker-help');
const lessonPanel = document.getElementById('phonics-lessons');
const status = document.getElementById('video-status');
const levelTabs = Array.from(document.querySelectorAll('[data-level]'));
const previousButton = document.getElementById('previous-lesson');
const nextButton = document.getElementById('next-lesson');
const progress = document.getElementById('lesson-progress');
const playerState = document.getElementById('player-state');

function getVideoPath(level, lessonKey) {
  return 'assets/video/phonics/level-' + level + '/' + lessonKey + '.mp4';
}

function getLesson(level, lessonKey) {
  return phonicsLevels[level].lessons.find((lesson) => lesson.key === lessonKey);
}

function getLessonToken(level, lessonKey) {
  return String(level) + ':' + lessonKey;
}

function restoreProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem(PHONICS_STORAGE_KEY));
    const savedLevel = Number(saved?.level);
    const savedLesson = saved?.lesson;

    if (phonicsLevels[savedLevel] && getLesson(savedLevel, savedLesson)) {
      state.level = savedLevel;
      state.lesson = savedLesson;
    }

    if (Array.isArray(saved?.completed)) {
      saved.completed.forEach((token) => completedLessons.add(token));
    }
  } catch {
    // Storage can be unavailable in private or restricted browsing contexts.
  }
}

function saveProgress() {
  try {
    localStorage.setItem(PHONICS_STORAGE_KEY, JSON.stringify({
      level: state.level,
      lesson: state.lesson,
      completed: Array.from(completedLessons),
    }));
  } catch {
    // The page still works when storage is unavailable.
  }
}

function updateNavigation() {
  const lessons = phonicsLevels[state.level].lessons;
  const lessonIndex = lessons.findIndex((lesson) => lesson.key === state.lesson);

  previousButton.disabled = lessonIndex <= 0;
  nextButton.disabled = lessonIndex >= lessons.length - 1;
  progress.textContent = (lessonIndex + 1) + ' of ' + lessons.length;
}

function updateLessonButtonStates() {
  lessonButtons.querySelectorAll('.lesson-button').forEach((button) => {
    const lesson = getLesson(state.level, button.dataset.lesson);
    const isActive = button.dataset.lesson === state.lesson;
    const isCompleted = completedLessons.has(getLessonToken(state.level, button.dataset.lesson));

    button.classList.toggle('active', isActive);
    button.classList.toggle('completed', isCompleted);
    button.setAttribute('aria-pressed', String(isActive));
    button.setAttribute('aria-label', 'Play ' + lesson.title + (isCompleted ? ', completed' : ''));
  });
}

function updatePlayer(autoplay = false, userInitiated = false) {
  const level = phonicsLevels[state.level];
  const lesson = getLesson(state.level, state.lesson);
  if (!lesson) return;

  const nextPath = getVideoPath(state.level, lesson.key);
  if (video.getAttribute('src') !== nextPath) {
    video.pause();
    video.setAttribute('src', nextPath);
    if (userInitiated) video.load();
  }

  video.setAttribute('aria-label', level.name + ' phonics video: ' + lesson.title);

  currentLevel.textContent = level.name + ' · ' + level.type;
  currentLesson.textContent = lesson.title;
  status.textContent = lesson.title + ' video selected.';
  playerState.textContent = 'Ready to play';
  updateLessonButtonStates();
  updateNavigation();
  saveProgress();

  if (autoplay) {
    video.play().catch(() => {
      status.textContent = lesson.title + ' video is ready. Press play to begin.';
    });
  }
}

function renderLessonButtons() {
  const level = phonicsLevels[state.level];
  const fragment = document.createDocumentFragment();
  let previousInitial = null;

  lessonButtons.innerHTML = '';
  lessonButtons.setAttribute('aria-label', level.buttonLabel);
  pickerTitle.textContent = level.pickerTitle;
  pickerHelp.textContent = level.pickerHelp;

  level.lessons.forEach((lesson) => {
    const button = document.createElement('button');
    const initial = lesson.key.charAt(0);
    const beginsNewGroup = state.level === 2 && previousInitial && initial !== previousInitial;

    button.type = 'button';
    button.className = 'lesson-button';
    button.dataset.lesson = lesson.key;
    button.textContent = lesson.label;
    const isCompleted = completedLessons.has(getLessonToken(state.level, lesson.key));
    button.setAttribute('aria-label', 'Play ' + lesson.title + (isCompleted ? ', completed' : ''));
    button.setAttribute('aria-pressed', String(lesson.key === state.lesson));
    button.classList.toggle('active', lesson.key === state.lesson);
    button.classList.toggle('completed', isCompleted);

    if (beginsNewGroup) button.dataset.groupStart = 'true';

    button.addEventListener('click', () => {
      if (state.lesson === lesson.key) {
        video.currentTime = 0;
        video.play().catch(() => {});
        return;
      }

      state.lesson = lesson.key;
      updatePlayer(true, true);
    });

    fragment.appendChild(button);
    previousInitial = initial;
  });

  lessonButtons.appendChild(fragment);
}

function syncLevelTabs() {
  levelTabs.forEach((tab) => {
    const isActive = Number(tab.dataset.level) === state.level;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  const activeTab = levelTabs.find((tab) => Number(tab.dataset.level) === state.level);
  lessonPanel.setAttribute('aria-labelledby', activeTab.id);
}

function setLevel(nextLevel) {
  if (!phonicsLevels[nextLevel] || nextLevel === state.level) return;

  state.level = nextLevel;
  state.lesson = phonicsLevels[nextLevel].lessons[0].key;

  syncLevelTabs();
  renderLessonButtons();
  updatePlayer(false, true);
}

function selectAdjacentLesson(offset) {
  const lessons = phonicsLevels[state.level].lessons;
  const currentIndex = lessons.findIndex((lesson) => lesson.key === state.lesson);
  const nextLesson = lessons[currentIndex + offset];
  if (!nextLesson) return;

  state.lesson = nextLesson.key;
  updatePlayer(true, true);
}

function handleLevelTabKeydown(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

  const currentIndex = levelTabs.indexOf(document.activeElement);
  if (currentIndex === -1) return;
  event.preventDefault();

  let nextIndex = currentIndex;
  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % levelTabs.length;
  if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + levelTabs.length) % levelTabs.length;
  if (event.key === 'Home') nextIndex = 0;
  if (event.key === 'End') nextIndex = levelTabs.length - 1;

  levelTabs[nextIndex].focus();
  levelTabs[nextIndex].click();
}

levelTabs.forEach((tab) => {
  tab.addEventListener('click', () => setLevel(Number(tab.dataset.level)));
});

levelTabs[0]?.closest('[role="tablist"]')?.addEventListener('keydown', handleLevelTabKeydown);
previousButton.addEventListener('click', () => selectAdjacentLesson(-1));
nextButton.addEventListener('click', () => selectAdjacentLesson(1));

video.addEventListener('playing', () => {
  playerState.textContent = 'Playing';
});

video.addEventListener('ended', () => {
  completedLessons.add(getLessonToken(state.level, state.lesson));
  playerState.textContent = 'Completed';
  status.textContent = currentLesson.textContent + ' completed.';
  updateLessonButtonStates();
  saveProgress();
});

video.addEventListener('error', () => {
  playerState.textContent = 'Unavailable';
  status.textContent = 'This video could not be loaded. Please choose another lesson.';
});

restoreProgress();
syncLevelTabs();
renderLessonButtons();
updatePlayer(false, false);
