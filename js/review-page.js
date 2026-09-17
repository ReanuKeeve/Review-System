const reviewPageGroups = {
  small: {
    title: 'Small Class',
    subtitle: 'Practice this class’s words and sentences.',
    wordsLabel: 'Words',
    sentencesLabel: 'Sentences',
  },
  middle: {
    title: 'Middle Class',
    subtitle: 'Practice this class’s words and sentences.',
    wordsLabel: 'Words',
    sentencesLabel: 'Sentences',
  },
  big: {
    title: 'Big Class',
    subtitle: 'Practice this class’s words and sentences.',
    wordsLabel: 'Words',
    sentencesLabel: 'Sentences',
  },
  alphabet: {
    title: 'Alphabet',
    subtitle: 'Review the letters learned so far.',
    wordsLabel: 'Letters',
    sentencesLabel: 'Phonetics',
  },
};

function showInvalidReviewPage() {
  document.title = 'Review Not Found';
  document.getElementById('review-title').textContent = 'Review not found';
  document.getElementById('review-subtitle').textContent = 'Return home and choose a class or learning activity.';
  document.querySelector('.mode-tabs').hidden = true;
  document.getElementById('card-container').innerHTML = `
    <article class='card'>
      <div class='card-body'>
        <h2 class='card-title'>This review group is unavailable.</h2>
        <a class='play-button' href='index.html'>Return home</a>
      </div>
    </article>
  `;
}

function initReviewPage() {
  const params = new URLSearchParams(window.location.search);
  const requestedGroup = params.get('group') || document.body.dataset.reviewGroup;
  const settings = reviewPageGroups[requestedGroup];
  const cards = typeof reviewData === 'undefined' ? null : reviewData[requestedGroup];

  if (!settings || !Array.isArray(cards)) {
    showInvalidReviewPage();
    return;
  }

  document.title = settings.title + ' Review';
  document.body.dataset.group = requestedGroup;
  document.getElementById('review-title').textContent = settings.title;
  document.getElementById('review-subtitle').textContent = settings.subtitle;
  document.getElementById('tab-words').textContent = settings.wordsLabel;
  document.getElementById('tab-sentences').textContent = settings.sentencesLabel;

  initCardPage(cards);
}

document.addEventListener('DOMContentLoaded', initReviewPage);
