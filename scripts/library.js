// scripts/library.js
import { getAllMedia, getMediaById, arrayBufferToObjectURL, registerSW } from './app.js';
registerSW();

const libraryList = document.getElementById('libraryList');
const emptyMsg = document.getElementById('emptyMsg');
const searchInput = document.getElementById('searchInput');
const libraryLoading = document.getElementById('libraryLoading');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Basic fuzzy search function
function fuzzyMatch(str, query) {
  str = str.toLowerCase();
  query = query.toLowerCase().replace(/\s+/g, '');
  if (!query) return true;
  let si = 0, qi = 0;
  while (si < str.length && qi < query.length) {
    if (str[si] === query[qi]) qi++;
    si++;
  }
  return qi === query.length;
}

// Highlight matching query in text
function highlightMatch(text, query) {
  if (!query) return text;
  const escQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escQuery})`, 'ig');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

async function renderLibrary(filter = '') {
  if (libraryLoading) libraryLoading.style.display = 'flex';

  const media = await getAllMedia();

  if (libraryLoading) libraryLoading.style.display = 'none';

  libraryList.innerHTML = '';
  const norm = filter.trim().toLowerCase();
  const filtered = media
    .filter(i =>
      fuzzyMatch(i.name, norm) ||
      fuzzyMatch(i.type, norm)
    )
    .sort((a,b) => b.created - a.created);

  if (!filtered.length) {
    emptyMsg.style.display = 'block';
    return;
  }
  emptyMsg.style.display = 'none';

  for (const item of filtered) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = "#";
    a.innerHTML = highlightMatch(item.name, filter);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      playMediaInPlayer(item.id);
    });

    // Optional: show meta
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.style.float = 'right';
    meta.textContent = item.type ? item.type.split('/')[0] : '';
    li.appendChild(a);
    li.appendChild(meta);

    libraryList.appendChild(li);
  }
}

searchInput?.addEventListener('input', () => renderLibrary(searchInput.value));

// Show loading screen immediately if we have IndexedDB but no data yet
async function checkAndLoadLibrary() {
  if (libraryLoading) libraryLoading.style.display = 'flex';
  await renderLibrary();
  if (libraryLoading) libraryLoading.style.display = 'none';
}
checkAndLoadLibrary();

// In-page player logic!
async function playMediaInPlayer(id) {
  const media = await getMediaById(id);
  if (!media) return alert('Media not found!');

  // DOM elements for sections/views
  const viewHome = document.getElementById('view-home');
  const viewLibrary = document.getElementById('view-library');
  const viewPlayer = document.getElementById('view-player');
  // DOM elements for player
  const audio = document.getElementById('audioPlayer');
  const video = document.getElementById('videoPlayer');
  const nowPlayingTitle = document.getElementById('nowPlayingTitle');
  
  // Hide other views, show player view
  if (viewHome) viewHome.style.display = 'none';
  if (viewLibrary) viewLibrary.style.display = 'none';
  if (viewPlayer) viewPlayer.style.display = '';
  
  let url = arrayBufferToObjectURL(media.data, media.type);

  // Show and load appropriate player
  if (media.type.startsWith('video/')) {
    if (audio) {
      audio.pause();
      audio.removeAttribute('src');
      audio.style.display = 'none';
    }
    if (video) {
      video.src = url;
      video.style.display = '';
      video.load();
      video.play().catch(()=>{});
    }
  } else if (media.type.startsWith('audio/')) {
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.style.display = 'none';
    }
    if (audio) {
      audio.src = url;
      audio.style.display = '';
      audio.load();
      audio.play().catch(()=>{});
    }
  } else {
    alert("Unsupported media type.");
    return;
  }

  // Set media name as title
  if (nowPlayingTitle) nowPlayingTitle.textContent = media.name || "Now Playing";
}
