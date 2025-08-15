// scripts/player.js
import { getMediaById, arrayBufferToObjectURL, getQueryParam, registerSW } from './app.js';
registerSW();

const video = document.getElementById('videoPlayer');
const audio = document.getElementById('audioPlayer');
const seekSlider = document.getElementById('seekSlider');
const volumeSlider = document.getElementById('volumeSlider');
const playPauseBtn = document.getElementById('playPauseBtn');
const titleEl = document.getElementById('nowPlayingTitle');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

let activeEl = null;
let duration = 0;

(async function init() {
  const id = getQueryParam('id');
  if (!id) {
    titleEl.textContent = 'No media selected';
    return;
  }
  const item = await getMediaById(id);
  if (!item || !item.data) {
    titleEl.textContent = 'Could not load media';
    return;
  }
  const url = arrayBufferToObjectURL(item.data, item.type || '');
  const isVideo = (item.type || '').startsWith('video');

  // Pick element and set up
  activeEl = isVideo ? video : audio;
  activeEl.style.display = 'block';
  (isVideo ? audio : video).style.display = 'none';
  activeEl.src = url;
  activeEl.preload = 'metadata';
  titleEl.textContent = `Now Playing: ${item.name}`;

  // events
  activeEl.addEventListener('loadedmetadata', () => {
    duration = isFinite(activeEl.duration) ? activeEl.duration : 0;
    seekSlider.max = 100;
    seekSlider.value = 0;
  });

  activeEl.addEventListener('timeupdate', () => {
    if (!duration || !isFinite(activeEl.duration)) duration = activeEl.duration || 0;
    if (duration > 0) {
      seekSlider.value = (activeEl.currentTime / duration) * 100;
    }
  });

  activeEl.addEventListener('ended', () => {
    // Could auto-advance queue here
  });
})();

function ensureActive() {
  if (!activeEl) return null;
  return activeEl;
}

playPauseBtn?.addEventListener('click', () => {
  const el = ensureActive();
  if (!el) return;
  if (el.paused) el.play(); else el.pause();
});

volumeSlider?.addEventListener('input', () => {
  const el = ensureActive();
  if (el) el.volume = Number(volumeSlider.value);
});

seekSlider?.addEventListener('input', () => {
  const el = ensureActive();
  if (!el || !isFinite(el.duration) || el.duration <= 0) return;
  const pct = Number(seekSlider.value) / 100;
  el.currentTime = pct * el.duration;
});

// Basic keyboard shortcuts
document.addEventListener('keydown', (e) => {
  const el = ensureActive();
  if (!el) return;
  if (e.code === 'Space') { e.preventDefault(); el.paused ? el.play() : el.pause(); }
  if (e.key === 'j' || e.key === 'J') { el.currentTime = Math.max(0, el.currentTime - 10); }
  if (e.key === 'l' || e.key === 'L') { el.currentTime = Math.min(el.duration, el.currentTime + 10); }
  if (e.key === 'm' || e.key === 'M') { el.muted = !el.muted; }
});
