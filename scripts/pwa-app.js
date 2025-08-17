import { saveMedia, getAllMedia, getMediaById, deleteMedia, clearLibrary, arrayBufferToObjectURL, registerSW } from './db.js';

registerSW();

// Views
const views = {
  home: document.getElementById('view-home'),
  library: document.getElementById('view-library'),
  player: document.getElementById('view-player')
};
const navLinks = document.querySelectorAll('nav a');

navLinks.forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    showView(a.dataset.view);
  });
});

function showView(name) {
  Object.values(views).forEach(v => (v.style.display = 'none'));
  if (views[name]) views[name].style.display = 'block';
  navLinks.forEach(a => a.classList.toggle('active', a.dataset.view === name));
}

// Home logic (upload)
const filePicker = document.getElementById('filePicker');
const pickBtn = document.getElementById('pickBtn');
const dropzone = document.getElementById('dropzone');
const addStatus = document.getElementById('addStatus');
const recentList = document.getElementById('recentList');

pickBtn.addEventListener('click', () => filePicker.click());
filePicker.addEventListener('change', e => handleFiles(e.target.files));

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('hover'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('hover'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('hover');
  handleFiles(e.dataTransfer.files);
});

async function handleFiles(files) {
  if (!files || !files.length) return;
  let added = 0;
  for (const file of files) {
    // Allow common audio extensions explicitly; video is handled by video/*
    if (file.type.startsWith('audio') || file.type.startsWith('video') || /\.(m4a|ogg|mp3|wav)$/i.test(file.name)) {
      await saveMedia(file);
      added++;
    }
  }
  addStatus.textContent = `${added} file(s) added`;
  await loadRecent();
  await renderLibrary();
}

// Recent list
async function loadRecent() {
  const media = await getAllMedia();
  recentList.innerHTML = '';
  media.slice(-5).reverse().forEach(item => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = item.name;
    a.addEventListener('click', () => loadPlayer(item.id));
    li.appendChild(a);
    recentList.appendChild(li);
  });
}

// Library logic
const libraryList = document.getElementById('libraryList');
const searchInput = document.getElementById('searchInput');
const emptyMsg = document.getElementById('emptyMsg');

async function renderLibrary(filter = '') {
  const media = await getAllMedia();
  libraryList.innerHTML = '';
  const filtered = media.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()));
  if (!filtered.length) { emptyMsg.style.display = 'block'; return; }
  emptyMsg.style.display = 'none';
  filtered.sort((a, b) => b.created - a.created).forEach(item => {
    const li = document.createElement('li');

    const a = document.createElement('a');
    a.href = '#';
    a.textContent = item.name;
    a.addEventListener('click', () => loadPlayer(item.id));
    li.appendChild(a);

    const delBtn = document.createElement('button');
    delBtn.textContent = '🗑️';
    delBtn.className = 'btn small danger';
    delBtn.addEventListener('click', async e => {
      e.stopPropagation();
      await deleteMedia(item.id);
      await renderLibrary(searchInput.value);
      await loadRecent();
    });
    li.appendChild(delBtn);

    libraryList.appendChild(li);
  });
}
searchInput.addEventListener('input', () => renderLibrary(searchInput.value));

// Player logic + PiP
const video = document.getElementById('videoPlayer');
const audio = document.getElementById('audioPlayer');
const videoWrap = document.getElementById('videoWrap');
const pipBtn = document.getElementById('pipBtn');

const seekSlider = document.getElementById('seekSlider');
const volumeSlider = document.getElementById('volumeSlider');
const playPauseBtn = document.getElementById('playPauseBtn');
const titleEl = document.getElementById('nowPlayingTitle');

let activeEl = null;

async function loadPlayer(id) {
  const item = await getMediaById(id);
  if (!item) return;

  const url = arrayBufferToObjectURL(item.data, item.type);
  const isVideo = item.type.startsWith('video');

  // Show/hide correct player
  activeEl = isVideo ? video : audio;
  if (isVideo) {
    video.src = url;
    videoWrap.style.display = '';
    video.style.display = '';
    audio.style.display = 'none';
    updatePipVisibility();
  } else {
    audio.src = url;
    audio.style.display = '';
    videoWrap.style.display = 'none';
    video.style.display = 'none';
  }

  titleEl.textContent = `Now Playing: ${item.name}`;
  showView('player');

  try { await activeEl.play(); } catch { /* autoplay may be blocked until user taps play */ }
}

playPauseBtn.addEventListener('click', () => {
  if (!activeEl) return;
  activeEl.paused ? activeEl.play() : activeEl.pause();
});

volumeSlider.addEventListener('input', () => { if (activeEl) activeEl.volume = volumeSlider.value; });
seekSlider.addEventListener('input', () => {
  if (activeEl && activeEl.duration) activeEl.currentTime = (seekSlider.value / 100) * activeEl.duration;
});
setInterval(() => {
  if (activeEl && activeEl.duration) seekSlider.value = (activeEl.currentTime / activeEl.duration) * 100;
}, 200);

// PiP support (standard + WebKit)
function pipSupported() {
  const std = 'pictureInPictureEnabled' in document && !video.disablePictureInPicture;
  const wk = typeof video.webkitSupportsPresentationMode === 'function'
          && typeof video.webkitSetPresentationMode === 'function';
  return std || wk;
}
function updatePipVisibility() {
  pipBtn.style.display = pipSupported() ? '' : 'none';
}
pipBtn.addEventListener('click', async () => {
  if (!pipSupported() || video.style.display === 'none') return;
  try {
    if ('pictureInPictureEnabled' in document && !video.disablePictureInPicture) {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await video.requestPictureInPicture();
      }
    } else if (typeof video.webkitSetPresentationMode === 'function') {
      const mode = video.webkitPresentationMode;
      video.webkitSetPresentationMode(mode === 'picture-in-picture' ? 'inline' : 'picture-in-picture');
    }
  } catch (err) {
    console.warn('PiP error:', err);
    alert('Picture in Picture not supported or blocked on this device.');
  }
});

// iOS Add to Home Screen (banner only if not standalone)
const a2hsBanner = document.getElementById('a2hsBanner');
const dismissBtn = document.getElementById('dismissA2HS');
function isiOS() { return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()); }
function isInStandaloneMode() { return ('standalone' in window.navigator) && window.navigator.standalone; }
if (isiOS() && !isInStandaloneMode() && !localStorage.getItem('a2hsDismissed')) {
  a2hsBanner.style.display = 'block';
}
dismissBtn.addEventListener('click', () => {
  a2hsBanner.style.display = 'none';
  localStorage.setItem('a2hsDismissed', 'true');
});

// Init
(async function init() {
  showView('home');
  await loadRecent();
  await renderLibrary();
  document.getElementById('year').textContent = new Date().getFullYear();
  updatePipVisibility();
})();
