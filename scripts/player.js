// scripts/player.js
document.addEventListener('DOMContentLoaded', () => {
  const audio = document.getElementById('audioPlayer');
  const video = document.getElementById('videoPlayer');
  const playPauseBtn = document.getElementById('playPauseBtn');
  const playPauseIcon = document.getElementById('playPauseIcon');
  const replayBtn = document.getElementById('replayBtn');
  const seekSlider = document.getElementById('seekSlider');
  const volumeSlider = document.getElementById('volumeSlider');
  const muteBtn = document.getElementById('muteBtn');
  const muteIcon = document.getElementById('muteIcon');
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  const currentTimeEl = document.getElementById('currentTime');
  const durationEl = document.getElementById('duration');

  // Helper: format time mm:ss
  function formatTime(t) {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Determine which media element is in use (audio or video)
  function getActiveMedia() {
    return (video && video.style.display !== 'none') ? video : audio;
  }
  let media = getActiveMedia();

  // Always loop
  audio.loop = true;
  video.loop = true;

  // Play/pause toggle
  playPauseBtn.onclick = () => {
    if (media.paused) {
      media.play();
    } else {
      media.pause();
    }
  };

  // Replay
  replayBtn.onclick = () => {
    media.currentTime = 0;
    media.play();
  };

  // Mute/unmute
  muteBtn.onclick = () => {
    media.muted = !media.muted;
    updateMuteIcon();
  };
  function updateMuteIcon() {
    muteIcon.textContent = media.muted || media.volume === 0 ? "🔈" : "🔊";
  }

  // Fullscreen
  fullscreenBtn.onclick = () => {
    if (media.requestFullscreen) media.requestFullscreen();
    else if (media.webkitRequestFullscreen) media.webkitRequestFullscreen();
    else if (media.msRequestFullscreen) media.msRequestFullscreen();
  };

  // Seek slider
  seekSlider.oninput = () => {
    media.currentTime = (seekSlider.value / 100) * media.duration;
  };
  // Volume slider
  volumeSlider.oninput = () => {
    media.volume = volumeSlider.value;
    if (media.volume === 0) media.muted = true;
    else media.muted = false;
    updateMuteIcon();
  };

  // Progress/time update
  function updateProgress() {
    seekSlider.value = (media.currentTime / media.duration) * 100 || 0;
    currentTimeEl.textContent = formatTime(media.currentTime);
    durationEl.textContent = formatTime(media.duration);
  }

  media.ontimeupdate = updateProgress;
  media.onplay = () => { playPauseIcon.textContent = "⏸️"; };
  media.onpause = () => { playPauseIcon.textContent = "▶️"; };
  media.onvolumechange = updateMuteIcon;
  media.onloadedmetadata = () => {
    durationEl.textContent = formatTime(media.duration);
    seekSlider.value = (media.currentTime / media.duration) * 100 || 0;
    currentTimeEl.textContent = formatTime(media.currentTime);
    updateMuteIcon();
  };

  // Click progress bar to seek
  seekSlider.addEventListener('click', (e) => {
    const rect = seekSlider.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekSlider.value = pct * 100;
    media.currentTime = pct * media.duration;
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === "INPUT") return;
    switch (e.key) {
      case " ":
        playPauseBtn.click();
        e.preventDefault();
        break;
      case "ArrowLeft":
        media.currentTime = Math.max(0, media.currentTime - 5);
        break;
      case "ArrowRight":
        media.currentTime = Math.min(media.duration, media.currentTime + 5);
        break;
      case "ArrowUp":
        media.volume = Math.min(1, media.volume + 0.05);
        updateMuteIcon();
        break;
      case "ArrowDown":
        media.volume = Math.max(0, media.volume - 0.05);
        updateMuteIcon();
        break;
      case "m":
      case "M":
        muteBtn.click();
        break;
    }
  });

  // Always start at beginning, always loop
  media.addEventListener('ended', () => {
    media.currentTime = 0;
    media.play();
  });

  // If switching between audio/video, update event listeners accordingly
  function switchMedia(newMedia) {
    if (media === newMedia) return;
    media = newMedia;
    audio.loop = true;
    video.loop = true;
    updateProgress();
    updateMuteIcon();
    media.ontimeupdate = updateProgress;
    media.onplay = () => { playPauseIcon.textContent = "⏸️"; };
    media.onpause = () => { playPauseIcon.textContent = "▶️"; };
    media.onvolumechange = updateMuteIcon;
    media.onloadedmetadata = () => {
      durationEl.textContent = formatTime(media.duration);
      seekSlider.value = (media.currentTime / media.duration) * 100 || 0;
      currentTimeEl.textContent = formatTime(media.currentTime);
      updateMuteIcon();
    };
    media.addEventListener('ended', () => {
      media.currentTime = 0;
      media.play();
    });
  }

  // Export switchMedia if needed elsewhere:
  window.switchPlayerMedia = switchMedia;

  // Set initial volume
  volumeSlider.value = media.volume;
  updateMuteIcon();
  updateProgress();
});
