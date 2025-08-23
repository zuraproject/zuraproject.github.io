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

  // Always set loop on both
  audio.loop = true;
  video.loop = true;

  // Get the currently visible media element
  function getActiveMedia() {
    if (video.style.display !== 'none') return video;
    return audio;
  }

  // Unbind all events from a media element
  function unbindMediaEvents(m) {
    if (!m) return;
    m.ontimeupdate = null;
    m.onplay = null;
    m.onpause = null;
    m.onvolumechange = null;
    m.onloadedmetadata = null;
    m.onended = null;
  }

  // Bind all events to the current media element
  function bindMediaEvents(m) {
    if (!m) return;

    m.ontimeupdate = updateProgress;
    m.onplay = () => { playPauseIcon.textContent = "⏸️"; };
    m.onpause = () => { playPauseIcon.textContent = "▶️"; };
    m.onvolumechange = updateMuteIcon;
    m.onloadedmetadata = updateProgress;
    m.onended = () => {
      m.currentTime = 0;
      m.play();
    };
  }

  // Switch controls and events to the correct media element
  function switchMedia(newMedia) {
    if (!newMedia) return;
    if (window._currentMedia && window._currentMedia !== newMedia) {
      unbindMediaEvents(window._currentMedia);
    }
    window._currentMedia = newMedia;
    bindMediaEvents(newMedia);
    updateProgress();
    updateMuteIcon();
    volumeSlider.value = newMedia.volume;
  }

  // Update progress bar and times
  function updateProgress() {
    const m = window._currentMedia;
    if (!m) return;
    seekSlider.value = (m.currentTime / m.duration) * 100 || 0;
    currentTimeEl.textContent = formatTime(m.currentTime);
    durationEl.textContent = formatTime(m.duration);
  }

  // Update mute icon
  function updateMuteIcon() {
    const m = window._currentMedia;
    if (!m) return;
    muteIcon.textContent = m.muted || m.volume === 0 ? "🔈" : "🔊";
  }

  // Play/pause toggle
  playPauseBtn.onclick = () => {
    const m = window._currentMedia;
    if (!m) return;
    if (m.paused) m.play();
    else m.pause();
  };

  // Replay
  replayBtn.onclick = () => {
    const m = window._currentMedia;
    if (!m) return;
    m.currentTime = 0;
    m.play();
  };

  // Mute/unmute
  muteBtn.onclick = () => {
    const m = window._currentMedia;
    if (!m) return;
    m.muted = !m.muted;
    updateMuteIcon();
  };

  // Fullscreen (video only)
  fullscreenBtn.onclick = () => {
    const m = window._currentMedia;
    if (!m) return;
    if (m.tagName === "VIDEO") {
      if (m.requestFullscreen) m.requestFullscreen();
      else if (m.webkitRequestFullscreen) m.webkitRequestFullscreen();
      else if (m.msRequestFullscreen) m.msRequestFullscreen();
    }
  };

  // Seek slider
  seekSlider.oninput = () => {
    const m = window._currentMedia;
    if (!m || !m.duration) return;
    m.currentTime = (seekSlider.value / 100) * m.duration;
  };

  // Volume slider
  volumeSlider.oninput = () => {
    const m = window._currentMedia;
    if (!m) return;
    m.volume = volumeSlider.value;
    m.muted = m.volume === 0;
    updateMuteIcon();
  };

  // Click progress bar to seek
  seekSlider.addEventListener('click', (e) => {
    const m = window._currentMedia;
    if (!m || !m.duration) return;
    const rect = seekSlider.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekSlider.value = pct * 100;
    m.currentTime = pct * m.duration;
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === "INPUT") return;
    const m = window._currentMedia;
    if (!m) return;
    switch (e.key) {
      case " ":
        playPauseBtn.click();
        e.preventDefault();
        break;
      case "ArrowLeft":
        m.currentTime = Math.max(0, m.currentTime - 5);
        break;
      case "ArrowRight":
        m.currentTime = Math.min(m.duration, m.currentTime + 5);
        break;
      case "ArrowUp":
        m.volume = Math.min(1, m.volume + 0.05);
        updateMuteIcon();
        break;
      case "ArrowDown":
        m.volume = Math.max(0, m.volume - 0.05);
        updateMuteIcon();
        break;
      case "m":
      case "M":
        muteBtn.click();
        break;
    }
  });

  // This function should be called when you switch between audio and video:
  window.switchPlayerMedia = function(newMedia) {
    switchMedia(newMedia);
  };

  // Initial binding (pick which is visible)
  switchMedia(getActiveMedia());

  // If your app logic hides/shows video/audio, call: window.switchPlayerMedia(audio) or window.switchPlayerMedia(video)
});
