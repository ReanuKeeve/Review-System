let currentAudio = null;
let currentButton = null;

function initDialoguePage(dialogues) {
  const container = document.getElementById('dialogue-container');

  if (!container) {
    console.error('Missing #dialogue-container element.');
    return;
  }

  if (!Array.isArray(dialogues) || dialogues.length === 0) {
    container.textContent = 'No dialogues found.';
    return;
  }

  container.innerHTML = '';

  dialogues.forEach((dialogue) => {
    container.appendChild(createDialogueCard(dialogue));
  });
}

function createDialogueCard(dialogue) {
  const card = document.createElement('article');
  card.className = 'dialogue-card';

  if (dialogue.unit) {
    const unit = document.createElement('p');
    unit.className = 'dialogue-unit';
    unit.textContent = dialogue.unit;
    card.appendChild(unit);
  }

  const questionRow = document.createElement('div');
  questionRow.className = 'dialogue-question-row';

  const question = document.createElement('h2');
  question.className = 'dialogue-question';
  question.textContent = dialogue.questionText;

  const questionButton = createAudioButton('▶ Question', dialogue.questionAudio);

  questionRow.append(question, questionButton);
  card.appendChild(questionRow);

  const answerTitle = document.createElement('p');
  answerTitle.className = 'answer-title';
  answerTitle.textContent = 'Choose your answer:';
  card.appendChild(answerTitle);

  const answerList = document.createElement('div');
  answerList.className = 'answer-list';

  dialogue.answers.forEach((answer) => {
    const answerButton = createAudioButton(answer.answerText, answer.answerAudio);
    answerButton.classList.add('answer-button');
    answerList.appendChild(answerButton);
  });

  card.appendChild(answerList);
  return card;
}

function createAudioButton(label, audioPath) {
  const button = document.createElement('button');
  button.className = 'audio-button';
  button.type = 'button';
  button.textContent = label;

  button.addEventListener('click', () => {
    playAudio(audioPath, button);
  });

  return button;
}

function playAudio(audioPath, button) {
  if (!audioPath) {
    console.warn('Missing audio path for this item.');
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  if (currentButton) {
    currentButton.classList.remove('playing');
  }

  currentAudio = new Audio(audioPath);
  currentButton = button;
  button.classList.add('playing');

  currentAudio.addEventListener('ended', () => {
    button.classList.remove('playing');
    currentAudio = null;
    currentButton = null;
  });

  currentAudio.addEventListener('error', () => {
    button.classList.remove('playing');
    currentAudio = null;
    currentButton = null;
    console.error(`Could not load audio: ${audioPath}`);
  });

  currentAudio.play();
}
