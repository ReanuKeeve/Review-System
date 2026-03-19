# Kindergarten Daily Review App

## About

This is a lightweight client-side review app for preschool and kindergarten classes.
Children can open a group page, view vocabulary cards, and play either word audio or sentence audio when available.

The project has no build step and no framework dependency. All content is driven from `js/data.js`.

## Current Structure

- `index.html`: class selection page
- `toddler.html`, `small.html`, `middle.html`, `big.html`: group pages that boot the shared card renderer
- `css/main.css`: layout and visual styles
- `js/data.js`: shared dataset for all groups
- `js/index.js`: card rendering, tab state, and audio playback logic
- `assets/images/`: card images
- `assets/audio/`: card audio files

## How It Works

1. Open `index.html`.
2. Choose a class level.
3. The selected page calls `initCardPage(reviewData.<group>)`.
4. `js/index.js` renders cards into `#card-container`.
5. Audio elements are created dynamically from the dataset.

## Card Data Model

Each card entry in `js/data.js` uses this shape:

```js
{
  key: 'happy',
  title: 'Happy',
  image: 'assets/images/happy.webp',
  alt: 'Happy bear',
  wordAudio: 'assets/audio/happy.mp3',
  sentenceText: 'I am happy.',
  sentenceAudio: 'assets/audio/happy-sentence.mp3'
}
```

Notes:

- `image` can be an empty string for text-only cards.
- `sentenceText` and `sentenceAudio` can be empty when a card only supports word mode.
- Sentence mode is available only when a group contains at least one card with `sentenceAudio`.

## Page Pattern

Each group page follows the same pattern:

- page header
- mode tabs
- `<section id="card-container"></section>`
- `js/data.js`
- `js/index.js`
- a small `DOMContentLoaded` block that calls `initCardPage(...)`

Example:

```html
<script src="js/data.js"></script>
<script src="js/index.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    initCardPage(reviewData.small);
  });
</script>
```

## Audio and Tabs

- Only one audio clip plays at a time.
- Starting a new clip stops and rewinds the previous one.
- Word mode renders all cards in the selected group.
- Sentence mode renders only cards that have `sentenceAudio`.
- If a group has no sentence audio, the `Sentences` tab stays visible but is disabled.

## Add or Update Cards

1. Add any required image to `assets/images/`.
2. Add any required audio to `assets/audio/`.
3. Update the correct group array in `js/data.js`.
4. Reload the relevant group page.

Example:

```js
{
  key: 'apple',
  title: 'Apple',
  image: 'assets/images/apple.webp',
  alt: 'Apple',
  wordAudio: 'assets/audio/apple.mp3',
  sentenceText: 'This is an apple.',
  sentenceAudio: 'assets/audio/apple-sentence.mp3'
}
```

## Manual Test Checklist

- [ ] `index.html` loads without JS errors
- [ ] each group page renders cards from `js/data.js`
- [ ] word audio plays for every card that defines `wordAudio`
- [ ] sentence mode works on groups with sentence audio
- [ ] sentence mode is disabled on groups without sentence audio
- [ ] cards without images still render cleanly
- [ ] starting a new clip stops the previous clip
- [ ] layout still works on mobile widths

## Notes

- The app is fully static and can be hosted on GitHub Pages.
- The current content is centralized in `js/data.js`, so most content updates do not require HTML changes.
