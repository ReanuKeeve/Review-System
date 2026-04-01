# Kindergarten Daily Review App

## Overview

A lightweight, static client-side learning app for preschool/kindergarten.
Kids can select a group, review vocabulary cards, and play word + sentence audio.

- No build step
- No framework dependency
- Works offline where files are available
- Data-driven from `js/data.js`

## Project Structure

- `index.html`: group selector
- `toddler.html`, `small.html`, `middle.html`, `big.html`: group pages that load the shared renderer
- `css/main.css`: layout and UI styles
- `js/data.js`: groups and card data
- `js/index.js`: UI rendering, tab switching, and audio control
- `assets/images/`: card image files
- `assets/audio/`: word/sentence audio files
- `review-admin-panel/`: admin interface (if used for dataset management)

## User Flow

1. Open `index.html`.
2. Click a group tile (`Toddler`, `Small`, `Middle`, `Big`).
3. Group page loads data and calls `initCardPage(reviewData.<group>)`.
4. `js/index.js` renders cards in `#card-container`.
5. Use tabs to switch between `Words` and `Sentences` (if available).
6. Tap card audio buttons to play the audio.

## Data Model (js/data.js)

Each card object supports word and optional sentence mode:

```js
{
  key: 'happy',
  title: 'Happy',
  image: 'assets/images/happy.webp',
  alt: 'Smiling bear',
  wordAudio: 'assets/audio/happy.mp3',
  sentenceText: 'I am happy.',
  sentenceAudio: 'assets/audio/happy-sentence.mp3'
}
```

Rules
- `image` may be `''` for text-only cards.
- `sentenceText` and `sentenceAudio` may be omitted or empty when no sentence variation exists.
- Sentence tab is enabled when at least one card in that group has `sentenceAudio`.

## Behavior

- One audio source plays at a time; playing new audio stops + rewinds previous.
- `Words` mode: show every card in the group.
- `Sentences` mode: show only cards with `sentenceAudio`.
- If sentence mode is unavailable, tab is shown disabled.

## Add/Update Content

1. Add image under `assets/images/`.
2. Add word/sentence audio under `assets/audio/`.
3. Update the matching group array in `js/data.js`.
4. Reload the page.

Example card entry:

```js
{
  key: 'apple',
  title: 'Apple',
  image: 'assets/images/apple.webp',
  alt: 'Red apple',
  wordAudio: 'assets/audio/apple.mp3',
  sentenceText: 'This is an apple.',
  sentenceAudio: 'assets/audio/apple-sentence.mp3'
}
```

## QA Checklist

- [ ] `index.html` opens without JS errors
- [ ] each group page renders cards correctly
- [ ] word audio plays for cards with `wordAudio`
- [ ] sentence mode works where `sentenceAudio` exists
- [ ] sentence tab is disabled when no sentence cards exist
- [ ] cards with missing images still display cleanly
- [ ] new audio stops previous audio playback
- [ ] responsive and usable on small screens

## Deployment

- Fully static app; suitable for GitHub Pages, Netlify, Vercel, etc.
- `js/data.js` drives all group content; maintain the dataset to update.

