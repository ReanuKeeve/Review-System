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
const video = document.getElementById('phonics-video');
const lessonButtons = document.getElementById('lesson-buttons');
const currentLevel = document.getElementById('current-level');
const currentLesson = document.getElementById('current-lesson');
const pickerTitle = document.getElementById('lesson-picker-title');
const pickerHelp = document.getElementById('lesson-picker-help');
const lessonPanel = document.getElementById('phonics-lessons');
const status = document.getElementById('video-status');
const levelTabs = Array.from(document.querySelectorAll('[data-level]'));

function getVideoPath(level, lessonKey) {
  return 'assets/video/phonics/level-' + level + '/' + lessonKey + '.mp4';
}

function getLesson(level, lessonKey) {
  return phonicsLevels[level].lessons.find((lesson) => lesson.key === lessonKey);
}

function updatePlayer(autoplay = false) {
  const level = phonicsLevels[state.level];
  const lesson = getLesson(state.level, state.lesson);
  if (!lesson) return;

  video.pause();
  video.src = getVideoPath(state.level, lesson.key);
  video.load();
  video.setAttribute('aria-label', level.name + ' phonics video: ' + lesson.title);

  currentLevel.textContent = level.name + ' · ' + level.type;
  currentLesson.textContent = lesson.title;
  status.textContent = lesson.title + ' video selected.';

  lessonButtons.querySelectorAll('.lesson-button').forEach((button) => {
    const isActive = button.dataset.lesson === lesson.key;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

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
    button.setAttribute('aria-label', 'Play ' + lesson.title);
    button.setAttribute('aria-pressed', String(lesson.key === state.lesson));
    button.classList.toggle('active', lesson.key === state.lesson);

    if (beginsNewGroup) button.dataset.groupStart = 'true';

    button.addEventListener('click', () => {
      if (state.lesson === lesson.key) {
        video.currentTime = 0;
        video.play().catch(() => {});
        return;
      }

      state.lesson = lesson.key;
      updatePlayer(true);
    });

    fragment.appendChild(button);
    previousInitial = initial;
  });

  lessonButtons.appendChild(fragment);
}

function setLevel(nextLevel) {
  if (!phonicsLevels[nextLevel] || nextLevel === state.level) return;

  state.level = nextLevel;
  state.lesson = phonicsLevels[nextLevel].lessons[0].key;

  levelTabs.forEach((tab) => {
    const isActive = Number(tab.dataset.level) === nextLevel;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', String(isActive));
  });

  const activeTab = levelTabs.find((tab) => Number(tab.dataset.level) === nextLevel);
  lessonPanel.setAttribute('aria-labelledby', activeTab.id);

  renderLessonButtons();
  updatePlayer(false);
}

levelTabs.forEach((tab) => {
  tab.addEventListener('click', () => setLevel(Number(tab.dataset.level)));
});

video.addEventListener('error', () => {
  status.textContent = 'This video could not be loaded. Please choose another lesson.';
});

renderLessonButtons();
updatePlayer(false);
