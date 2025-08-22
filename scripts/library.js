// scripts/library.js
import { getAllMedia, registerSW } from './app.js';
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
  // Use a simple regex for match highlighting
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
  // Fuzzy match on name and type
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
    a.href = `player.html?id=${item.id}`;
    // Highlight matches in name
    a.innerHTML = highlightMatch(item.name, filter);
    li.appendChild(a);

    // Optional: show meta
    const meta = document.createElement('span');
    meta.className = 'muted';
    meta.style.float = 'right';
    meta.textContent = item.type ? item.type.split('/')[0] : '';
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
