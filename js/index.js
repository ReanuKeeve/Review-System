let currentAudio = null;

function playSound(id) {
  const audio = document.getElementById(id);

  if (currentAudio && currentAudio !== audio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = audio;
  audio.currentTime = 0;
  audio.play();
}