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

  // Set loop always
  audio.loop = true;
  video.loop = true;

  function formatTime(t) {
    if (!isFinite(t)) return "0:00";
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function getActiveMedia() {
    return (video.style.display !== 'none') ? video : audio;
  }

  function updateMuteIcon(m) {
    muteIcon.textContent = m.muted || m.volume === 0 ? "🔈" : "🔊";
  }

  function updateProgress(m) {
    seekSlider.value = (m.currentTime / m.duration) * 100 || 0;
    currentTimeEl.textContent = formatTime(m.currentTime);
    durationEl.textContent = formatTime(m.duration);
  }

  function bindMediaEvents(m) {
    m.ontimeupdate = () => updateProgress(m);
    m.onplay = () => { playPauseIcon.textContent = "⏸️"; };
    m.onpause = () => { playPauseIcon.textContent = "▶️"; };
    m.onvolumechange = () => updateMuteIcon(m);
    m.onloadedmetadata = () => updateProgress(m);
    m.onended = () => {
      m.currentTime = 0;
      m.play();
    };
    // Set initial states
    updateMuteIcon(m);
    updateProgress(m);
    volumeSlider.value = m.volume;
  }

  function unbindMediaEvents(m) {
    m.ontimeupdate = null;
    m.onplay = null;
    m.onpause = null;
    m.onvolumechange = null;
    m.onloadedmetadata = null;
    m.onended = null;
  }

  // Use this after switching visible media element!
  function switchMedia(newMedia) {
    if (window._currentMedia && window._currentMedia !== newMedia) {
      unbindMediaEvents(window._currentMedia);
    }
    window._currentMedia = newMedia;
    bindMediaEvents(newMedia);
  }

  // --- Button events ---
  playPauseBtn.onclick = () => {
    const m = window._currentMedia;
    if (!m) return;
    if (m.paused) m.play();
    else m.pause();
  };

  replayBtn.onclick = () => {
    const m = window._currentMedia;
    if (!m) return;
    m.currentTime = 0;
    m.play();
  };

  muteBtn.onclick = () => {
    const m = window._currentMedia;
    if (!m) return;
    m.muted = !m.muted;
    updateMuteIcon(m);
  };

  fullscreenBtn.onclick = () => {
    const m = window._currentMedia;
    if (!m || m.tagName !== "VIDEO") return;
    // Try all possible fullscreen methods
    if (m.requestFullscreen) m.requestFullscreen();
    else if (m.webkitRequestFullscreen) m.webkitRequestFullscreen();
    else if (m.msRequestFullscreen) m.msRequestFullscreen();
    else if (m.webkitEnterFullscreen) m.webkitEnterFullscreen(); // iOS Safari
  };

  seekSlider.oninput = () => {
    const m = window._currentMedia;
    if (!m || !m.duration) return;
    m.currentTime = (seekSlider.value / 100) * m.duration;
  };

  volumeSlider.oninput = () => {
    const m = window._currentMedia;
    if (!m) return;
    // Set volume (0..1)
    m.volume = volumeSlider.value;
    // Set muted flag for 0
    m.muted = m.volume == 0;
    updateMuteIcon(m);
  };

  seekSlider.addEventListener('click', (e) => {
    const m = window._currentMedia;
    if (!m || !m.duration) return;
    const rect = seekSlider.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    seekSlider.value = pct * 100;
    m.currentTime = pct * m.duration;
  });

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
        volumeSlider.value = m.volume;
        updateMuteIcon(m);
        break;
      case "ArrowDown":
        m.volume = Math.max(0, m.volume - 0.05);
        volumeSlider.value = m.volume;
        updateMuteIcon(m);
        break;
      case "m":
      case "M":
        muteBtn.click();
        break;
    }
  });

  // Initial binding
  switchMedia(getActiveMedia());

  // Expose for app: call this after showing/hiding video or audio!
  window.switchPlayerMedia = switchMedia;
});
