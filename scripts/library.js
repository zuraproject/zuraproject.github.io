// scripts/library.js
import { getAllMedia, registerSW } from './app.js';
registerSW();

const libraryList = document.getElementById('libraryList');
const emptyMsg = document.getElementById('emptyMsg');
const searchInput = document.getElementById('searchInput');
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

async function renderLibrary(filter = '') {
  const media = await getAllMedia();
  libraryList.innerHTML = '';
  const norm = filter.trim().toLowerCase();
  const filtered = media
    .filter(i => i.name.toLowerCase().includes(norm) || i.type.toLowerCase().includes(norm))
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
    a.textContent = `${item.name}`;
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
renderLibrary();
