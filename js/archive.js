const archiveGroupLabels = {
  toddler: 'Toddler',
  small: 'Small Class',
  middle: 'Middle Class',
  big: 'Big Class',
  alphabet: 'Alphabet',
};

let activeArchiveGroup = 'small';
let archiveSearchTerm = '';

const archiveGroupButtons = Array.from(document.querySelectorAll('[data-archive-group]'));
const archiveSearchEl = document.getElementById('archive-search');
const archiveStatusEl = document.getElementById('archive-results-status');

function getArchiveGroupCards() {
  const cards = typeof reviewData === 'undefined' ? [] : reviewData[activeArchiveGroup];
  return Array.isArray(cards) ? cards : [];
}

function getFilteredArchiveCards() {
  const cards = getArchiveGroupCards();
  const query = archiveSearchTerm.trim().toLocaleLowerCase();
  if (!query) return cards;

  return cards.filter((card) => [
    card.title,
    card.alt,
    card.sentenceTitle,
    card.sentenceText,
  ].some((value) => String(value || '').toLocaleLowerCase().includes(query)));
}

function getVisibleArchiveCount(cards) {
  const sentenceMode = document.getElementById('tab-sentences')?.classList.contains('active');
  return sentenceMode
    ? cards.filter((card) => Boolean(card.sentenceAudio)).length
    : cards.length;
}

function updateArchiveStatus(cards) {
  const count = getVisibleArchiveCount(cards);
  const materialLabel = document.getElementById('tab-sentences')?.classList.contains('active')
    ? 'sentence'
    : 'word';
  const groupLabel = archiveGroupLabels[activeArchiveGroup];
  archiveStatusEl.textContent = `Showing ${count} archived ${materialLabel}${count === 1 ? '' : 's'} from ${groupLabel}.`;
}

function customizeArchiveEmptyState() {
  const emptyCard = document.querySelector('.empty-review-card');
  if (!emptyCard || !archiveSearchTerm.trim()) return;

  const title = emptyCard.querySelector('.card-title');
  const message = emptyCard.querySelector('.card-text');
  if (title) title.textContent = 'No archived materials match this search.';
  if (message) message.textContent = 'Try another search term or choose a different archived group.';
}

function updateArchiveGroupButtons() {
  archiveGroupButtons.forEach((button) => {
    const isActive = button.dataset.archiveGroup === activeArchiveGroup;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

function renderArchive() {
  const cards = getFilteredArchiveCards();
  updateCardPage(cards);
  updateArchiveGroupButtons();
  updateArchiveStatus(cards);
  customizeArchiveEmptyState();
}

function initArchive() {
  initCardPage(getFilteredArchiveCards());
  updateArchiveGroupButtons();
  updateArchiveStatus(getFilteredArchiveCards());

  archiveGroupButtons.forEach((button) => {
    button.addEventListener('click', () => {
      activeArchiveGroup = button.dataset.archiveGroup;
      renderArchive();
    });
  });

  archiveSearchEl.addEventListener('input', () => {
    archiveSearchTerm = archiveSearchEl.value;
    renderArchive();
  });

  document.querySelector('.review-mode-tabs')?.addEventListener('click', () => {
    const cards = getFilteredArchiveCards();
    updateArchiveStatus(cards);
    customizeArchiveEmptyState();
  });
}

document.addEventListener('DOMContentLoaded', initArchive);
