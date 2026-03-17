let isPlaying = false;

function playSound(id) {
    if (isPlaying) return; // block clicks while playing

    const audio = document.getElementById(id);
    if (!audio) return;

    isPlaying = true;

    audio.currentTime = 0;
    audio.play();

    audio.onended = () => {
        isPlaying = false; // unlock when finished
    };
}