# Kindergarten Daily Review App

## Overview

This is a lightweight, mobile-first web app designed to help parents review daily learning material with their children.

The app allows parents to:

* Select their child’s group
* View simple visual learning cards
* Tap images to hear teacher-recorded audio (words or sentences)

The focus is on **simplicity, speed, and usability on mobile devices**.

---

## Features

* 📱 Mobile-first design
* 🧸 Group selection (Toddler, Small Class, Middle & Big Class)
* 🖼️ Image-based learning cards
* 🔊 Tap-to-play audio for pronunciation
* ⚡ Lightweight (no frameworks, pure HTML/CSS/JS)

---

## Project Structure

```
REVIEW SYSTEM/
├── index.html
├── toddler.html
├── small.html
├── middle.html
├── css/
│   └── main.css
├── js/
│   ├── index.js
│   ├── data.js
│   └── render.js
├── assets/
│   ├── images/
│   └── audio/
└── README.md
```

---

## How It Works

1. User opens `index.html`
2. Selects a group
3. Navigates to a group page
4. Taps a card to play audio

Audio is handled via JavaScript to:

* prevent overlapping sounds
* stop previous audio when a new one plays

---

## Audio Handling Logic

Only one audio plays at a time:

```js
let currentAudio = null;

function playSound(id) {
  const newAudio = document.getElementById(id);
  if (!newAudio) return;

  if (currentAudio && currentAudio !== newAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = newAudio;
  newAudio.currentTime = 0;
  newAudio.play();
}
```

---

## Adding New Content

To add a new learning card:

1. Add image to:

```
assets/images/
```

2. Add audio file to:

```
assets/audio/
```

3. Add a new card in the HTML:

```html
<article class="card">
  <div class="image-frame">
    <img src="assets/images/example.png" alt="Example">
  </div>
  <div class="card-body">
    <h2 class="card-title">Example</h2>
    <button class="play-btn" onclick="playSound('audioX')">
      ▶ Play Audio
    </button>
  </div>
</article>

<audio id="audioX" src="assets/audio/example.mp3"></audio>
```

---

## Design Principles

* Keep UI simple and friendly
* Large tap areas for mobile
* Minimal text, focus on visuals
* Fast loading and responsiveness
* Clear interaction (tap → sound)

---

## Future Improvements

* Dynamic content using `data.js`
* Admin interface for teachers
* Sentence mode (word + sentence toggle)
* Progress tracking (localStorage)
* React refactor if the app scales

---

## Notes

This is an MVP (Minimum Viable Product) focused on validating the idea in a real kindergarten environment before adding complexity.
