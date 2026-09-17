# Kindergarten Daily Review App

## Overview

A lightweight, static client-side learning app for preschool/kindergarten.
Kids can select a group, review vocabulary cards, and play word + sentence audio.

- No build step
- No framework dependency
- Works offline where files are available
- Data-driven from `js/data.js`

## Project Structure

- `index.html`: sectioned home navigation
- `review.html`: shared Small, Middle, Big, and Alphabet review page
- `small.html`, `middle.html`, `big.html`, `alphabet.html`: compatibility redirects for older links
- `phonics.html`: Level 1 and Level 2 video-based phonics practice
- `css/main.css`: layout and UI styles
- `js/data.js`: groups and card data
- `js/data-old.js`: archived historical study data; keep for reference
- `js/index.js`: UI rendering, tab switching, and audio control
- `js/review-page.js`: reads the selected review group and initializes the shared page
- `assets/images/`: card image files
- `assets/audio/`: word/sentence audio files
- `review-admin-panel/`: admin interface (if used for dataset management)

## User Flow

1. Open `index.html`.
2. Choose a class or learning activity.
3. Class and Alphabet links open `review.html?group=<group>`.
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
- Audio elements are created only after the user presses Play; recordings are not preloaded on page load.
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
- [ ] each shared review group renders cards correctly
- [ ] initial review load creates no audio elements or recording requests
- [ ] word audio plays for cards with `wordAudio`
- [ ] sentence mode works where `sentenceAudio` exists
- [ ] sentence tab is disabled when no sentence cards exist
- [ ] cards with missing images still display cleanly
- [ ] new audio stops previous audio playback
- [ ] responsive and usable on small screens

## Deployment

- Fully static app; suitable for GitHub Pages, Netlify, Vercel, etc.
- `js/data.js` drives all group content; maintain the dataset to update.
